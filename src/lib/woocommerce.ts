import { apiClient } from './api'; // Usar o cliente de API configurado
import type { ProductsParams, WooCommerceProduct } from './types'; // Importar tipos

// Buscar produtos através do nosso backend (proxy)
export const getProducts = async (params?: ProductsParams): Promise<WooCommerceProduct[]> => {
  try {
    console.log('🔍 Buscando produtos via proxy com params:', params);
    const response = await apiClient.get(`/wc/products`, { 
      params,
      timeout: 20000 // 20 segundos para produtos (Render pode estar em cold start)
    });
    console.log('✅ Produtos recebidos:', response.data?.length || 0);
    return response.data;
  } catch (error) {
    console.error('\u274c Erro ao buscar produtos via proxy:', {
      status: (error as {response?: {status?: number}}).response?.status,
      statusText: (error as {response?: {statusText?: string}}).response?.statusText,
      data: (error as {response?: {data?: unknown}}).response?.data,
      message: (error as {message?: string}).message
    });
    
    // Se for erro de timeout ou network, retornar array vazio ao invés de travar
    const errorMessage = (error as {message?: string}).message || '';
    if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED')) {
      console.warn('⚠️ Usando modo offline - sem produtos disponíveis');
      return [];
    }
    
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

// Buscar preço variável baseado na quantidade
export const getProductPrice = async (id: number, quantity: number): Promise<{
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  formattedPrice: string;
}> => {
  try {
    const response = await apiClient.get(`/wc/products/${id}/price`, {
      params: { quantity }
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar preço do produto ${id} via proxy:`, error);
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

// Buscar variações de um produto variável
export const getProductVariations = async (productId: number): Promise<any[]> => {
  try {
    const response = await apiClient.get(`/wc/products/${productId}/variations`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar variações do produto ${productId}:`, error);
    throw error;
  }
};

// Buscar variação específica
export const getProductVariation = async (productId: number, variationId: number): Promise<any> => {
  try {
    const response = await apiClient.get(`/wc/products/${productId}/variations/${variationId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar variação ${variationId} do produto ${productId}:`, error);
    throw error;
  }
};
