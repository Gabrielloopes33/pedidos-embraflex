// Signature routes - Public routes for quote signing (no authentication required)
import { Router, Request, Response } from 'express';
import { supabase } from '../database';
import { PublicQuoteData, SignatureConfirmRequest, RejectQuoteRequest, QuoteWithProducts } from '../types/quote';
import { sendQuoteApprovedEmail, sendQuoteRejectedEmail } from '../services/email';
import { triggerQuoteSignedWebhook, triggerQuoteRejectedWebhook } from '../services/webhook';
import { cacheService } from '../services/cache';

const router = Router();

// Helper: Get client IP address
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// GET /api/signature/:token - Get quote data by signature token (PUBLIC)
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('signature_link', token)
      .single();

    if (error || !quote) {
      return res.status(404).json({
        message: 'Cotação não encontrada ou link inválido.',
        code: 'NOT_FOUND',
      });
    }

    // Check if link is expired
    const now = new Date();
    const expiresAt = new Date(quote.expires_at);

    if (expiresAt < now) {
      return res.status(410).json({
        message: 'Este link de assinatura expirou.',
        code: 'EXPIRED',
        expiredAt: quote.expires_at,
      });
    }

    // Check if already signed
    if (quote.status === 'approved') {
      return res.status(200).json({
        message: 'Esta cotação já foi assinada anteriormente.',
        code: 'ALREADY_SIGNED',
        signedAt: quote.signed_at,
      });
    }

    // Check if rejected
    if (quote.status === 'rejected') {
      return res.status(200).json({
        message: 'Esta cotação foi recusada.',
        code: 'REJECTED',
        rejectedAt: quote.rejected_at,
      });
    }

    // Parse products from JSON string if needed
    const products = typeof quote.products === 'string' 
      ? JSON.parse(quote.products) 
      : quote.products;

    // Parse payment method if exists
    let condicoesPagamento = quote.condicoes_pagamento;
    if (condicoesPagamento && typeof condicoesPagamento === 'string') {
      try {
        condicoesPagamento = JSON.parse(condicoesPagamento);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    // Return public quote data with full customer info
    const publicData: PublicQuoteData = {
      quoteNumber: quote.quote_number,
      customerName: quote.customer_name,
      customerEmail: quote.customer_email || undefined,
      customerPhone: quote.customer_phone || undefined,
      customerCompany: quote.customer_company || undefined,
      customerCpf: quote.customer_cpf || undefined,
      customerCnpj: quote.customer_cnpj || undefined,
      customerCep: quote.customer_cep || undefined,
      customerAddress: quote.customer_address || undefined,
      customerNumber: quote.customer_number || undefined,
      customerComplement: quote.customer_complement || undefined,
      customerNeighborhood: quote.customer_neighborhood || undefined,
      customerCity: quote.customer_city || undefined,
      customerState: quote.customer_state || undefined,
      products: products,
      totalPrice: parseFloat(quote.total_price),
      expiresAt: quote.expires_at,
      status: quote.status,
      condicoesPagamento: condicoesPagamento || undefined,
      createdByName: quote.created_by_name || undefined,
    };

    res.json(publicData);
  } catch (error) {
    console.error(`❌ Error fetching quote by token ${token}:`, error);
    res.status(500).json({ message: 'Erro ao buscar cotação.' });
  }
});

