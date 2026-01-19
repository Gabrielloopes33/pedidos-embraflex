// Webhook service - Dispara webhooks quando eventos ocorrem
import { QuoteWithProducts } from '../types/quote';

interface WebhookPayload {
  event: 'quote.signed' | 'quote.rejected';
  timestamp: string;
  data: {
    quoteNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    products: any[];
    totalPrice: number;
    signedAt?: string;
    signatureData?: {
      ip: string;
      userAgent: string;
      timestamp: string;
      geolocation?: {
        latitude?: number;
        longitude?: number;
        city?: string;
        country?: string;
      };
    };
    rejectedAt?: string;
    rejectionReason?: string;
  };
  pdfUrl?: string;
}

/**
 * Envia dados para o webhook configurado quando um orçamento é assinado
 * Configure a URL do webhook na variável de ambiente WEBHOOK_QUOTE_SIGNED
 */
export async function triggerQuoteSignedWebhook(
  quote: QuoteWithProducts,
  pdfUrl?: string
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_QUOTE_SIGNED;

  if (!webhookUrl) {
    console.log('⚠️ WEBHOOK_QUOTE_SIGNED não configurado. Webhook não enviado.');
    return;
  }

  const payload: WebhookPayload = {
    event: 'quote.signed',
    timestamp: new Date().toISOString(),
    data: {
      quoteNumber: quote.quote_number,
      customerName: quote.customer_name,
      customerEmail: quote.customer_email || undefined,
      customerPhone: quote.customer_phone || undefined,
      products: quote.products,
      totalPrice: typeof quote.total_price === 'string'
        ? parseFloat(quote.total_price)
        : quote.total_price,
      signedAt: quote.signed_at || undefined,
      signatureData: quote.signature_data || undefined,
    },
    pdfUrl,
  };

  try {
    console.log(`🔔 Enviando webhook para: ${webhookUrl}`);
    console.log(`📦 Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Embraflex-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ Webhook falhou: ${response.status} ${response.statusText}`);
      const responseText = await response.text();
      console.error(`   Resposta: ${responseText}`);
    } else {
      console.log(`✅ Webhook enviado com sucesso! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error);
  }
}

/**
 * Envia dados para o webhook configurado quando um orçamento é rejeitado
 * Configure a URL do webhook na variável de ambiente WEBHOOK_QUOTE_REJECTED
 */
export async function triggerQuoteRejectedWebhook(
  quote: QuoteWithProducts
): Promise<void> {
  const webhookUrl = process.env.WEBHOOK_QUOTE_REJECTED || process.env.WEBHOOK_QUOTE_SIGNED;

  if (!webhookUrl) {
    console.log('⚠️ Webhook de rejeição não configurado. Webhook não enviado.');
    return;
  }

  const payload: WebhookPayload = {
    event: 'quote.rejected',
    timestamp: new Date().toISOString(),
    data: {
      quoteNumber: quote.quote_number,
      customerName: quote.customer_name,
      customerEmail: quote.customer_email || undefined,
      customerPhone: quote.customer_phone || undefined,
      products: quote.products,
      totalPrice: typeof quote.total_price === 'string'
        ? parseFloat(quote.total_price)
        : quote.total_price,
      rejectedAt: quote.rejected_at || undefined,
      rejectionReason: quote.rejection_reason || undefined,
    },
  };

  try {
    console.log(`🔔 Enviando webhook de rejeição para: ${webhookUrl}`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Embraflex-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`❌ Webhook de rejeição falhou: ${response.status} ${response.statusText}`);
    } else {
      console.log(`✅ Webhook de rejeição enviado! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar webhook de rejeição:', error);
  }
}
