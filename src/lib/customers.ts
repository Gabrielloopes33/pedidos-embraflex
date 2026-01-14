import { apiClient } from './api'; // Usar o cliente de API configurado
import type { CustomersParams, WooCommerceCustomer, CustomerCreateData } from './types'; // Importar tipos

// Buscar clientes através do nosso backend (proxy)
export const getCustomers = async (params?: CustomersParams): Promise<WooCommerceCustomer[]> => {
  try {
    console.log('🔍 [Customers] Buscando clientes...', params);
    
    const response = await apiClient.get(`/wc/customers`, { 
      params,
      timeout: 20000 // 20 segundos (Render pode estar em cold start)
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

// Criar ou atualizar cliente com validação completa
export const createOrUpdateCustomer = async (customerData: {
  name: string;
  email: string;
  phone: string;
  company?: string;
  cpf?: string;
  cnpj?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}): Promise<WooCommerceCustomer> => {
  try {
    console.log('🔍 Verificando se cliente já existe:', customerData.email);
    
    // Primeiro, tentar encontrar cliente existente pelo email
    const existingCustomers = await getCustomers({ search: customerData.email });
    
    if (existingCustomers && existingCustomers.length > 0) {
      console.log('✅ Cliente já existe, retornando:', existingCustomers[0].id);
      return existingCustomers[0];
    }
    
    // Preparar dados para criação no WooCommerce
    const wcCustomerData: CustomerCreateData = {
      email: customerData.email,
      first_name: customerData.name.split(' ')[0] || customerData.name,
      last_name: customerData.name.split(' ').slice(1).join(' ') || '',
      billing: {
        first_name: customerData.name.split(' ')[0] || customerData.name,
        last_name: customerData.name.split(' ').slice(1).join(' ') || '',
        email: customerData.email,
        phone: customerData.phone.replace(/\D/g, ''), // Remove formatação
        company: customerData.company || '',
        address_1: customerData.address || '',
        address_2: customerData.complement || '',
        city: customerData.city || '',
        state: customerData.state || '',
        postcode: customerData.cep?.replace(/\D/g, '') || '', // Remove formatação
        country: 'BR',
      },
      meta_data: [],
    };
    
    // Adicionar CPF/CNPJ nos meta_data se fornecidos
    if (customerData.cpf) {
      wcCustomerData.meta_data?.push({
        key: 'cpf',
        value: customerData.cpf.replace(/\D/g, '')
      });
    }
    
    if (customerData.cnpj) {
      wcCustomerData.meta_data?.push({
        key: 'cnpj',
        value: customerData.cnpj.replace(/\D/g, '')
      });
    }
    
    if (customerData.company) {
      wcCustomerData.meta_data?.push({
        key: 'company',
        value: customerData.company
      });
    }
    
    if (customerData.neighborhood) {
      wcCustomerData.meta_data?.push({
        key: 'neighborhood',
        value: customerData.neighborhood
      });
    }
    
    if (customerData.number) {
      wcCustomerData.meta_data?.push({
        key: 'number',
        value: customerData.number
      });
    }
    
    console.log('📤 Criando novo cliente no WooCommerce...');
    const newCustomer = await createCustomer(wcCustomerData);
    console.log('✅ Cliente criado com sucesso:', newCustomer.id);
    
    return newCustomer;
  } catch (error: any) {
    console.error('❌ Erro ao criar/atualizar cliente:', error);
    
    // Se o erro for de email duplicado, tentar buscar novamente
    if (error.response?.data?.code === 'registration-error-email-exists') {
      const existingCustomers = await getCustomers({ search: customerData.email });
      if (existingCustomers && existingCustomers.length > 0) {
        return existingCustomers[0];
      }
    }
    
    throw error;
  }
};
