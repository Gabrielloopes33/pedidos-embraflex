import axios from 'axios';
import { NewProductionOrder, ProductionOrder } from './types';
import { authenticateUser, getCurrentUser } from './auth';

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
  timeout: 5000, // 5 segundos de timeout
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
  
  // Primeiro validar localmente
  const user = authenticateUser(credentials.username, credentials.password);
  
  if (!user) {
    throw new Error('Credenciais inválidas');
  }
  
  // Gerar um token simulado
  const accessToken = `local-token-${user.id}-${Date.now()}`;
  
  console.log('✅ Login bem-sucedido:', { accessToken, user });
  
  // Tentar sincronizar com backend em background (sem bloquear)
  axios.post(`${API_BASE_URL}/auth/login`, credentials, { timeout: 3000 })
    .then(response => {
      console.log('✅ Backend sync bem-sucedida:', response.data);
      // Atualizar token se o backend retornar um diferente
      if (response.data.accessToken && response.data.accessToken !== accessToken) {
        localStorage.setItem('authToken', response.data.accessToken);
      }
    })
    .catch(error => {
      console.warn('⚠️ Backend sync falhou (continuando com auth local):', error.message);
    });
  
  return {
    accessToken,
    user
  };
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
  const orderWithVendedor = {
    ...order,
    vendedorId: user?.id,
    vendedorName: user?.name
  };
  
  const response = await apiClient.post('/orders', orderWithVendedor);
  return response.data;
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

