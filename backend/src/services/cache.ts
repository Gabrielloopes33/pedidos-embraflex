import { supabase } from '../supabase-client';

// Tipos para produtos em cache
export interface CachedProduct {
  id: number;
  name: string;
  sku: string | null;
  price: number | null;
  regular_price: number | null;
  description: string | null;
  short_description: string | null;
  stock_status: string | null;
  stock_quantity: number | null;
  manage_stock: boolean;
  images: any[];
  categories: any[];
  attributes: any[];
  variations: any[];
  meta_data: any[];
  precos_por_quantidade: any;
  wc_modified_at: string;
  synced_at: string;
  is_active: boolean;
  search_vector?: any;
}

// Tipos para clientes em cache
export interface CachedCustomer {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  billing: any;
  shipping: any;
  role: string | null;
  wc_modified_at: string;
  synced_at: string;
  is_active: boolean;
  search_vector?: any;
}

// Opções de busca
export interface ProductSearchOptions {
  search?: string;
  category?: string;
  sku?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CustomerSearchOptions {
  search?: string;
  email?: string;
  includeInactive?: boolean;
  limit?: number;
  offset?: number;
}

// Classe para gerenciar cache do WooCommerce
export class CacheService {
  private static instance: CacheService;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // ==================== PRODUTOS ====================

  /**
   * Busca produtos do cache
   */
  async getProducts(options: ProductSearchOptions = {}): Promise<CachedProduct[]> {
    const {
      search,
      category,
      sku,
      includeInactive = false,
      limit = 100,
      offset = 0,
    } = options;

    let query = supabase
      .from('wc_products_cache')
      .select('*')
      .order('name', { ascending: true });

    // Filtrar apenas ativos
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Busca por texto (usa full-text search)
    if (search) {
      query = query.textSearch('search_vector', search.replace(/\s+/g, ' & '), {
        type: 'plain',
        config: 'portuguese',
      });
    }

    // Filtrar por SKU
    if (sku) {
      query = query.ilike('sku', `%${sku}%`);
    }

    // Filtrar por categoria
    if (category) {
      query = query.contains('categories', [{ name: category }]);
    }

    // Paginação
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch products from cache: ${error.message}`);
    }

    return data as CachedProduct[];
  }

  /**
   * Busca um produto por ID
   */
  async getProductById(id: number): Promise<CachedProduct | null> {
    const { data, error } = await supabase
      .from('wc_products_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch product from cache: ${error.message}`);
    }

