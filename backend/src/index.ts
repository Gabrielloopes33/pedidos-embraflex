import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { initializeDb, parseOrder, supabase } from './database';
import { ProductionOrder } from './types';
import wooCommerceApi from './woocommerce';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_secreto';

// Configuração do CORS para permitir o frontend
app.use(cors({
  origin: [
    'https://extraordinary-shortbread-ca83bc.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
  console.log('Banco de dados Supabase conectado e inicializado.');

  // --- ROTA DE AUTENTICAÇÃO ---
  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .limit(1);

      if (error || !users || users.length === 0) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
      }

      const user = users[0];
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
      let query = supabase.from('orders').select('*').order('createdAt', { ascending: false });
      
      if (user?.role !== 'admin') {
        // Vendedor vê apenas as suas ordens
        query = query.eq('userId', user?.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const orders = (data || []).map(parseOrder);
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }

      // Admin pode ver qualquer ordem, vendedor só pode ver a sua
      if (user?.role !== 'admin' && data.userId !== user?.id) {
        return res.status(403).json({ message: 'Você não tem permissão para ver esta ordem.' });
      }

      const order = parseOrder(data);
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
      const { error } = await supabase
        .from('orders')
        .insert([{
          id: newOrder.id,
          customerName: newOrder.customerName,
          products: JSON.stringify(newOrder.products),
          status: newOrder.status,
          priority: newOrder.priority,
          notes: newOrder.notes,
          createdAt: newOrder.createdAt,
          history: JSON.stringify(newOrder.history),
          comments: JSON.stringify(newOrder.comments),
          userId: newOrder.userId
        }]);

      if (error) throw error;
      
      res.status(201).json(newOrder);
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Criar pedido no WooCommerce (protegido)
  app.post('/api/orders/woocommerce', authenticateToken, async (req: AuthenticatedRequest, res) => {
    const { customerName, customerEmail, products, billing } = req.body;

    console.log('📦 Dados recebidos para WooCommerce:', JSON.stringify(req.body, null, 2));

    if (!customerName || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Cliente e produtos são obrigatórios.' });
    }

    try {
      // Preparar line_items para WooCommerce
      const lineItems = products.map((product: any) => ({
        product_id: product.productId,
        quantity: product.quantity || 1,
        name: product.productName || 'Produto sem nome',
        price: product.unitPrice?.toString() || '0'
      }));

      console.log('🛒 Line items preparados:', JSON.stringify(lineItems, null, 2));

      // Criar pedido no WooCommerce
      const wooOrder = {
        payment_method: 'bacs', // Transferência bancária
        payment_method_title: 'Transferência Bancária',
        set_paid: false,
        billing: {
          first_name: billing?.firstName || customerName || 'Cliente',
          last_name: billing?.lastName || 'Embraflex',
          company: billing?.company || customerName || '',
          email: customerEmail || billing?.email || 'pedidos@embraflexbr.com.br',
          phone: billing?.phone || '(00) 00000-0000',
          address_1: billing?.address || 'Endereço não informado',
          city: billing?.city || 'São Paulo',
          state: billing?.state || 'SP',
          postcode: billing?.postcode || '00000-000',
          country: 'BR'
        },
        line_items: lineItems,
        meta_data: [
          {
            key: '_created_via_system',
            value: 'Sistema de Pedidos Embraflex'
          },
          ...(billing?.cpfCnpj ? [{
            key: '_billing_cpf_cnpj',
            value: billing.cpfCnpj
          }] : [])
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
      console.error('❌ Erro ao criar pedido no WooCommerce:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      res.status(500).json({
        message: 'Erro ao criar pedido no WooCommerce.',
        error: error.response?.data || error.message,
        details: error.response?.data
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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }

      // Apenas admins podem alterar o status (exemplo de regra de negócio)
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Apenas administradores podem alterar o status.' });
      }

      const order = parseOrder(data);
      order.status = status;
      order.history.push({
        event: `Status alterado para ${status}`,
        timestamp: new Date().toISOString(),
        user: req.user?.username || 'Sistema',
      });

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: order.status, 
          history: JSON.stringify(order.history) 
        })
        .eq('id', id);

      if (updateError) throw updateError;

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
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }

      if (user?.role !== 'admin' && data.userId !== user?.id) {
        return res.status(403).json({ message: 'Você não tem permissão para comentar nesta ordem.' });
      }

      const order = parseOrder(data);
      order.comments.push({
        text,
        user: user?.username || 'Sistema',
        timestamp: new Date().toISOString(),
      });

      const { error: updateError } = await supabase
        .from('orders')
        .update({ comments: JSON.stringify(order.comments) })
        .eq('id', id);

      if (updateError) throw updateError;

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