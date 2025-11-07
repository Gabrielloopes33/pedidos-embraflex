import woocommerceApi from './woocommerce';

export interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  meta_data: Array<{
    key: string;
    value: string;
  }>;
}

export interface CustomerCreateData {
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email: string;
    phone: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    company: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  meta_data?: Array<{
    key: string;
    value: string;
  }>;
}

export interface CustomersParams {
  page?: number;
  per_page?: number;
  search?: string;
  orderby?: 'id' | 'registered_date' | 'name' | 'email';
  order?: 'asc' | 'desc';
}

// Buscar clientes
export const getCustomers = async (params?: CustomersParams): Promise<WooCommerceCustomer[]> => {
  try {
    const response = await woocommerceApi.get('/customers', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error;
  }
};

// Buscar cliente por ID
export const getCustomerById = async (id: number): Promise<WooCommerceCustomer> => {
  try {
    const response = await woocommerceApi.get(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar cliente ${id}:`, error);
    throw error;
  }
};

// Criar novo cliente
export const createCustomer = async (data: CustomerCreateData): Promise<WooCommerceCustomer> => {
  try {
    const response = await woocommerceApi.post('/customers', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    throw error;
  }
};

// Atualizar cliente
export const updateCustomer = async (id: number, data: Partial<CustomerCreateData>): Promise<WooCommerceCustomer> => {
  try {
    const response = await woocommerceApi.put(`/customers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar cliente ${id}:`, error);
    throw error;
  }
};

// Deletar cliente
export const deleteCustomer = async (id: number): Promise<void> => {
  try {
    await woocommerceApi.delete(`/customers/${id}`, {
      params: { force: true }
    });
  } catch (error) {
    console.error(`Erro ao deletar cliente ${id}:`, error);
    throw error;
  }
};