    return data as CachedProduct;
  }

  /**
   * Busca produtos por IDs
   */
  async getProductsByIds(ids: number[]): Promise<CachedProduct[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('wc_products_cache')
      .select('*')
      .in('id', ids)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch products from cache: ${error.message}`);
    }

    return data as CachedProduct[];
  }

  /**
   * Valida se produtos existem no cache
   */
  async validateProducts(productIds: number[]): Promise<{
    valid: number[];
    invalid: number[];
    missing: number[];
  }> {
    const products = await this.getProductsByIds(productIds);
    const validIds = new Set(products.map(p => p.id));

    const valid: number[] = [];
    const invalid: number[] = [];
    const missing: number[] = [];

    for (const id of productIds) {
      if (!validIds.has(id)) {
        missing.push(id);
      } else {
        const product = products.find(p => p.id === id);
        if (product && product.is_active) {
          valid.push(id);
        } else {
          invalid.push(id);
        }
      }
    }

    return { valid, invalid, missing };
  }

  /**
   * Conta produtos no cache
   */
  async countProducts(options: ProductSearchOptions = {}): Promise<number> {
    const { search, category, sku, includeInactive = false } = options;

    let query = supabase
      .from('wc_products_cache')
      .select('*', { count: 'exact', head: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.textSearch('search_vector', search.replace(/\s+/g, ' & '), {
        type: 'plain',
        config: 'portuguese',
      });
    }

    if (sku) {
      query = query.ilike('sku', `%${sku}%`);
    }

    if (category) {
      query = query.contains('categories', [{ name: category }]);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count products in cache: ${error.message}`);
    }

    return count || 0;
  }

  // ==================== CLIENTES ====================

  /**
   * Busca clientes do cache
   */
  async getCustomers(options: CustomerSearchOptions = {}): Promise<CachedCustomer[]> {
    const {
      search,
      email,
      includeInactive = false,
      limit = 100,
      offset = 0,
    } = options;

    let query = supabase
      .from('wc_customers_cache')
      .select('*')
      .order('email', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.textSearch('search_vector', search.replace(/\s+/g, ' & '), {
        type: 'plain',
        config: 'portuguese',
      });
    }

    if (email) {
      query = query.ilike('email', `%${email}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch customers from cache: ${error.message}`);
    }

    return data as CachedCustomer[];
  }

  /**
   * Busca um cliente por ID
   */
  async getCustomerById(id: number): Promise<CachedCustomer | null> {
    const { data, error } = await supabase
      .from('wc_customers_cache')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch customer from cache: ${error.message}`);
    }

    return data as CachedCustomer;
  }

  /**
   * Busca um cliente por email
   */
  async getCustomerByEmail(email: string): Promise<CachedCustomer | null> {
    const { data, error } = await supabase
      .from('wc_customers_cache')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch customer from cache: ${error.message}`);
    }

    return data as CachedCustomer;
  }

  /**
   * Conta clientes no cache
   */
  async countCustomers(options: CustomerSearchOptions = {}): Promise<number> {
    const { search, email, includeInactive = false } = options;

    let query = supabase
      .from('wc_customers_cache')
      .select('*', { count: 'exact', head: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.textSearch('search_vector', search.replace(/\s+/g, ' & '), {
        type: 'plain',
        config: 'portuguese',
      });
    }

    if (email) {
      query = query.ilike('email', `%${email}%`);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count customers in cache: ${error.message}`);
    }

    return count || 0;
  }

  // ==================== METADATA ====================

  /**
   * Obtém estatísticas do cache
   */
  async getCacheStats(): Promise<{
    products: {
      total: number;
      active: number;
      inactive: number;
      lastSync: string | null;
    };
    customers: {
      total: number;
      active: number;
      inactive: number;
      lastSync: string | null;
    };
  }> {
    // Contar produtos
    const { count: totalProducts } = await supabase
      .from('wc_products_cache')
      .select('*', { count: 'exact', head: true });

    const { count: activeProducts } = await supabase
      .from('wc_products_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: latestProductSync } = await supabase
      .from('wc_products_cache')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    // Contar clientes
    const { count: totalCustomers } = await supabase
      .from('wc_customers_cache')
      .select('*', { count: 'exact', head: true });

    const { count: activeCustomers } = await supabase
      .from('wc_customers_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { data: latestCustomerSync } = await supabase
      .from('wc_customers_cache')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    return {
      products: {
        total: totalProducts || 0,
        active: activeProducts || 0,
        inactive: (totalProducts || 0) - (activeProducts || 0),
        lastSync: latestProductSync?.synced_at || null,
      },
      customers: {
        total: totalCustomers || 0,
        active: activeCustomers || 0,
        inactive: (totalCustomers || 0) - (activeCustomers || 0),
        lastSync: latestCustomerSync?.synced_at || null,
      },
    };
  }

  /**
   * Limpa cache antigo (marca como inativo)
   */
  async cleanupOldCache(daysToKeep: number = 30): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_old_cache', {
      days_to_keep: daysToKeep,
    });

    if (error) {
      throw new Error(`Failed to cleanup old cache: ${error.message}`);
    }

    return data as number;
  }

  /**
   * Verifica se o cache está vazio
   */
  async isCacheEmpty(): Promise<boolean> {
    const { count: productCount } = await supabase
      .from('wc_products_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: customerCount } = await supabase
      .from('wc_customers_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return (productCount || 0) === 0 && (customerCount || 0) === 0;
  }
}

// Exportar instância singleton
export const cacheService = CacheService.getInstance();
