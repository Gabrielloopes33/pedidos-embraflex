import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { initializeDb, parseOrder } from './database';
import { ProductionOrder } from './types';
import wooCommerceApi from './woocommerce';

dotenv.config();

const app = express();
const port = 3001;

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


initializeDb().then(db => {
  console.log('Banco de dados SQLite conectado e inicializado.');

  // --- ROTA DE AUTENTICAÇÃO ---
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);
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
      let rows;
      if (user?.role === 'admin') {
        // Admin vê todas as ordens
        rows = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
      } else {
        // Vendedor vê apenas as suas ordens
        rows = await db.all('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', user?.id);
      }
      const orders = rows.map(parseOrder);
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
      const row = await db.get('SELECT * FROM orders WHERE id = ?', id);
      if (!row) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }
      // Admin pode ver qualquer ordem, vendedor só pode ver a sua
      if (user?.role !== 'admin' && row.userId !== user?.id) {
        return res.status(403).json({ message: 'Você não tem permissão para ver esta ordem.' });
      }
      const order = parseOrder(row);
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
      await db.run(
        `INSERT INTO orders (id, customerName, products, status, priority, notes, createdAt, history, comments, userId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      );
      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
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
      const row = await db.get('SELECT * FROM orders WHERE id = ?', id);
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

      await db.run(
        'UPDATE orders SET status = ?, history = ? WHERE id = ?',
        order.status,
        JSON.stringify(order.history),
        id
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
        const row = await db.get('SELECT * FROM orders WHERE id = ?', id);
        if (!row) {
            return res.status(404).json({ message: 'Ordem não encontrada.' });
        }
        // Regra: Vendedor só pode comentar no seu pedido, admin em qualquer um
        if (user?.role !== 'admin' && row.userId !== user?.id) {
            return res.status(403).json({ message: 'Você não tem permissão para comentar nesta ordem.' });
        }

        const order = parseOrder(row);
        order.comments.push({
            text,
            user: user?.username || 'Sistema',
            timestamp: new Date().toISOString(),
        });

        await db.run(
            'UPDATE orders SET comments = ? WHERE id = ?',
            JSON.stringify(order.comments),
            id
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

  