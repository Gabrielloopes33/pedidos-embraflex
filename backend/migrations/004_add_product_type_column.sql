-- Migration: Add product type column to cache
-- Created: 2026-01-28
-- Description: Adiciona coluna 'type' na tabela de cache de produtos para suportar produtos variáveis

-- Adicionar coluna type se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wc_products_cache' AND column_name = 'type'
  ) THEN
    ALTER TABLE wc_products_cache ADD COLUMN type VARCHAR(50) DEFAULT 'simple';
  END IF;
END $$;

-- Adicionar índice para type
CREATE INDEX IF NOT EXISTS idx_wc_products_type ON wc_products_cache(type);

-- Comentário da coluna
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_products_cache' AND column_name = 'type') THEN
    EXECUTE 'COMMENT ON COLUMN wc_products_cache.type IS ''Tipo do produto no WooCommerce: simple, variable, grouped, external''';
  END IF;
END $$;
