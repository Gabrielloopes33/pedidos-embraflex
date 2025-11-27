// Tipos compartilhados para o fluxo de novo pedido

export interface Finishing {
  // Acessórios
  hotStamp: boolean;
  ilhos: boolean;
  furoPresente: boolean;
  
  // Cordão (apenas 1 selecionável)
  cordao: 'padrão' | 'colorido' | 'gorgurinho' | 'gorgurão' | 'são francisco' | '';
  
  // Cor do Cordão (apenas se padrão selecionado)
  corCordao: 'preto' | 'branco' | 'bege' | '';
}

export interface ProductItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  codigo: string;
  discriminacaoProduto: string;
  larguraCm: number;
  alturaCm: number;
  comprimentoCm: number;
  tipoImpressao: string;
  coresImpressao: string;
  finishing: Finishing;
}

export interface CustomerData {
  customerId: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
}

export interface OrderDetails {
  priority: 'Normal' | 'Urgente';
  notes: string;
}

export interface OrderFormData {
  customer: CustomerData;
  products: ProductItem[];
  orderDetails: OrderDetails;
}

// Preços dos acabamentos (conforme especificação)
export const FINISHING_PRICES = {
  // Acessórios
  hotStamp: 0.20, // R$ 0,20
  ilhos: 0.30, // R$ 0,30
  furoPresente: 0.00, // Grátis
  
  // Cordões
  cordaoPadrao: 0.00, // Grátis (mas cobra pela cor)
  cordaoColorido: 0.35, // R$ 0,35
  gorgurinho: 0.55, // R$ 0,55
  gorgurao: 0.45, // R$ 0,45 (Gorgurão)
  saoFrancisco: 0.50, // R$ 0,50 estimado
  
  // Cores do cordão padrão
  corCordaoPreto: 0.00, // Grátis
  corCordaoBranco: 0.00, // Grátis  
  corCordaoBege: 0.00, // Grátis
} as const;
