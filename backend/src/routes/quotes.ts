// Quote routes - Sistema de cotações
import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { supabase } from '../database';
import {
  Quote,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  QuoteListFilters,
  QuoteWithViews,
} from '../types/quote';

const router = Router();

// Helper: Convert database row to Quote object
function parseQuote(row: any): Quote {
  return {
    id: row.id,
    quoteNumber: row.quote_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    customerCompany: row.customer_company,
    customerCpf: row.customer_cpf,
    customerCnpj: row.customer_cnpj,
    customerCep: row.customer_cep,
    customerAddress: row.customer_address,
    customerNumber: row.customer_number,
    customerComplement: row.customer_complement,
    customerNeighborhood: row.customer_neighborhood,
    customerCity: row.customer_city,
    customerState: row.customer_state,
    products: row.products,
    totalPrice: parseFloat(row.total_price),
    status: row.status,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    signatureLink: row.signature_link,
    signatureLinkCreatedAt: row.signature_link_created_at,
    signatureLinkVersion: row.signature_link_version,
    signedAt: row.signed_at,
    signatureData: row.signature_data,
    rejectedAt: row.rejected_at,
    rejectionReason: row.rejection_reason,
    convertedToOrderId: row.converted_to_order_id,
    notes: row.notes,
    condicoesPagamento: row.condicoes_pagamento,
    paymentMethod: row.condicoes_pagamento ? JSON.parse(row.condicoes_pagamento) : undefined,
  };
}

// GET /api/quotes - List quotes with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      search,
      startDate,
      endDate,
      createdById,
    } = req.query as Partial<QuoteListFilters>;

    let query = supabase
      .from('quotes')
      .select('*, quote_views(id)')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (createdById) {
      query = query.eq('created_by_id', createdById);
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,quote_number.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add view count to each quote
    const quotesWithViews: QuoteWithViews[] = (data || []).map((row: any) => {
      const quote = parseQuote(row);
      return {
        ...quote,
        viewCount: Array.isArray(row.quote_views) ? row.quote_views.length : 0,
      };
    });

    res.json(quotesWithViews);
  } catch (error) {
    console.error('❌ Error fetching quotes:', error);
    res.status(500).json({ message: 'Erro ao buscar cotações.' });
  }
});

// GET /api/quotes/:id - Get single quote
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    const quote = parseQuote(data);
    res.json(quote);
  } catch (error) {
    console.error(`❌ Error fetching quote ${id}:`, error);
    res.status(500).json({ message: 'Erro ao buscar cotação.' });
  }
});

// POST /api/quotes - Create new quote
router.post('/', async (req: Request, res: Response) => {
  try {
    const body: CreateQuoteRequest = req.body;
    const { 
      customerName, 
      customerEmail, 
      customerPhone,
      customerCompany,
      customerCpf,
      customerCnpj,
      customerCep,
      customerAddress,
      customerNumber,
      customerComplement,
      customerNeighborhood,
      customerCity,
      customerState,
      products, 
      notes, 
      paymentMethod 
    } = body;

    if (!customerName || !products || products.length === 0) {
      return res.status(400).json({ message: 'Nome do cliente e produtos são obrigatórios.' });
    }

    // Calculate total price
    const totalPrice = products.reduce((sum, p) => sum + p.subtotal, 0);

    // Get user info from auth token (if available)
    // For now, we'll use a placeholder - this should come from JWT token
    const createdById = (req as any).user?.id;
    const createdByName = (req as any).user?.name;

    const newQuote = {
      customer_name: customerName,
      customer_email: customerEmail || null,
      customer_phone: customerPhone || null,
      customer_company: customerCompany || null,
      customer_cpf: customerCpf || null,
      customer_cnpj: customerCnpj || null,
      customer_cep: customerCep || null,
      customer_address: customerAddress || null,
      customer_number: customerNumber || null,
      customer_complement: customerComplement || null,
      customer_neighborhood: customerNeighborhood || null,
      customer_city: customerCity || null,
      customer_state: customerState || null,
      products: JSON.stringify(products),
      total_price: totalPrice,
      status: 'draft',
      created_by_id: createdById || null,
      created_by_name: createdByName || null,
      notes: notes || null,
      condicoes_pagamento: paymentMethod ? JSON.stringify(paymentMethod) : null,
    };

    const { data, error } = await supabase
      .from('quotes')
      .insert([newQuote])
      .select()
      .single();

    if (error) throw error;

    const quote = parseQuote(data);
    console.log(`✅ Quote created: ${quote.quoteNumber}`);
    res.status(201).json(quote);
  } catch (error) {
    console.error('❌ Error creating quote:', error);
    res.status(500).json({ message: 'Erro ao criar cotação.' });
  }
});

