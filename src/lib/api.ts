import axios from 'axios';
import { NewProductionOrder, ProductionOrder } from './types';

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

// --- Autenticação ---
export const login = async (credentials: { username: string; password: string; }) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};


// --- Ordens de Produção ---
export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  const response = await apiClient.get('/orders');
  return response.data;
};

export const createProductionOrder = async (order: NewProductionOrder): Promise<ProductionOrder> => {
  const response = await apiClient.post('/orders', order);
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

