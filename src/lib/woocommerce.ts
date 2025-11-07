import axios from 'axios';

// Configuração da API do WooCommerce
const WOOCOMMERCE_URL = import.meta.env.VITE_WOOCOMMERCE_URL || 'https://embraflexbr.com.br';
const CONSUMER_KEY = import.meta.env.VITE_WOOCOMMERCE_CONSUMER_KEY || 'ck_58c97d066289e666ad8a5f91741042f90633d340';
const CONSUMER_SECRET = import.meta.env.VITE_WOOCOMMERCE_CONSUMER_SECRET || 'cs_d342dee925de0370f45a892d1bb903f589238a86';

const woocommerceApi = axios.create({
  baseURL: `${WOOCOMMERCE_URL}/wp-json/wc/v3`,
  auth: {
    username: CONSUMER_KEY,
    password: CONSUMER_SECRET,
  },
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type?: string;
  sku?: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  description: string;
  short_description: string;
}

export interface ProductsParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  orderby?: 'date' | 'title' | 'price';
  order?: 'asc' | 'desc';
  status?: 'publish' | 'draft' | 'pending';
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}

// Buscar produtos
export const getProducts = async (params?: ProductsParams): Promise<WooCommerceProduct[]> => {
  try {
    const response = await woocommerceApi.get('/products', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

// Buscar produto por ID
export const getProductById = async (id: number): Promise<WooCommerceProduct> => {
  try {
    const response = await woocommerceApi.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar produto ${id}:`, error);
    throw error;
  }
};

// Buscar categorias
export const getCategories = async () => {
  try {
    const response = await woocommerceApi.get('/products/categories');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    throw error;
  }
};

export default woocommerceApi;
