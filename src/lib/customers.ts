import { apiClient } from './api'; // Usar o cliente de API configurado
import type { CustomersParams, WooCommerceCustomer, CustomerCreateData } from './types'; // Importar tipos

// Buscar clientes através do nosso backend (proxy)
export const getCustomers = async (params?: CustomersParams): Promise<WooCommerceCustomer[]> => {
  try {
    const response = await apiClient.get(`/wc/customers`, { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar clientes via proxy:', error);
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
