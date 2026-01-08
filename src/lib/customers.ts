import { apiClient } from './api'; // Usar o cliente de API configurado
import type { CustomersParams, WooCommerceCustomer, CustomerCreateData } from './types'; // Importar tipos

// Buscar clientes através do nosso backend (proxy)
export const getCustomers = async (params?: CustomersParams): Promise<WooCommerceCustomer[]> => {
  try {
    console.log('🔍 [Customers] Buscando clientes...', params);
    
    const response = await apiClient.get(`/wc/customers`, { params });
    console.log('✅ [Customers] Clientes recebidos:', response.data?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error('❌ [Customers] Erro ao buscar clientes via proxy:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    // O interceptor do axios já cuida de redirecionar para login em caso de 401
    throw error;
  }
};

// Criar novo cliente através do nosso backend (proxy)
export const createCustomer = async (data: CustomerCreateData): Promise<WooCommerceCustomer> => {
  try {
    const response = await apiClient.post(`/wc/customers`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente via proxy:', error);
    throw error;
  }
};
