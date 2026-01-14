// Types for Quote system
export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

export interface QuoteProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  width?: number;
  height?: number;
  finishing: {
    hotStamp: boolean;
    eyelets: boolean;
    cord: boolean;
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

// Request/Response types
export interface CreateQuoteRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  products: QuoteProduct[];
  notes?: string;
}

export interface UpdateQuoteRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  products?: QuoteProduct[];
  notes?: string;
}

export interface GenerateSignatureLinkResponse {
  signatureLink: string;
  expiresAt: string;
}

export interface PublicQuoteData {
  quoteNumber: string;
  customerName: string;
  products: QuoteProduct[];
  totalPrice: number;
  expiresAt: string;
  status: QuoteStatus;
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
