-- Migration: Create quotes and quote_views tables
-- Created: 2026-01-14
-- Description: Sistema de cotações com assinatura digital e rastreamento

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number VARCHAR(50) UNIQUE NOT NULL,

  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),

  -- Quote data
  products JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft' NOT NULL,

  -- Creator info (foreign key removida temporariamente)
  created_by_id UUID,
  created_by_name VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),

  -- Signature link
  signature_link UUID,
  signature_link_created_at TIMESTAMP WITH TIME ZONE,
  signature_link_version INTEGER DEFAULT 1 NOT NULL,

  -- Signature data
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB,

  -- Rejection data
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,

  -- Conversion
  converted_to_order_id UUID,

  -- Notes
  notes TEXT,

  -- Constraints
  CONSTRAINT status_check CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'converted'))
);

-- Create quote_views table for tracking link views
CREATE TABLE IF NOT EXISTS quote_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  geolocation JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by_id);
CREATE INDEX IF NOT EXISTS idx_quotes_signature_link ON quotes(signature_link);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_views_quote_id ON quote_views(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_viewed_at ON quote_views(viewed_at DESC);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate quote number
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  seq_num INTEGER;
  new_quote_num VARCHAR(50);
BEGIN
  -- Get current year
  year_str := TO_CHAR(NOW(), 'YYYY');

  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 9) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM quotes
  WHERE quote_number LIKE 'QT-' || year_str || '%';

  -- Generate new quote number: QT-YYYY-NNNN
  new_quote_num := 'QT-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');

  NEW.quote_number := new_quote_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating quote number
CREATE TRIGGER generate_quote_number_trigger
BEFORE INSERT ON quotes
FOR EACH ROW
WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
EXECUTE FUNCTION generate_quote_number();

-- Add comments for documentation
COMMENT ON TABLE quotes IS 'Tabela de cotações do sistema de vendas';
COMMENT ON TABLE quote_views IS 'Tabela de rastreamento de visualizações de links de assinatura';
COMMENT ON COLUMN quotes.status IS 'Status: draft, sent, approved, rejected, converted';
COMMENT ON COLUMN quotes.signature_link IS 'UUID único usado como token na URL de assinatura';
COMMENT ON COLUMN quotes.signature_link_version IS 'Incrementa a cada vez que um novo link é gerado';
