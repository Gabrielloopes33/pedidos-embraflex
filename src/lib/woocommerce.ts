import { apiClient } from './api'; // Usar o cliente de API configurado
import type { ProductsParams, WooCommerceProduct } from './types'; // Importar tipos

// Buscar produtos através do nosso backend (proxy)
export const getProducts = async (params?: ProductsParams): Promise<WooCommerceProduct[]> => {
  try {
    console.log('🔍 Buscando produtos via proxy com params:', params);
    const response = await apiClient.get(`/wc/products`, { params });
    console.log('✅ Produtos recebidos:', response.data?.length || 0);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos via proxy:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

// Buscar produto por ID através do nosso backend (proxy)
export const getProductById = async (id: number): Promise<WooCommerceProduct> => {
  try {
    const response = await apiClient.get(`/wc/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar produto ${id} via proxy:`, error);
    throw error;
  }
};

// Buscar categorias através do nosso backend (proxy)
export const getCategories = async () => {
  try {
    const response = await apiClient.get(`/wc/products/categories`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar categorias via proxy:', error);
    throw error;
  }
};