// POST /api/signature/:token/view - Register quote view (PUBLIC)
router.post('/:token/view', async (req: Request, res: Response) => {
  const { token } = req.params;

  try {
    // Get quote ID from token
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id')
      .eq('signature_link', token)
      .single();

    if (quoteError || !quote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    // Register view
    const viewData = {
      quote_id: quote.id,
      ip_address: getClientIp(req),
      user_agent: req.headers['user-agent'] || null,
      geolocation: req.body.geolocation || null,
    };

    const { error } = await supabase.from('quote_views').insert([viewData]);

    if (error) {
      console.error('❌ Error registering view:', error);
      // Don't fail the request if view registration fails
    } else {
      console.log(`👁️ Quote ${quote.id} viewed from ${viewData.ip_address}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`❌ Error registering view for token ${token}:`, error);
    res.status(500).json({ message: 'Erro ao registrar visualização.' });
  }
});

// POST /api/signature/:token/confirm - Confirm/sign quote (PUBLIC)
router.post('/:token/confirm', async (req: Request, res: Response) => {
  const { token } = req.params;
  const body: SignatureConfirmRequest = req.body;

  try {
    // Get quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('signature_link', token)
      .single();

    if (quoteError || !quote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    // Parse products from JSON string if needed
    const products = typeof quote.products === 'string' 
      ? JSON.parse(quote.products) 
      : quote.products;

    // Validate not expired
    const now = new Date();
    const expiresAt = new Date(quote.expires_at);

    if (expiresAt < now) {
      return res.status(410).json({
        message: 'Este link expirou. Entre em contato com o vendedor.',
        code: 'EXPIRED',
      });
    }

    // Validate status is 'sent'
    if (quote.status !== 'sent') {
      return res.status(400).json({
        message: 'Esta cotação não pode mais ser assinada.',
        code: 'INVALID_STATUS',
        currentStatus: quote.status,
      });
    }

    // Capture signature data
    const signatureData = {
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date().toISOString(),
      geolocation: body.geolocation || null,
    };

    // Validate products against cache before approving
    const productIds = products
      .map((p: any) => p.productId || p.id)
      .filter((id: any) => typeof id === 'number'); // Only validate numeric IDs

    let productValidation: { valid: number[]; invalid: number[]; missing: number[] } = {
      valid: [],
      invalid: [],
      missing: []
    };

    if (productIds.length > 0) {
      try {
        productValidation = await cacheService.validateProducts(productIds);

        // Log validation results
        console.log(`🔍 Product validation for quote ${quote.quote_number}:`, productValidation);

        // If there are invalid or missing products, log warning but don't block
        if (productValidation.invalid.length > 0 || productValidation.missing.length > 0) {
          console.warn(`⚠️ Quote ${quote.quote_number} has products with cache issues:`, {
            invalid: productValidation.invalid,
            missing: productValidation.missing,
          });
        }
      } catch (cacheError) {
        console.warn('⚠️ Failed to validate products against cache:', cacheError);
        // Don't block signature if cache validation fails
      }
    }

    // Update quote status to approved
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'approved',
        signed_at: new Date().toISOString(),
        signature_data: {
          ...signatureData,
          productValidation,
        },
      })
      .eq('signature_link', token)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Quote ${quote.quote_number} signed by ${quote.customer_name}`);
    console.log(`📝 Signature data:`, signatureData);

    // Dispara webhook com os dados do orçamento assinado (async, don't wait)
    // Configure WEBHOOK_QUOTE_SIGNED nas variáveis de ambiente
    console.log(`🔔 Preparando para enviar webhook...`);
    console.log(`📦 Updated quote data:`, {
      quote_number: updatedQuote.quote_number,
      customer_name: updatedQuote.customer_name,
      products: products,
      total_price: updatedQuote.total_price,
    });
    
    triggerQuoteSignedWebhook({
      ...updatedQuote,
      products: products,
    } as QuoteWithProducts).catch((webhookError) => {
      console.error('❌ Error triggering webhook:', webhookError);
      // Don't fail the request if webhook fails
    });

    // Send email notification to production team (async, don't wait)
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    sendQuoteApprovedEmail(
      {
        ...updatedQuote,
        products: products,
        totalPrice: parseFloat(updatedQuote.total_price),
      },
      appUrl
    ).catch((emailError) => {
      console.error('❌ Error sending approval email:', emailError);
      // Don't fail request if email fails
    });

    res.json({
      success: true,
      message: 'Cotação assinada com sucesso! Entraremos em contato em breve.',
      quoteNumber: quote.quote_number,
    });
  } catch (error) {
    console.error(`❌ Error confirming signature for token ${token}:`, error);
    res.status(500).json({ message: 'Erro ao confirmar assinatura.' });
  }
});

// POST /api/signature/:token/reject - Reject quote (PUBLIC)
router.post('/:token/reject', async (req: Request, res: Response) => {
  const { token } = req.params;
  const body: RejectQuoteRequest = req.body;

  try {
    // Get quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('signature_link', token)
      .single();

    if (quoteError || !quote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    // Parse products from JSON string if needed
    const products = typeof quote.products === 'string' 
      ? JSON.parse(quote.products) 
      : quote.products;

    // Validate not expired
    const now = new Date();
    const expiresAt = new Date(quote.expires_at);

    if (expiresAt < now) {
      return res.status(410).json({
        message: 'Este link expirou.',
        code: 'EXPIRED',
      });
    }

    // Validate status is 'sent'
    if (quote.status !== 'sent') {
      return res.status(400).json({
        message: 'Esta cotação não pode mais ser recusada.',
        code: 'INVALID_STATUS',
        currentStatus: quote.status,
      });
    }

    // Update quote status to rejected
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejection_reason: body.reason || null,
      })
      .eq('signature_link', token)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`❌ Quote ${quote.quote_number} rejected by ${quote.customer_name}`);
    if (body.reason) {
      console.log(`📝 Rejection reason: ${body.reason}`);
    }

    // Send rejection email to vendedor (optional, async)
    if (quote.created_by_id) {
      // Get vendedor email
      const { data: userData } = await supabase
        .from('users')
        .select('username')
        .eq('id', quote.created_by_id)
        .single();

      if (userData?.username) {
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        // Note: This assumes username is email. Adjust if different.
        sendQuoteRejectedEmail(
          {
            ...updatedQuote,
            products: products,
            totalPrice: parseFloat(updatedQuote.total_price),
          },
          userData.username,
          appUrl
        ).catch((emailError) => {
          console.error('❌ Error sending rejection email:', emailError);
        });
      }
    }

    // Dispara webhook de rejeição (async, don't wait)
    // Configure WEBHOOK_QUOTE_REJECTED nas variáveis de ambiente (ou usa WEBHOOK_QUOTE_SIGNED)
    triggerQuoteRejectedWebhook({
      ...updatedQuote,
      products: products,
    } as QuoteWithProducts).catch((webhookError) => {
      console.error('❌ Error triggering rejection webhook:', webhookError);
    });

    res.json({
      success: true,
      message: 'Sua recusa foi registrada. Obrigado pelo retorno.',
      quoteNumber: quote.quote_number,
    });
  } catch (error) {
    console.error(`❌ Error rejecting quote for token ${token}:`, error);
    res.status(500).json({ message: 'Erro ao recusar cotação.' });
  }
});

export default router;
