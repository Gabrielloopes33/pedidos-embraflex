-- Migration: Adicionar campos completos do cliente na tabela quotes
-- Created: 2026-02-11
-- Description: Adiciona campos para armazenar todos os dados do cliente coletados no formulário

-- Adicionar colunas para dados completos do cliente
ALTER TABLE quotes 
  ADD COLUMN IF NOT EXISTS customer_company VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_cpf VARCHAR(14),
  ADD COLUMN IF NOT EXISTS customer_cnpj VARCHAR(18),
  ADD COLUMN IF NOT EXISTS customer_cep VARCHAR(9),
  ADD COLUMN IF NOT EXISTS customer_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS customer_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_complement VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_neighborhood VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS customer_state VARCHAR(2);

-- Adicionar comentários para documentação
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
