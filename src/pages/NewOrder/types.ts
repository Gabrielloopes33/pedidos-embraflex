// Tipos compartilhados para o fluxo de novo pedido

export interface Finishing {
  // Acessórios
  hotStamp: boolean;
  hotStampCor: 'dourado' | 'prata' | 'colorido' | ''; // Cor do hot stamp
  hotStampCorManual?: string; // Cor manual para hot stamp colorido
  ilhos: boolean;
  ilhosCorManual?: string; // Cor manual para ilhós
  furoPresente: boolean;

  // Cordão (apenas 1 selecionável)
  cordao: 'padrão' | 'colorido' | 'gorgurinho' | 'gorgurão' | 'são francisco' | '';

  // Cor do Cordão (se padrão, gorgurinho, gorgurão ou são francisco)
  corCordao: 'preto' | 'branco' | 'bege' | 'colorido' | '';
  cordaoCorManual?: string; // Cor manual para cordão colorido
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
  finishing: Finishing;
  discountPercent?: number; // Desconto em porcentagem (máximo 11%)
  // Novos campos para exibição detalhada
  modelo?: string; // Modelo do produto (ex: "25x35cm", "Boca Vazada")
  paperType?: string; // Tipo de papel (ex: "Kraft", "Duplex")
  lamination?: string; // Laminação (ex: "Laminado Brilho", "Laminado Fosco", "Verniz")
  laminationType?: 'fosco' | 'brilho' | ''; // Tipo de laminação quando o produto é laminado
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
  vendedorNome: string;
  vendedorTelefone: string;
  condicoesPagamento: string;
}

export interface OrderFormData {
  customer: CustomerData;
  products: ProductItem[];
  orderDetails: OrderDetails;
}

// Preços dos acabamentos (conforme especificação)
export const FINISHING_PRICES = {
  // Acessórios - Hot Stamp
  hotStampDouradoPrata: 0.80, // R$ 0,80 (dourado ou prata)
  hotStampColorido: 0.90, // R$ 0,90 (colorido)
  ilhos: 0.35, // R$ 0,35
  furoPresente: 0.00, // Grátis
  
  // Cordão simples colorido
  cordaoColorido: 0.10, // R$ 0,10
  
  // Cordões especiais (Gorgurão, São Francisco, Gorgurinho)
  // Preto ou Branco
  cordaoEspecialPretoBranco: 0.50, // R$ 0,50
  // Colorido
  cordaoEspecialColorido: 0.55, // R$ 0,55
} as const;
