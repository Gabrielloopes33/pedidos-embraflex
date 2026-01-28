export interface ProductionProduct {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  codigo: string;
  material: string;
  discriminacaoProduto: string;
  largura: string;
  altura: string;
  lateral: string;
  cores: string;
  laminadoBrilho: boolean;
  laminadoFosco: boolean;
  vernizIE: boolean;
  autoMatizada: boolean;
  furosPresente: 'sim' | 'nao' | '';
  refile: string;
  cordaoBranco: boolean;
  cordaoPreto: boolean;
  cordaoBege: boolean;
  cordao: string;
  gorgurinho35cm: boolean;
  gorgurao35cm: boolean;
  sFrancisco35cm: boolean;
  ilhos: boolean;
  hotStampSacola: boolean;
  hotStampEtiqueta: boolean;
  outros: string;
  observacoes: string;
  unitPrice: number;
}

export interface ProductionOrder {
  id: string;
  customerName: string;
  products: ProductionProduct[];
  status: 'Pendente' | 'Em Produção' | 'Controle de Qualidade' | 'Finalizado';
  priority: 'Normal' | 'Urgente';
  notes?: string;
  createdAt: string;
  history: { event: string; timestamp: string; user: string }[];
  comments: { text: string; timestamp:string; user: string }[];
  userId?: string; // Adicionado para associar a um usuário
  vendedorId?: string; // ID do vendedor que criou o pedido
  vendedorName?: string; // Nome do vendedor que criou o pedido
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

// ==================== USER MANAGEMENT TYPES ====================

export interface User {
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
