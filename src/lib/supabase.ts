import { createClient } from '@supabase/supabase-js';
import type {
  CachedProduct,
  CachedCustomer,
  ProductSearchOptions,
  CustomerSearchOptions,
  CacheStats,
  SyncMetadata,
  UserManagement,
  UserAuditLog,
  UserStats,
  UserCreateData,
  UserUpdateData,
} from './types';

const supabaseUrl = 'https://supa.agenciatouch.com.br';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0._G0caHkMnfr_HyJR9knteSCT0H9q3tDO5pL3AUb2mic';

const BUILD_VERSION = 'v3.3-' + Date.now();
console.log('🚀🚀🚀 VERSÃO:', BUILD_VERSION, '- Supabase DIRETO + NUNCA usa userId!');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== CACHE FUNCTIONS ====================

/**
 * Busca produtos do cache
 */
export async function getCachedProducts(options: ProductSearchOptions = {}): Promise<CachedProduct[]> {
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

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch products from cache: ${error.message}`);
  }

  return data || [];
}

/**
 * Busca um produto por ID
 */
export async function getCachedProductById(id: number): Promise<CachedProduct | null> {
  const { data, error } = await supabase
    .from('wc_products_cache')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch product from cache: ${error.message}`);
  }

  return data;
}

/**
 * Busca produtos por IDs
 */
export async function getCachedProductsByIds(ids: number[]): Promise<CachedProduct[]> {
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

  return data || [];
}

/**
 * Valida se produtos existem no cache
 */
export async function validateCachedProducts(productIds: number[]): Promise<{
  valid: number[];
  invalid: number[];
  missing: number[];
}> {
  const products = await getCachedProductsByIds(productIds);
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
export async function countCachedProducts(options: ProductSearchOptions = {}): Promise<number> {
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

/**
 * Busca clientes do cache
 */
export async function getCachedCustomers(options: CustomerSearchOptions = {}): Promise<CachedCustomer[]> {
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

  return data || [];
}

/**
 * Busca um cliente por ID
 */
export async function getCachedCustomerById(id: number): Promise<CachedCustomer | null> {
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

  return data;
}

/**
 * Busca um cliente por email
 */
export async function getCachedCustomerByEmail(email: string): Promise<CachedCustomer | null> {
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

  return data;
}

/**
 * Conta clientes no cache
 */
export async function countCachedCustomers(options: CustomerSearchOptions = {}): Promise<number> {
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

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(): Promise<CacheStats> {
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

  const isEmpty = (totalProducts || 0) === 0 && (totalCustomers || 0) === 0;

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
    isEmpty,
  };
}

/**
 * Obtém status do último sync
 */
export async function getLastSyncStatus(syncType?: 'products' | 'customers' | 'full' | 'incremental'): Promise<SyncMetadata | null> {
  const query = supabase
    .from('wc_sync_metadata')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(1);

  if (syncType) {
    query.eq('sync_type', syncType);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return data as SyncMetadata;
}

// ==================== USER MANAGEMENT FUNCTIONS ====================

/**
 * Lista todos os usuários (admin only)
 */
export async function getUsers(filters?: { role?: 'admin' | 'vendedor'; isActive?: boolean }): Promise<UserManagement[]> {
  let query = supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtém estatísticas dos usuários
 */
export async function getUserStats(): Promise<UserStats> {
  const { data, error } = await supabase.rpc('get_user_stats');

  if (error) {
    throw new Error(`Failed to fetch user stats: ${error.message}`);
  }

  return data?.[0] || {
    total_users: 0,
    active_users: 0,
    admin_count: 0,
    vendedor_count: 0,
    recent_logins: 0,
  };
}

/**
 * Busca um usuário por ID
 */
export async function getUserById(id: string): Promise<UserManagement | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data;
}

/**
 * Cria um novo usuário (admin only)
 */
export async function createUser(userData: UserCreateData): Promise<UserManagement> {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

/**
 * Atualiza um usuário (admin only)
 */
export async function updateUser(id: string, userData: UserUpdateData): Promise<UserManagement> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...userData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

/**
 * Deleta um usuário (admin only)
 */
export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Busca logs de auditoria de um usuário
 */
export async function getUserAuditLogs(userId: string): Promise<UserAuditLog[]> {
  const { data, error } = await supabase
    .from('user_audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`);
  }

  return data || [];
}
