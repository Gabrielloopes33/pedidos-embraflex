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
  coresImpressao?: string;
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
