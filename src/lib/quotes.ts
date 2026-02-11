// Quote API functions
import { apiClient } from './api';

export interface QuoteProduct {
  id?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discountPercent?: number;
  variationId?: number;
  color?: string;
  attributes?: Record<string, string>;
  width?: number;
  height?: number;
  finishing: {
    hotStamp: boolean;
    hotStampCor?: 'nenhum' | 'dourado' | 'prata' | 'colorido';
    eyelets: boolean;
    ilhosCorManual?: string;
    furoPresente?: boolean;
    cord: boolean;
    cordao?: 'nenhum' | 'padrao' | 'gorgurao' | 'saoFrancisco' | 'colorido' | 'gorgurinho';
    corCordao?: 'nenhum' | 'preto' | 'branco' | 'colorido';
    cordaoCorManual?: string;
  };
  subtotal: number;
  imageUrl?: string;
}

export type QuoteStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'converted';

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
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  products: QuoteProduct[];
  totalPrice: number;
  status: QuoteStatus;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  signatureLink?: string;
  signatureLinkCreatedAt?: string;
  signatureLinkVersion: number;
  signedAt?: string;
  signatureData?: SignatureData;
  rejectedAt?: string;
  rejectionReason?: string;
  convertedToOrderId?: string;
  notes?: string;
}

export interface QuoteWithViews extends Quote {
  viewCount: number;
  lastViewedAt?: string;
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
  token: string;
}

export interface PublicQuoteData {
  quoteNumber: string;
  customerName: string;
  products: QuoteProduct[];
  totalPrice: number;
  expiresAt: string;
  status: QuoteStatus;
}

export interface QuoteListFilters {
  status?: QuoteStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  createdById?: string;
}

// API functions

/**
 * List all quotes with optional filters
 */
export async function listQuotes(filters?: QuoteListFilters): Promise<QuoteWithViews[]> {
  const params = new URLSearchParams();

  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.createdById) params.append('createdById', filters.createdById);

  const queryString = params.toString();
  const url = queryString ? `/quotes?${queryString}` : '/quotes';

  const response = await apiClient.get<QuoteWithViews[]>(url);
  return response.data;
}

/**
 * Get single quote by ID
 */
export async function getQuote(id: string): Promise<Quote> {
  const response = await apiClient.get<Quote>(`/quotes/${id}`);
  return response.data;
}

/**
 * Create new quote
 */
export async function createQuote(data: CreateQuoteRequest): Promise<Quote> {
  const response = await apiClient.post<Quote>('/quotes', data);
  return response.data;
}

/**
 * Update existing quote
 */
export async function updateQuote(id: string, data: UpdateQuoteRequest): Promise<Quote> {
  const response = await apiClient.put<Quote>(`/quotes/${id}`, data);
  return response.data;
}

/**
 * Generate signature link for quote
 */
export async function generateSignatureLink(id: string): Promise<GenerateSignatureLinkResponse> {
  const response = await apiClient.post<GenerateSignatureLinkResponse>(
    `/quotes/${id}/signature-link`
  );
  return response.data;
}

/**
 * Regenerate expired signature link
 */
export async function regenerateSignatureLink(
  id: string
): Promise<GenerateSignatureLinkResponse> {
  const response = await apiClient.post<GenerateSignatureLinkResponse>(
    `/quotes/${id}/regenerate-link`
  );
  return response.data;
}

/**
 * Get quote views/analytics
 */
export async function getQuoteViews(id: string): Promise<QuoteView[]> {
  const response = await apiClient.get<QuoteView[]>(`/quotes/${id}/views`);
  return response.data;
}

/**
 * Delete quote
 */
export async function deleteQuote(id: string): Promise<void> {
  await apiClient.delete(`/quotes/${id}`);
}

// Public API functions (no authentication required)

/**
 * Get quote data by signature token (public)
 */
export async function getQuoteByToken(token: string): Promise<PublicQuoteData> {
  const response = await apiClient.get<PublicQuoteData>(`/signature/${token}`);
  return response.data;
}

/**
 * Register quote view (public)
 */
export async function registerQuoteView(
  token: string,
  geolocation?: {
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }
): Promise<void> {
  await apiClient.post(`/signature/${token}/view`, { geolocation });
}

/**
 * Confirm/sign quote (public)
 */
export async function confirmQuoteSignature(
  token: string,
  data: {
    geolocation?: {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
    };
  }
): Promise<{ success: boolean; message: string; quoteNumber: string }> {
  const response = await apiClient.post(`/signature/${token}/confirm`, data);
  return response.data;
}

/**
 * Reject quote (public)
 */
export async function rejectQuote(
  token: string,
  reason?: string
): Promise<{ success: boolean; message: string; quoteNumber: string }> {
  const response = await apiClient.post(`/signature/${token}/reject`, { reason });
  return response.data;
}

// Helper functions

/**
 * Calculate quote total from products
 */
export function calculateQuoteTotal(products: QuoteProduct[]): number {
  return products.reduce((sum, product) => sum + product.subtotal, 0);
}

/**
 * Check if quote link is expired
 */
export function isQuoteExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Format quote status for display
 */
export function formatQuoteStatus(status: QuoteStatus): string {
  const statusMap: Record<QuoteStatus, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    approved: 'Aprovada',
    rejected: 'Recusada',
    converted: 'Convertida',
  };
  return statusMap[status] || status;
}

/**
 * Get status badge color
 */
export function getStatusColor(
  status: QuoteStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const colorMap: Record<QuoteStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'outline',
    sent: 'default',
    approved: 'secondary',
    rejected: 'destructive',
    converted: 'secondary',
  };
  return colorMap[status] || 'default';
}
