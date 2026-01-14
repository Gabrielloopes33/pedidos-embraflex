import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

import { initializeDb, parseOrder, supabase } from './database';
import { ProductionOrder } from './types';
import wooCommerceApi from './woocommerce';
import quotesRouter from './routes/quotes';
import signatureRouter from './routes/signature';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_super_secreto';

console.log('🚀 Embraflex Backend API v2.0 - Autenticação simplificada');

// Configuração do CORS para permitir o frontend
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'https://embraflex1.netlify.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Origin bloqueada pelo CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 horas de cache para preflight
};

app.use(cors(corsOptions));
app.use(express.json());

// Register quote routes
app.use('/api/quotes', quotesRouter);
app.use('/api/signature', signatureRouter);

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
  // Permitir requisições OPTIONS (preflight) sem autenticação
  if (req.method === 'OPTIONS') {
    return next();
  }

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

  // --- ROTA DE HEALTH CHECK ---
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Embraflex Backend API'
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Embraflex Backend API',
      database: 'connected'
    });
  });

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
      const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

      res.json({ accessToken, user: tokenPayload });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });


  // --- ROTAS DA API (SEM AUTENTICAÇÃO - USO INTERNO) ---

  // Listar todas as ordens
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const query = supabase.from('orders').select('*').order('createdAt', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Log para debug
      console.log('📦 Pedidos do Supabase (primeiro):', data?.[0]);
      
      const orders = (data || []).map(parseOrder);
      
      // Log do pedido parseado
      console.log('📦 Pedido parseado (primeiro):', orders?.[0]);
      
      res.json(orders);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Buscar uma ordem específica
  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
      }

      const order = parseOrder(data);
      res.json(order);
    } catch (error) {
      console.error(`Erro ao buscar ordem ${id}:`, error);
      res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  });

  // Criar uma nova ordem
  app.post('/api/orders', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { customerName, products, priority, notes, vendedorId, vendedorName } = req.body;

    console.log(`⏱️ [${new Date().toISOString()}] Iniciando criação de pedido`);

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
      history: [{ event: 'Ordem criada', timestamp: new Date().toISOString(), user: vendedorName || 'Sistema' }],
      comments: [],
      userId: vendedorId || 'unknown',
      vendedorId: vendedorId || 'unknown',
      vendedorName: vendedorName || 'Sistema',
    };

    try {
      console.log('📝 Preparando inserção no Supabase...');
      
      // Criar timeout manual de 30s
      const insertPromise = supabase
        .from('orders')
        .insert([{
          id: newOrder.id,
          customerName: newOrder.customerName,
          products: JSON.stringify(newOrder.products),
          status: newOrder.status,
          priority: newOrder.priority,
          createdAt: newOrder.createdAt,
          notes: newOrder.notes || null,
          history: JSON.stringify(newOrder.history),
          comments: JSON.stringify(newOrder.comments),
          userId: newOrder.userId,
          vendedorId: newOrder.vendedorId,
          vendedorName: newOrder.vendedorName,
        }]);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao inserir no Supabase')), 30000)
      );

      console.log('💾 Inserindo no Supabase...');
      const { error } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (error) throw error;
      
      const elapsed = Date.now() - startTime;
      console.log(`✅ Pedido criado com sucesso em ${elapsed}ms`);
      res.status(201).json(newOrder);
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ Erro ao criar ordem após ${elapsed}ms:`, error.message);
      res.status(500).json({ 
        message: 'Erro interno do servidor.', 
        error: error.message || String(error),
        elapsed: `${elapsed}ms`
      });
    }
  });

  // Criar pedido no WooCommerce (protegido)
  app.post('/api/orders/woocommerce', async (req: Request, res: Response) => {
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
  app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
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
      const order = parseOrder(data);
      order.status = status;
      order.history.push({
        event: `Status alterado para ${status}`,
        timestamp: new Date().toISOString(),
        user: 'Sistema',
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

  // Adicionar um comentário
  app.post('/api/orders/:id/comments', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { text } = req.body;

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

      const order = parseOrder(data);
      order.comments.push({
        text,
        user: 'Sistema',
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

  // --- ROTAS PROXY PARA WOOCOMMERCE (SEM AUTENTICAÇÃO) ---
  // REMOVIDO: app.use('/api/wc', authenticateToken); - Uso interno, não precisa auth

  app.get('/api/wc/products', async (req, res) => {
    try {
      console.log('📦 Buscando produtos do WooCommerce com params:', req.query);
      
      // Buscar a categoria "Interno" (ou "Interna")
      const { data: categories } = await wooCommerceApi.get('products/categories', {
        search: 'Interno',
        per_page: 10
      });
      
      let categoryId = null;
      if (categories && categories.length > 0) {
        // Procurar categoria com nome exato "Interno" ou "Interna"
        const internoCategory = categories.find((cat: any) => 
          cat.name.toLowerCase() === 'interno' || 
          cat.name.toLowerCase() === 'interna'
        );
        
        if (internoCategory) {
          categoryId = internoCategory.id;
          console.log(`📁 Categoria "${internoCategory.name}" encontrada com ID: ${categoryId}`);
        } else {
          console.warn('⚠️ Categoria "Interno" não encontrada nas categorias:', categories.map((c: any) => c.name));
        }
      } else {
        console.warn('⚠️ Nenhuma categoria encontrada com busca "Interno"');
      }
      
      // SEMPRE adicionar filtro de categoria - se não encontrou, retorna vazio
      if (!categoryId) {
        console.log('❌ Categoria Interno não encontrada - retornando lista vazia');
        return res.json([]);
      }
      
      const params = {
        ...req.query,
        category: categoryId.toString()
      };
      
      const { data } = await wooCommerceApi.get('products', params);
      console.log(`✅ ${data.length} produtos encontrados da categoria Interno`);
      res.json(data);
    } catch (error: any) {
      console.error('❌ Erro ao buscar produtos do WooCommerce:', error.response?.data || error.message);
      res.status(500).json({ 
        message: 'Falha ao buscar produtos do WooCommerce.',
        error: error.response?.data || error.message 
      });
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

  // Buscar preço variável por quantidade
  app.get('/api/wc/products/:id/price', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.query;
      
      const { data: product } = await wooCommerceApi.get(`products/${id}`);
      
      // Verificar tier pricing no meta_data
      let price = parseFloat(product.sale_price || product.price || product.regular_price || '0');
      
      if (quantity && product.meta_data) {
        const qty = parseInt(quantity as string, 10);
        const tierPricingMeta = product.meta_data.find(
          (meta: any) => meta.key === '_tier_pricing' || meta.key === 'tier_pricing'
        );

        if (tierPricingMeta && tierPricingMeta.value) {
          let tiers: any[] = [];
          
          if (typeof tierPricingMeta.value === 'string') {
            try {
              tiers = JSON.parse(tierPricingMeta.value);
            } catch (e) {
              console.warn('Erro ao parsear tier pricing:', e);
            }
          } else if (Array.isArray(tierPricingMeta.value)) {
            tiers = tierPricingMeta.value;
          }

          for (const tier of tiers) {
            const minQty = tier.min_qty || tier.min || 0;
            const maxQty = tier.max_qty || tier.max || null;
            
            if (qty >= minQty && (maxQty === null || qty <= maxQty)) {
              const tierPrice = parseFloat(tier.price || '0');
              if (!isNaN(tierPrice)) {
                price = tierPrice;
                break;
              }
            }
          }
        }
      }
      
      res.json({
        productId: product.id,
        productName: product.name,
        quantity: quantity ? parseInt(quantity as string, 10) : 1,
        price: price,
        formattedPrice: `R$ ${price.toFixed(2).replace('.', ',')}`
      });
    } catch (error: any) {
      console.error('Erro ao buscar preço do produto:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar preço do produto.' });
    }
  });

  // Buscar variações de um produto variável
  app.get('/api/wc/products/:id/variations', async (req, res) => {
    try {
      const { id } = req.params;
      const { data } = await wooCommerceApi.get(`products/${id}/variations`, {
        per_page: 100
      });
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar variações do produto:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar variações do produto.' });
    }
  });

  // Buscar variação específica de um produto
  app.get('/api/wc/products/:id/variations/:variationId', async (req, res) => {
    try {
      const { id, variationId } = req.params;
      const { data } = await wooCommerceApi.get(`products/${id}/variations/${variationId}`);
      res.json(data);
    } catch (error: any) {
      console.error('Erro ao buscar variação do produto:', error.response?.data);
      res.status(500).json({ message: 'Falha ao buscar variação do produto.' });
    }
  });

  // Proxy para buscar categorias de produtos (retorna as LINHAS, não as quantidades)
  app.get('/api/wc/products/categories', async (req, res) => {
    try {
      // Buscar todas as categorias
      const { data: allCategories } = await wooCommerceApi.get('products/categories', {
        per_page: 100
      });
      
      console.log('📁 Total de categorias do WooCommerce:', allCategories.length);
      
      // Encontrar quais categorias são parents (têm filhos)
      const parentIds = new Set(allCategories.map((cat: any) => cat.parent).filter((id: number) => id > 0));
      console.log('🔍 Parent IDs encontrados:', Array.from(parentIds));
      
      // As LINHAS são as categorias que aparecem como parent de outras categorias
      // (ex: Premium ID:245, Lisa ID:244, Basic ID:246, Personalizada ID:57)
      const lineCategories = allCategories.filter((cat: any) => parentIds.has(cat.id));
      
      console.log('📁 Linhas (categorias que são parents):', lineCategories.length);
      console.log('📋 Linhas encontradas:', lineCategories.map((c: any) => `${c.name} (ID: ${c.id})`));
      
      // Retornar apenas as linhas
      res.json(lineCategories);
    } catch (error: any) {
      console.error('❌ Erro ao buscar categorias do WooCommerce:', error.response?.data || error.message);
      res.status(500).json({ message: 'Falha ao buscar categorias do WooCommerce.' });
    }
  });

  // ========================================
  // ROTAS WOOCOMMERCE - SEM AUTENTICAÇÃO
  // ========================================
  
  // Proxy para buscar clientes (SEM autenticação - uso interno v2)
  app.get('/api/wc/customers', async (req: Request, res: Response) => {
    try {
      console.log('🔍 [V2-SEM-AUTH] Buscando todos os clientes do WooCommerce');
      
      const { data } = await wooCommerceApi.get('customers', {
        ...req.query,
        per_page: 100 // Aumentar limite para garantir que pegamos todos os clientes
      });
      
      console.log(`📊 Total de clientes retornados: ${data.length}`);
      
      // Retornar todos os clientes (sem filtro)
      res.json(data);
    } catch (error: any) {
      console.error('❌ Erro ao buscar clientes do WooCommerce:', error.response?.data || error.message);
      res.status(500).json({ message: 'Falha ao buscar clientes do WooCommerce.' });
    }
  });

  app.post('/api/wc/customers', async (req: Request, res: Response) => {
    try {
      console.log('📝 Recebendo requisição para criar cliente:', JSON.stringify(req.body, null, 2));
      
      // Filtrar meta_data existente para evitar duplicatas
      const existingMetaData = (req.body.meta_data || []).filter((meta: any) => 
        meta.key !== 'vendedor_name' && meta.key !== 'vendedor_id'
      );
      
      // Limpar campos vazios do billing para evitar problemas no WooCommerce
      const cleanBilling: any = {};
      if (req.body.billing) {
        Object.keys(req.body.billing).forEach(key => {
          const value = req.body.billing[key];
          // Só adiciona se não for string vazia
          if (value !== '' && value !== null && value !== undefined) {
            cleanBilling[key] = value;
          }
        });
      }
      
      // Criar objeto sem billing e meta_data originais
      const { billing, meta_data, ...restBody } = req.body;
      
      // Adicionar meta_data (sem vendedor já que não há autenticação)
      const customerData: any = {
        ...restBody,
        meta_data: existingMetaData
      };
      
      // Só adiciona billing se tiver campos válidos
      if (Object.keys(cleanBilling).length > 0) {
        customerData.billing = cleanBilling;
      }
      
      console.log('📤 Enviando para WooCommerce:', JSON.stringify(customerData, null, 2));
      
      const { data } = await wooCommerceApi.post('customers', customerData);
      console.log('✅ Cliente criado com sucesso:', data);
      res.status(201).json(data);
    } catch (error: any) {
      
      console.error('❌ Erro ao criar cliente no WooCommerce:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        requestBody: req.body
      });
      
      // Se o email já existe, tentar buscar o cliente existente
      if (error.response?.data?.code === 'registration-error-email-exists') {
        try {
          console.log('🔍 Email já existe, buscando cliente existente...');
          const { data: customers } = await wooCommerceApi.get('customers', {
            search: req.body.email,
            per_page: 1
          });
          
          if (customers && customers.length > 0) {
            const existingCustomer = customers[0];
            console.log('✅ Cliente existente encontrado:', existingCustomer.id);
            return res.status(200).json(existingCustomer);
          }
        } catch (searchError) {
          console.error('❌ Erro ao buscar cliente existente:', searchError);
        }
      }
      
      // Extrair mensagem de erro específica do WooCommerce
      let errorMessage = 'Falha ao criar cliente no WooCommerce.';
      let errorDetails = error.response?.data;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.data?.params) {
        // Erros de validação do WooCommerce
        const params = error.response.data.data.params;
        const paramErrors = Object.keys(params).map(key => `${key}: ${params[key]}`).join(', ');
        errorMessage = `Erro de validação: ${paramErrors}`;
      }
      
      res.status(error.response?.status || 500).json({ 
        message: errorMessage,
        error: errorDetails,
        details: errorDetails
      });
    }
  });

  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
  });

}).catch(err => {
  console.error('Falha ao inicializar o banco de dados:', err);
  process.exit(1);
});