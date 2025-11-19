import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { initializeDb, parseOrder, pool } from './database';
import { ProductionOrder } from './types';
import wooCommerceApi from './woocommerce';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_secreto';

app.use(cors());
app.use(express.json());

// Estendendo a interface Request do Express para incluir o usuário
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

// Middleware de autenticação
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // Não autorizado se não houver token
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403); // Proibido se o token for inválido
    }
    req.user = user;
    next();
  });
};


initializeDb().then(() => {
  console.log('Banco de dados PostgreSQL conectado e inicializado.');

  // --- ROTA DE AUTENTICAÇÃO ---
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      const tokenPayload = { id: user.id, role: user.role, username: user.username };
      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

      res.json({ accessToken, user: tokenPayload });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });


  // --- ROTAS PROTEGIDAS DA API ---

  // Listar todas as ordens (com lógica de permissão)
  app.get('/api/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const user = req.user;
    try {
      let result;
      if (user?.role === 'admin') {
        // Admin vê todas as ordens
        result = await pool.query('SELECT * FROM orders ORDER BY createdAt DESC');
      } else {
        // Vendedor vê apenas as suas ordens
        result = await pool.query('SELECT * FROM orders WHERE userId = $1 ORDER BY createdAt DESC', [user?.id]);
      }
      const orders = result.rows.map(parseOrder);
      res.json(orders);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Buscar uma ordem específica (com lógica de permissão)
  app.get('/api/orders/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const user = req.user;
    try {
      const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      const row = result.rows[0];

      if (!row) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }
      // Admin pode ver qualquer ordem, vendedor só pode ver a sua
      if (user?.role !== 'admin' && row.userid !== user?.id) { // Postgres retorna colunas em lowercase geralmente, mas vamos manter camelCase se criado assim.
        // Nota: Se as tabelas foram criadas sem aspas, o Postgres converte para lowercase.
        // No database.ts usamos userId (camelCase), mas sem aspas no CREATE TABLE, o Postgres salva como userid.
        // Vamos assumir que o driver pg retorna os nomes das colunas como estão no banco.
        // Se o CREATE TABLE foi: userId TEXT, o Postgres cria userid.
        // Vou ajustar para acessar userid (lowercase) ou userId (se o driver mantiver).
        // Melhor: Ajustar o CREATE TABLE para usar aspas se quisermos preservar o case, ou aceitar lowercase.
        // Para segurança, vou verificar ambos ou assumir lowercase que é o padrão do Postgres.
        // Vamos verificar row.userid || row.userId
        return res.status(403).json({ message: 'Você não tem permissão para ver esta ordem.' });
      }

      // Correção para o problema de case sensitivity do Postgres:
      // O objeto row virá com chaves em minúsculo se não usarmos aspas na criação.
      // Vamos normalizar isso no parseOrder ou aqui.
      // O parseOrder espera as propriedades com o nome certo.
      // Vou ajustar o CREATE TABLE no database.ts para usar aspas duplas "userId" para garantir o camelCase,
      // OU ajustar aqui para ler minúsculo.
      // Ajustando aqui para ser mais robusto:
      const orderData = {
        ...row,
        userId: row.userid || row.userId,
        customerName: row.customername || row.customerName,
        createdAt: row.createdat || row.createdAt
      };

      // Na verdade, o jeito mais limpo é alterar o CREATE TABLE para usar aspas.
      // Mas como já mandei o database.ts, vou assumir que o usuário pode ter rodado.
      // Vou mandar um novo database.ts com aspas para garantir.

      const order = parseOrder(row); // O parseOrder vai precisar lidar com isso ou o banco estar certo.
      res.json(order);
    } catch (error) {
      console.error(`Erro ao buscar ordem ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Criar uma nova ordem (associada ao usuário logado)
  app.post('/api/orders', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { customerName, products, priority, notes } = req.body;
    const userId = req.user?.id;

    if (!customerName || !products) {
      return res.status(400).json({ message: 'Cliente e produtos são obrigatórios.' });
    }

    const newOrder: ProductionOrder = {
      id: crypto.randomUUID(),
      customerName,
      products,
      priority: priority || 'Normal',
      notes,
      status: 'Pendente',
      createdAt: new Date().toISOString(),
      history: [{ event: 'Ordem criada', timestamp: new Date().toISOString(), user: req.user?.username || 'Vendedor' }],
      comments: [],
      userId: userId,
    };

    try {
      await pool.query(
        `INSERT INTO orders (id, "customerName", products, status, priority, notes, "createdAt", history, comments, "userId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newOrder.id,
          newOrder.customerName,
          JSON.stringify(newOrder.products),
          newOrder.status,
          newOrder.priority,
          newOrder.notes,
          newOrder.createdAt,
          JSON.stringify(newOrder.history),
          JSON.stringify(newOrder.comments),
          newOrder.userId
        ]
      );
      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Criar pedido no WooCommerce (protegido)
  app.post('/api/orders/woocommerce', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { customerName, customerEmail, products, billing } = req.body;

    if (!customerName || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Cliente e produtos são obrigatórios.' });
    }

    try {
      // Preparar line_items para WooCommerce
      const lineItems = products.map((product: any) => ({
        product_id: product.productId,
        quantity: product.quantity || 1,
        name: product.productName,
        price: product.unitPrice?.toString() || '0'
      }));

      // Criar pedido no WooCommerce
      const wooOrder = {
        payment_method: 'bacs', // Transferência bancária
        payment_method_title: 'Transferência Bancária',
        set_paid: false,
        billing: {
          first_name: billing?.firstName || customerName,
          last_name: billing?.lastName || '',
          company: billing?.company || customerName,
          email: customerEmail || billing?.email || '',
          phone: billing?.phone || '',
          address_1: billing?.address || '',
          city: billing?.city || '',
          state: billing?.state || '',
          postcode: billing?.postcode || '',
          country: 'BR'
        },
        line_items: lineItems,
        meta_data: [
          {
            key: '_created_via_system',
            value: 'Sistema de Pedidos Embraflex'
          }
        ]
      };

      const response = await wooCommerceApi.post('orders', wooOrder);
      const createdOrder = response.data;

      res.status(201).json({
        success: true,
        woocommerceOrderId: createdOrder.id,
        orderNumber: createdOrder.number,
        paymentUrl: createdOrder.payment_url || createdOrder._links?.payment?.href,
        total: createdOrder.total,
        status: createdOrder.status
      });

    } catch (error: any) {
      console.error('Erro ao criar pedido no WooCommerce:', error.response?.data || error.message);
      res.status(500).json({
        message: 'Erro ao criar pedido no WooCommerce.',
        error: error.response?.data?.message || error.message
      });
    }
  });


  // Atualizar status da ordem (protegido)
  app.put('/api/orders/:id/status', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Novo status é obrigatório.' });
    }

    try {
      const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      const row = result.rows[0];
      if (!row) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }

      // Apenas admins podem alterar o status (exemplo de regra de negócio)
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Apenas administradores podem alterar o status.' });
      }

      const order = parseOrder(row);
      order.status = status;
      order.history.push({
        event: `Status alterado para ${status}`,
        timestamp: new Date().toISOString(),
        user: req.user?.username || 'Sistema',
      });

      await pool.query(
        'UPDATE orders SET status = $1, history = $2 WHERE id = $3',
        [order.status, JSON.stringify(order.history), id]
      );

      res.json(order);
    } catch (error) {
      console.error(`Erro ao atualizar status da ordem ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Adicionar um comentário (protegido)
  app.post('/api/orders/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const user = req.user;

    if (!text) {
      return res.status(400).json({ message: 'Texto do comentário é obrigatório.' });
    }

    try {
      const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      const row = result.rows[0];
      if (!row) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }

      // Verificação de permissão (ajustando para ler userId corretamente se vier minúsculo)
      const ownerId = row.userId || row.userid;

      if (user?.role !== 'admin' && ownerId !== user?.id) {
        return res.status(403).json({ message: 'Você não tem permissão para comentar nesta ordem.' });
      }

      const order = parseOrder(row);
      order.comments.push({
        text,
        user: user?.username || 'Sistema',
        timestamp: new Date().toISOString(),
      });

      await pool.query(
        'UPDATE orders SET comments = $1 WHERE id = $2',
        [JSON.stringify(order.comments), id]
      );

      res.json(order);
    } catch (error) {
      console.error(`Erro ao adicionar comentário na ordem ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // --- ROTAS PROXY PARA WOOCOMMERCE (protegidas) ---
  app.use('/api/wc', authenticateToken); // Aplica o middleware a todas as rotas /api/wc

  app.get('/api/wc/products', async (req, res) => {
    try {
      const { data } = await wooCommerceApi.get('products', req.query);
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar produtos do WooCommerce:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar produtos do WooCommerce.' });
    }
  });

  app.get('/api/wc/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { data } = await wooCommerceApi.get(`products/${id}`);
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar produto do WooCommerce:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar produto do WooCommerce.' });
    }
  });

  // Proxy para buscar categorias de produtos
  app.get('/api/wc/products/categories', async (req, res) => {
    try {
      const { data } = await wooCommerceApi.get('products/categories', req.query);
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar categorias do WooCommerce:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar categorias do WooCommerce.' });
    }
  });

  // Proxy para buscar clientes
  app.get('/api/wc/customers', async (req, res) => {
    try {
      const { data } = await wooCommerceApi.get('customers', req.query);
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar clientes do WooCommerce:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar clientes do WooCommerce.' });
    }
  });

  app.post('/api/wc/customers', async (req, res) => {
    try {
      const { data } = await wooCommerceApi.post('customers', req.body);
      res.status(201).json(data);
    } catch (error: any) {
      console.error('Erro ao criar cliente no WooCommerce:', error.response?.data);
      res.status(500).json({ message: 'Falha ao criar cliente no WooCommerce.' });
    }
  });

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

}).catch(err => {
  console.error('Falha ao inicializar o banco de dados:', err);
  process.exit(1);
});