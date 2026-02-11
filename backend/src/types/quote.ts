// Types for Quote system
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

// Payment types
export type PaymentMethodType = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'combined';

export interface BoletoPayment {
  dueDate?: string;
  instructions?: string;
}

export interface PaymentCard {
  type: 'credit' | 'debit';
  brand?: 'visa' | 'mastercard' | 'elo' | 'hipercard' | 'amex';
  last4Digits?: string;
  installmentCount?: number;
}

export interface CashPayment {
  amount?: number;
}

export interface PixPayment {
  key?: string;
}

export interface CombinedPayment {
  method1?: {
    type: PaymentMethodType;
    amount?: number;
    card?: PaymentCard;
    pix?: PixPayment;
    boleto?: BoletoPayment;
  };
  method2?: {
    type: PaymentMethodType;
    amount?: number;
    card?: PaymentCard;
    pix?: PixPayment;
    boleto?: BoletoPayment;
  };
}

export interface QuotePayment {
  type: PaymentMethodType;
  cards?: PaymentCard[];
  cash?: CashPayment;
  pix?: PixPayment;
  boleto?: BoletoPayment;
  combined?: CombinedPayment;
  totalAmount: number;
  notes?: string;
}

export interface QuoteProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  width?: number;
  height?: number;
  color?: string;
  attributes?: Record<string, string>;
  finishing: {
    hotStamp: boolean;
    hotStampCor?: string;
    eyelets: boolean;
    ilhosCorManual?: string;
    furoPresente?: boolean;
    cord: boolean;
    cordao?: string;
    corCordao?: string;
    cordaoCorManual?: string;
  };
  subtotal: number;
  imageUrl?: string;
}

export interface SignatureData {
  ip: string;
  userAgent: string;
  timestamp: string;
  geolocation?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

export interface Quote {
  id: string;
  quoteNumber: string;

  // Customer
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCpf?: string;
  customerCnpj?: string;
  customerCep?: string;
  customerAddress?: string;
  customerNumber?: string;
  customerComplement?: string;
  customerNeighborhood?: string;
  customerCity?: string;
  customerState?: string;

  // Products
  products: QuoteProduct[];
  totalPrice: number;

  // Status
  status: QuoteStatus;

  // Creator
  createdById?: string;
  createdByName?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;

  // Signature link
  signatureLink?: string;
  signatureLinkCreatedAt?: string;
  signatureLinkVersion: number;

  // Signature
  signedAt?: string;
  signatureData?: SignatureData;

  // Rejection
  rejectedAt?: string;
  rejectionReason?: string;

  // Conversion
  convertedToOrderId?: string;

  // Notes
  notes?: string;

  // Payment method (stored as JSON string in condicoes_pagamento column)
  condicoesPagamento?: string;
  paymentMethod?: QuotePayment;
}

export interface QuoteView {
  id: string;
  quoteId: string;
  viewedAt: string;
  ipAddress?: string;
  userAgent?: string;
  geolocation?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

// Customer full data interface
export interface CustomerFullData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  cpf?: string;
  cnpj?: string;
  cep?: string;
  address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

// Request/Response types
export interface CreateQuoteRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCpf?: string;
  customerCnpj?: string;
  customerCep?: string;
  customerAddress?: string;
  customerNumber?: string;
  customerComplement?: string;
  customerNeighborhood?: string;
  customerCity?: string;
  customerState?: string;
  products: QuoteProduct[];
  notes?: string;
  paymentMethod?: QuotePayment;
}

export interface UpdateQuoteRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCpf?: string;
  customerCnpj?: string;
  customerCep?: string;
  customerAddress?: string;
  customerNumber?: string;
  customerComplement?: string;
  customerNeighborhood?: string;
  customerCity?: string;
  customerState?: string;
  products?: QuoteProduct[];
  notes?: string;
  paymentMethod?: QuotePayment;
}

export interface GenerateSignatureLinkResponse {
  signatureLink: string;
  expiresAt: string;
}

export interface PublicQuoteData {
  quoteNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  customerCpf?: string;
  customerCnpj?: string;
  customerCep?: string;
  customerAddress?: string;
  customerNumber?: string;
  customerComplement?: string;
  customerNeighborhood?: string;
  customerCity?: string;
  customerState?: string;
  products: QuoteProduct[];
  totalPrice: number;
  expiresAt: string;
  status: QuoteStatus;
  condicoesPagamento?: string;
  createdByName?: string;
}

export interface SignatureConfirmRequest {
  ip: string;
  userAgent: string;
  geolocation?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  };
}

export interface RejectQuoteRequest {
  reason?: string;
  ip: string;
  userAgent: string;
}

export interface QuoteListFilters {
  status?: QuoteStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  createdById?: string;
}

export interface QuoteWithViews extends Quote {
  viewCount: number;
  lastViewedAt?: string;
}

// Interface para dados que vêm diretamente do Supabase (snake_case)
export interface QuoteWithProducts {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  products: QuoteProduct[];
  total_price: number | string;
  status: QuoteStatus;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  signature_link?: string;
  signature_link_created_at?: string;
  signature_link_version: number;
  signed_at?: string;
  signature_data?: SignatureData;
  rejected_at?: string;
  rejection_reason?: string;
  converted_to_order_id?: string;
  notes?: string;
  condicoes_pagamento?: string;
}
