import { apiClient } from './api'; // Usar o cliente de API configurado
import type { CustomersParams, WooCommerceCustomer, CustomerCreateData } from './types'; // Importar tipos

// Buscar clientes através do nosso backend (proxy)
export const getCustomers = async (params?: CustomersParams): Promise<WooCommerceCustomer[]> => {
  try {
    console.log('🔍 [Customers] Buscando clientes...', params);
    
    const response = await apiClient.get(`/wc/customers`, { 
      params,
      timeout: 8000 // 8 segundos
    });
    console.log('✅ [Customers] Clientes recebidos:', response.data?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error('❌ [Customers] Erro ao buscar clientes via proxy:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    // Se for erro de timeout ou network, retornar array vazio
    const errorMessage = error.message || '';
    if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      console.warn('⚠️ Usando modo offline - sem clientes disponíveis');
      return [];
    }
    
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
