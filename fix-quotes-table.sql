-- Script completo para tabela quotes do sistema Embraflex
-- Este script cria/atualiza a tabela quotes com todas as colunas necessárias
-- Executar no Supabase SQL Editor

-- Habilitar extensão UUID (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela quotes se não existir
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_number VARCHAR(50) UNIQUE NOT NULL,

  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_company VARCHAR(255),
  customer_cpf VARCHAR(14),
  customer_cnpj VARCHAR(18),
  customer_cep VARCHAR(9),
  customer_address VARCHAR(255),
  customer_number VARCHAR(20),
  customer_complement VARCHAR(100),
  customer_neighborhood VARCHAR(100),
  customer_city VARCHAR(100),
  customer_state VARCHAR(2),

  -- Quote data
  products JSONB NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  condicoes_pagamento TEXT,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft' NOT NULL,

  -- Creator info
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

-- Criar tabela quote_views se não existir
CREATE TABLE IF NOT EXISTS quote_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  geolocation JSONB
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by_id);
CREATE INDEX IF NOT EXISTS idx_quotes_signature_link ON quotes(signature_link);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_views_quote_id ON quote_views(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_views_viewed_at ON quote_views(viewed_at DESC);

-- Criar função para auto-atualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Criar função para gerar número de cotação
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str VARCHAR(4);
  seq_num INTEGER;
  new_quote_num VARCHAR(50);
BEGIN
  -- Obter ano atual
  year_str := TO_CHAR(NOW(), 'YYYY');

  -- Obter próximo número de sequência para este ano
  SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM 9) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM quotes
  WHERE quote_number LIKE 'QT-' || year_str || '%';

  -- Gerar novo número de cotação: QT-YYYY-NNNN
  new_quote_num := 'QT-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');

  NEW.quote_number := new_quote_num;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para gerar número de cotação automaticamente
DROP TRIGGER IF EXISTS generate_quote_number_trigger ON quotes;
CREATE TRIGGER generate_quote_number_trigger
BEFORE INSERT ON quotes
FOR EACH ROW
WHEN (NEW.quote_number IS NULL OR NEW.quote_number = '')
EXECUTE FUNCTION generate_quote_number();

-- Adicionar comentários para documentação
COMMENT ON TABLE quotes IS 'Tabela de cotações do sistema de vendas Embraflex';
COMMENT ON TABLE quote_views IS 'Tabela de rastreamento de visualizações de links de assinatura';
COMMENT ON COLUMN quotes.status IS 'Status: draft (rascunho), sent (enviado), approved (aprovado), rejected (rejeitado), converted (convertido em pedido)';
COMMENT ON COLUMN quotes.signature_link IS 'UUID único usado como token na URL de assinatura pública';
COMMENT ON COLUMN quotes.signature_link_version IS 'Incrementa a cada vez que um novo link é gerado';
COMMENT ON COLUMN quotes.condicoes_pagamento IS 'Armazena a forma de pagamento da cotação como JSON string. Inclui tipo (pix, cartão, boleto, dinheiro, combinação), detalhes específicos de cada método, e observações.';
COMMENT ON COLUMN quotes.customer_company IS 'Nome da empresa do cliente';
COMMENT ON COLUMN quotes.customer_cpf IS 'CPF do cliente (formatado)';
COMMENT ON COLUMN quotes.customer_cnpj IS 'CNPJ do cliente (formatado)';
COMMENT ON COLUMN quotes.customer_cep IS 'CEP do cliente (formatado)';
COMMENT ON COLUMN quotes.customer_address IS 'Endereço do cliente (rua/avenida)';
COMMENT ON COLUMN quotes.customer_number IS 'Número do endereço';
COMMENT ON COLUMN quotes.customer_complement IS 'Complemento do endereço (apto, bloco, etc)';
COMMENT ON COLUMN quotes.customer_neighborhood IS 'Bairro do cliente';
COMMENT ON COLUMN quotes.customer_city IS 'Cidade do cliente';
COMMENT ON COLUMN quotes.customer_state IS 'Estado do cliente (UF)';
