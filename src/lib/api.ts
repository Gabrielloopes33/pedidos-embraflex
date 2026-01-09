import axios from 'axios';
import { NewProductionOrder, ProductionOrder } from './types';
import { authenticateUser, getCurrentUser } from './auth';
import { supabase } from './supabase';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

console.log('🔧 API Configuration:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL,
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 segundos (Render + Supabase podem ser lentos)
});

// Interceptor para adicionar o token de autenticação a cada requisição
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para detectar token expirado e redirecionar para login
apiClient.interceptors.response.use(
  (response) => {
    // Se a resposta for bem-sucedida, apenas retorna
    return response;
  },
  (error) => {
    // Se receber erro 401 (Unauthorized), significa que o token expirou ou é inválido
    if (error.response?.status === 401) {
      console.error('🔒 Token expirado ou inválido. Redirecionando para login...');
      
      // Limpar dados de autenticação do localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      
      // Redirecionar para a página de login
      window.location.href = '/login';
      
      // Retornar um erro customizado
      return Promise.reject(new Error('Sua sessão expirou. Por favor, faça login novamente.'));
    }
    
    // Para outros erros, apenas repassa
    return Promise.reject(error);
  }
);

// --- Autenticação ---
export const login = async (credentials: { username: string; password: string; }) => {
  console.log('🔐 Tentando autenticar:', credentials.username);
  
  // Primeiro validar localmente para feedback imediato
  const localUser = authenticateUser(credentials.username, credentials.password);
  
  if (!localUser) {
    throw new Error('Credenciais inválidas');
  }
  
  // Tentar autenticar no backend com timeout rápido (8s)
  try {
    console.log('📡 Tentando autenticação no backend...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, { timeout: 8000 });
    console.log('✅ Backend auth bem-sucedida! Usando token real.');
    return {
      accessToken: response.data.accessToken,
      user: response.data.user
    };
  } catch (error: any) {
    // Se falhar (timeout, offline, erro), usar modo local
    console.warn('⚠️ Backend indisponível, usando autenticação local:', error.message);
    
    // Gerar um token local válido (formato JWT-like para compatibilidade)
    const accessToken = `local-token-${localUser.id}-${Date.now()}`;
    
    console.log('✅ Login local bem-sucedido');
    return {
      accessToken,
      user: localUser
    };
  }
};


// --- Ordens de Produção ---
export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  const response = await apiClient.get('/orders');
  const orders = response.data as ProductionOrder[];
  
  // Filtrar pedidos por vendedor se não for admin
  const user = getCurrentUser();
  if (user && user.role === 'vendedor') {
    return orders.filter(order => order.vendedorId === user.id);
  }
  
  return orders;
};

export const createProductionOrder = async (order: NewProductionOrder): Promise<ProductionOrder> => {
  // Adicionar informações do vendedor ao pedido
  const user = getCurrentUser();
  
  // Gerar UUID simples
  const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  
  const newOrder: ProductionOrder = {
    id: uuid(),
    customerName: order.customerName,
    products: order.products,
    priority: order.priority || 'Normal',
    notes: order.notes,
    status: 'Pendente',
    createdAt: new Date().toISOString(),
    history: [{ 
      event: 'Ordem criada', 
      timestamp: new Date().toISOString(), 
      user: user?.name || user?.username || 'Sistema' 
    }],
    comments: [],
    userId: user?.id || 'unknown',
    vendedorId: user?.id || 'unknown',
    vendedorName: user?.name || user?.username || 'Sistema',
  };
  
  console.log('📤 [v2] Inserindo pedido DIRETO no Supabase (sem backend):', { 
    customerName: newOrder.customerName, 
    productsCount: newOrder.products?.length,
    orderId: newOrder.id
  });
  
  try {
    // Inserir diretamente no Supabase (ultra-rápido!)
    const { error } = await supabase
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

    if (error) {
      console.error('❌ Erro do Supabase:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Pedido criado com sucesso no Supabase:', newOrder.id);
    return newOrder;
  } catch (error: any) {
    console.error('❌ Erro ao criar pedido:', error);
    throw error;
  }
};

export const updateProductionOrderStatus = async (
  id: string,
  status: ProductionOrder['status']
): Promise<ProductionOrder> => {
  const response = await apiClient.put(`/orders/${id}/status`, { status });
  return response.data;
};

export const addProductionOrderComment = async (
  id: string,
  text: string
): Promise<ProductionOrder> => {
  // O usuário agora é identificado pelo token no backend
  const response = await apiClient.post(`/orders/${id}/comments`, { text });
  return response.data;
};

export const createWooCommerceOrder = async (orderData: {
  customerName: string;
  customerEmail?: string;
  products: any[];
  billing?: any;
}) => {
  const response = await apiClient.post('/orders/woocommerce', orderData);
  return response.data;
};