// PUT /api/quotes/:id - Update quote
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const body: UpdateQuoteRequest = req.body;
    const { 
      customerName, 
      customerEmail, 
      customerPhone,
      customerCompany,
      customerCpf,
      customerCnpj,
      customerCep,
      customerAddress,
      customerNumber,
      customerComplement,
      customerNeighborhood,
      customerCity,
      customerState,
      products, 
      notes, 
      paymentMethod 
    } = body;

    // Get current quote
    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentQuote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    // Prepare update data
    const updateData: any = {};

    if (customerName !== undefined) updateData.customer_name = customerName;
    if (customerEmail !== undefined) updateData.customer_email = customerEmail;
    if (customerPhone !== undefined) updateData.customer_phone = customerPhone;
    if (customerCompany !== undefined) updateData.customer_company = customerCompany;
    if (customerCpf !== undefined) updateData.customer_cpf = customerCpf;
    if (customerCnpj !== undefined) updateData.customer_cnpj = customerCnpj;
    if (customerCep !== undefined) updateData.customer_cep = customerCep;
    if (customerAddress !== undefined) updateData.customer_address = customerAddress;
    if (customerNumber !== undefined) updateData.customer_number = customerNumber;
    if (customerComplement !== undefined) updateData.customer_complement = customerComplement;
    if (customerNeighborhood !== undefined) updateData.customer_neighborhood = customerNeighborhood;
    if (customerCity !== undefined) updateData.customer_city = customerCity;
    if (customerState !== undefined) updateData.customer_state = customerState;
    if (notes !== undefined) updateData.notes = notes;

    if (products) {
      updateData.products = JSON.stringify(products);
      updateData.total_price = products.reduce((sum, p) => sum + p.subtotal, 0);
    }

    if (paymentMethod !== undefined) {
      updateData.condicoes_pagamento = paymentMethod ? JSON.stringify(paymentMethod) : null;
    }

    // If quote was already sent (has signature link), invalidate link
    if (currentQuote.status === 'sent' && currentQuote.signature_link) {
      updateData.signature_link = null;
      updateData.signature_link_created_at = null;
      updateData.status = 'draft';
      console.log(`⚠️ Quote ${currentQuote.quote_number} had active link - invalidating`);
    }

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const quote = parseQuote(data);
    console.log(`✅ Quote updated: ${quote.quoteNumber}`);
    res.json(quote);
  } catch (error) {
    console.error(`❌ Error updating quote ${id}:`, error);
    res.status(500).json({ message: 'Erro ao atualizar cotação.' });
  }
});

// POST /api/quotes/:id/signature-link - Generate signature link
router.post('/:id/signature-link', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get current quote
    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentQuote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    // Generate new UUID for signature link
    const signatureLink = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const updateData = {
      signature_link: signatureLink,
      signature_link_created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'sent',
      signature_link_version: (currentQuote.signature_link_version || 0) + 1,
    };

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const fullLink = `${appUrl}/assinar/${signatureLink}`;

    console.log(`✅ Signature link generated for ${data.quote_number}: ${fullLink}`);

    res.json({
      signatureLink: fullLink,
      expiresAt: expiresAt.toISOString(),
      token: signatureLink,
    });
  } catch (error) {
    console.error(`❌ Error generating signature link for ${id}:`, error);
    res.status(500).json({ message: 'Erro ao gerar link de assinatura.' });
  }
});

// POST /api/quotes/:id/regenerate-link - Regenerate expired link
router.post('/:id/regenerate-link', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get current quote
    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentQuote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    // Check if link is expired
    const now = new Date();
    const expiresAt = new Date(currentQuote.expires_at);

    if (expiresAt > now && currentQuote.status === 'sent') {
      return res.status(400).json({
        message: 'O link ainda está válido. Não é possível gerar um novo link.',
      });
    }

    // Generate new link (same logic as generate-signature-link)
    const signatureLink = crypto.randomUUID();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const updateData = {
      signature_link: signatureLink,
      signature_link_created_at: new Date().toISOString(),
      expires_at: newExpiresAt.toISOString(),
      status: 'sent',
      signature_link_version: (currentQuote.signature_link_version || 0) + 1,
    };

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const fullLink = `${appUrl}/assinar/${signatureLink}`;

    console.log(`✅ Link regenerated for ${data.quote_number}: ${fullLink}`);

    res.json({
      signatureLink: fullLink,
      expiresAt: newExpiresAt.toISOString(),
      token: signatureLink,
    });
  } catch (error) {
    console.error(`❌ Error regenerating link for ${id}:`, error);
    res.status(500).json({ message: 'Erro ao regerar link.' });
  }
});

// GET /api/quotes/:id/views - Get quote views
router.get('/:id/views', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('quote_views')
      .select('*')
      .eq('quote_id', id)
      .order('viewed_at', { ascending: false });

    if (error) throw error;

    const views = (data || []).map((v: any) => ({
      id: v.id,
      quoteId: v.quote_id,
      viewedAt: v.viewed_at,
      ipAddress: v.ip_address,
      userAgent: v.user_agent,
      geolocation: v.geolocation,
    }));

    res.json(views);
  } catch (error) {
    console.error(`❌ Error fetching views for quote ${id}:`, error);
    res.status(500).json({ message: 'Erro ao buscar visualizações.' });
  }
});

// DELETE /api/quotes/:id - Delete quote (soft delete by setting status)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if quote exists and is not converted
    const { data: currentQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentQuote) {
      return res.status(404).json({ message: 'Cotação não encontrada.' });
    }

    if (currentQuote.status === 'converted') {
      return res.status(400).json({
        message: 'Não é possível excluir cotações já convertidas em pedidos.',
      });
    }

    // Actually delete the quote
    const { error } = await supabase.from('quotes').delete().eq('id', id);

    if (error) throw error;

    console.log(`✅ Quote deleted: ${currentQuote.quote_number}`);
    res.json({ message: 'Cotação excluída com sucesso.' });
  } catch (error) {
    console.error(`❌ Error deleting quote ${id}:`, error);
    res.status(500).json({ message: 'Erro ao excluir cotação.' });
  }
});

export default router;
