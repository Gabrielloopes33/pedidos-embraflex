import { apiClient } from './api'; // Usar o cliente de API configurado
import type { ProductsParams, WooCommerceProduct } from './types'; // Importar tipos

/**
 * Extrai código do produto do nome quando SKU está vazio
 * Procura por padrões como k-034, k-038, K-146, etc.
 */
const extractSkuFromName = (name: string, originalSku: string): string => {
  // Se já tem SKU válido, retorna ele
  if (originalSku && originalSku.trim() !== '') {
    return originalSku.trim();
  }

  // Procura por padrões de código no nome: k-034, K-034, k_034, etc.
  const patterns = [
    /\b(k[-_]?\d{2,4})\b/i,  // k-034, k_034, K-034
    /\b(c[-_]?\d{2,4})\b/i,  // c-034, c_034
    /\b(s[-_]?\d{2,4})\b/i,  // s-034, s_034
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      // Normaliza: converte para minúsculo e garante formato k-XXX
      const code = match[1].toLowerCase().replace('_', '-');
      return code;
    }
  }

  // Se não encontrou padrão, retorna SKU original ou vazio
  return originalSku || '';
};

/**
 * Normaliza produtos para garantir SKU válido
 */
const normalizeProducts = (products: WooCommerceProduct[]): WooCommerceProduct[] => {
  return products.map(p => ({
    ...p,
    sku: extractSkuFromName(p.name, p.sku || '') || `ID-${p.id}`,
  }));
};

// Buscar produtos através do nosso backend (proxy)
export const getProducts = async (params?: ProductsParams): Promise<WooCommerceProduct[]> => {
  try {
    console.log('🔍 Buscando produtos via proxy com params:', params);
    const response = await apiClient.get(`/wc/products`, { 
      params,
      timeout: 20000 // 20 segundos para produtos (Render pode estar em cold start)
    });
    console.log('✅ Produtos recebidos:', response.data?.length || 0);
    // Normalizar SKUs dos produtos
    return normalizeProducts(response.data);
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

// Buscar produtos por nome ou SKU (para autocomplete)
export const searchProducts = async (search: string): Promise<WooCommerceProduct[]> => {
  try {
    if (!search || search.length < 2) {
      return [];
    }
    const response = await apiClient.get(`/wc/products`, {
      params: { search, per_page: 20 },
      timeout: 10000,
    });
    // Normalizar SKUs dos produtos
    return normalizeProducts(response.data);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
};

// Buscar produto por ID através do nosso backend (proxy)
export const getProductById = async (id: number): Promise<WooCommerceProduct> => {
  try {
    const response = await apiClient.get(`/wc/products/${id}`);
    // Normalizar SKU do produto
    const product = response.data;
    return {
      ...product,
      sku: extractSkuFromName(product.name, product.sku || '') || `ID-${product.id}`,
    };
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
