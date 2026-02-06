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

  // Tentar autenticar via API do backend PRIMEIRO
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, { timeout: 10000 });
    console.log('✅ JWT recebido do backend!');
    
    // Usar token JWT real do backend
    return {
      accessToken: response.data.accessToken,
      user: response.data.user
    };
  } catch (error: any) {
    // Se backend falhar, tentar validar localmente (FALLBACK)
    console.warn('⚠️ Backend indisponível, tentando validação local...', error?.message);
    
    const localUser = authenticateUser(credentials.username, credentials.password);
    
    if (!localUser) {
      // Se não estiver nem no backend nem na lista local, lançar erro
      throw new Error('Credenciais inválidas');
    }
    
    console.log('✅ Usuário local válido, usando token local fallback');
    
    // FALLBACK: usar token local se backend falhar
    const localToken = `local-token-${localUser.id}-${Date.now()}`;
    return {
      accessToken: localToken,
      user: localUser
    };
  }
};


// --- Ordens de Produção ---
export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  console.log('📋 Buscando pedidos DIRETO do Supabase');
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar pedidos:', error);
      throw new Error(error.message);
    }

    // Parse dos campos JSON
    const orders = (data || []).map((order: any) => ({
      ...order,
      products: typeof order.products === 'string' ? JSON.parse(order.products) : order.products,
      history: typeof order.history === 'string' ? JSON.parse(order.history) : order.history || [],
      comments: typeof order.comments === 'string' ? JSON.parse(order.comments) : order.comments || [],
    })) as ProductionOrder[];

    console.log('✅ Pedidos carregados do Supabase:', orders.length);
    
    // Filtrar pedidos por vendedor se não for admin
    const user = getCurrentUser();
    console.log('👤 Usuário atual:', user ? `${user.id} (${user.role})` : 'Nenhum');
    
    if (user && user.role === 'vendedor') {
      const filtered = orders.filter(order => {
        const match = String(order.vendedorId) === String(user.id);
        if (!match && orders.indexOf(order) < 5) { // Debugar os primeiros
             console.log(`⚠️ Pedido ${order.id} ignorado. Vendedor: ${order.vendedorId} vs User: ${user.id}`);
        }
        return match;
      });
      console.log(`🔍 Filtrados para vendedor ${user.id}:`, filtered.length, 'de', orders.length);
      return filtered;
    }
    
    return orders;
  } catch (error: any) {
    console.error('❌ Erro ao buscar pedidos:', error);
    throw error;
  }
};

export const createProductionOrderV2 = async (order: NewProductionOrder): Promise<ProductionOrder> => {
  // Adicionar informações do vendedor ao pedido
  const user = getCurrentUser();
  
  console.log('🔥🔥🔥 USANDO SUPABASE DIRETO V2 - SEM BACKEND! 🔥🔥🔥');
  console.log('👤 Usuário atual recuperado:', user);
  
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
    // NÃO incluir userId - deixar sem esse campo para evitar FK constraint
    vendedorId: user?.id || 'unknown',
    vendedorName: user?.name || user?.username || 'Sistema',
  };
  
  console.log('📤 [v3] Inserindo pedido DIRETO no Supabase (SEM userId):', { 
    customerName: newOrder.customerName, 
    userObject: user,
    vendedorId: newOrder.vendedorId,
    productsCount: newOrder.products?.length,
    orderId: newOrder.id
  });
  
  try {
    // Preparar dados para inserção - NUNCA incluir userId (elimina FK constraint de vez)
    const insertData: any = {
      id: newOrder.id,
      customerName: newOrder.customerName,
      products: JSON.stringify(newOrder.products),
      status: newOrder.status,
      priority: newOrder.priority,
      createdAt: newOrder.createdAt,
      notes: newOrder.notes || null,
      history: JSON.stringify(newOrder.history),
      comments: JSON.stringify(newOrder.comments),
      vendedorId: newOrder.vendedorId, 
      vendedorName: newOrder.vendedorName,
    };
    
    console.log('🔍 DEBUG - Dados que serão inseridos (SEM userId):', insertData);
    
    // Inserir diretamente no Supabase (ultra-rápido!)
    const { error } = await supabase
      .from('orders')
      .insert([insertData]);

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

// ==================== SYNC FUNCTIONS ====================

/**
 * Dispara sincronização com WooCommerce
 */
export const triggerSync = async (options?: {
  syncType?: 'products' | 'customers' | 'full' | 'incremental';
  forceFullSync?: boolean;
}): Promise<{ message: string; syncType: string; triggeredBy: string }> => {
  const response = await apiClient.post('/sync/woocommerce', options);
  return response.data;
};

/**
 * Obtém status do último sync
 */
export const getSyncStatus = async (syncType?: 'products' | 'customers' | 'full' | 'incremental'): Promise<{
  lastSync: any;
  isStale: boolean;
}> => {
  const response = await apiClient.get('/sync/status', {
    params: { syncType },
  });
  return response.data;
};

/**
 * Obtém estatísticas do cache
 */
export const getCacheStats = async (): Promise<{
  products: {
    total: number;
    active: number;
    inactive: number;
    lastSync: string | null;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
    lastSync: string | null;
  };
  isEmpty: boolean;
}> => {
  const response = await apiClient.get('/sync/stats');
  return response.data;
};

/**
 * Limpa cache antigo (marca como inativo)
 */
export const cleanupCache = async (daysToKeep: number = 30): Promise<{
  message: string;
  cleanedCount: number;
  daysToKeep: number;
}> => {
  const response = await apiClient.post('/sync/cleanup', { daysToKeep });
  return response.data;
};

