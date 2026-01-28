// User Types
export type UserRole = 'admin' | 'vendedor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
}

// WooCommerce Product Type
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  stock_quantity: number | null;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; name: string; alt: string }[];
  attributes: {
    id?: number;
    name: string;
    slug?: string;
    position?: number;
    visible?: boolean;
    variation?: boolean;
    options: string[];
  }[];
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  meta_data?: { key: string; value: any }[];
}

// WooCommerce Products Query Parameters
export interface ProductsParams {
  search?: string;
  per_page?: number;
  page?: number;
  category?: string;
  status?: string;
  orderby?: string;
  order?: 'asc' | 'desc';
}

// Estrutura detalhada do produto para produção
export interface ProductionProduct {
  id: string;
  productId: number;
  name: string; // Nome do produto
  productName: string;
  quantity: number;
  codigo?: string;
  material?: string;
  discriminacaoProduto?: string;
  largura?: string;
  altura?: string;
  lateral?: string;
  comprimentoCm?: string;
  tipoImpressao?: string;
  laminadoBrilho?: boolean;
  laminadoFosco?: boolean;
  vernizIE?: boolean;
  autoMatizada?: boolean;
  furosPresente?: 'sim' | 'nao' | '';
  refile?: string;
  finishing?: {
    acessorios: {
      gorgurinho35cm?: boolean;
      gorgurao35cm?: boolean;
      sFrancisco35cm?: boolean;
      ilhos?: boolean;
      hotStampSacola?: boolean;
      hotStampEtiqueta?: boolean;
      outros?: string;
    };
    cordao?: 'nenhum' | 'padrão' | 'colorido' | 'personalizado';
    corCordao?: 'branco' | 'preto' | 'bege';
  };
  observacoes?: string;
  unitPrice: number;
  discountPercent?: number; // Desconto em porcentagem (máximo 11%)
}

// Ordem de produção completa
export interface ProductionOrder {
  id: string;
  customerName: string;
  products: ProductionProduct[]; // <- Atualizado
  status: 'Pendente' | 'Em Produção' | 'Controle de Qualidade' | 'Finalizado';
  priority: 'Normal' | 'Urgente';
  notes?: string;
  createdAt: string;
  vendedorId?: string; // ID do vendedor que criou o pedido
  vendedorName?: string; // Nome do vendedor que criou o pedido
  history: { event: string; timestamp: string; user: string }[];
  comments: { text: string; timestamp: string; user: string }[];
}

// Tipo para criar uma nova ordem de produção
export type NewProductionOrder = Omit<ProductionOrder, 'id' | 'status' | 'createdAt' | 'history' | 'comments'>;

// WooCommerce Customer Type
export interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  meta_data?: { key: string; value: any }[];
  avatar_url?: string;
  role?: string;
}

// WooCommerce Customers Query Parameters
export interface CustomersParams {
  search?: string;
  per_page?: number;
  page?: number;
  orderby?: string;
  order?: 'asc' | 'desc';
  role?: string;
}

// Customer Creation Data
export interface CustomerCreateData {
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  password?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  meta_data?: { key: string; value: any }[];
}

// ==================== CACHE TYPES ====================

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

export interface SyncMetadata {
  id?: number;
  sync_type: 'products' | 'customers' | 'full' | 'incremental';
  started_at: string;
  completed_at?: string;
  status: 'running' | 'completed' | 'failed';
  items_processed: number;
  items_created: number;
  items_updated: number;
  items_failed: number;
  error_message?: string;
  last_synced_at?: string;
  triggered_by: 'login' | 'manual' | 'webhook' | 'scheduled';
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface CacheStats {
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
  isEmpty: boolean;
}

// ==================== USER MANAGEMENT TYPES ====================

export interface UserManagement {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'vendedor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  created_by: string | null;
}

export interface UserAuditLog {
  id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted' | 'password_changed' | 'role_changed';
  performed_by: string | null;
  changes: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  admin_count: number;
  vendedor_count: number;
  recent_logins: number;
}

export interface UserCreateData {
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'vendedor';
  full_name?: string;
}

export interface UserUpdateData {
  username?: string;
  email?: string;
  role?: 'admin' | 'vendedor';
  full_name?: string;
  is_active?: boolean;
  password?: string;
}
