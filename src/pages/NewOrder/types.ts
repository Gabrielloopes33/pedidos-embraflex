// Tipos compartilhados para o fluxo de novo pedido

export interface Finishing {
  cordaoColorido: boolean;
  gorgurinho: boolean;
  gorgurao: boolean;
  ilhos: boolean;
  hotStamp: boolean;
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

// Preços dos acabamentos (conforme foto)
export const FINISHING_PRICES = {
  // Cordões
  cordaoColorido: 0.35, // R$ 0,35
  gorgurinho: 0.55, // R$ 0,55
  gorgurao: 0.45, // R$ 0,45
  ilhos: 0.30, // R$ 0,30 por unidade
  hotStamp: 0.20, // R$ 0,20
} as const;
