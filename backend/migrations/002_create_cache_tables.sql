-- Migration: Create WooCommerce cache tables
-- Created: 2026-01-27
-- Description: Cache de produtos e clientes do WooCommerce para melhorar performance

-- Tabela de cache de produtos do WooCommerce
CREATE TABLE IF NOT EXISTS wc_products_cache (
  id INTEGER PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10,2),
  regular_price DECIMAL(10,2),
  description TEXT,
  short_description TEXT,
  stock_status VARCHAR(50),
  stock_quantity INTEGER,
  manage_stock BOOLEAN,
  images JSONB,
  categories JSONB,
  attributes JSONB,
  variations JSONB,
  meta_data JSONB,
  -- Preços por quantidade (custom field)
  precos_por_quantidade JSONB,
  -- Metadados de sincronização
  wc_modified_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- Índices de busca
  search_vector TSVECTOR
);

-- Tabela de cache de clientes do WooCommerce
CREATE TABLE IF NOT EXISTS wc_customers_cache (
  id INTEGER PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  username VARCHAR(100),
  billing JSONB,
  shipping JSONB,
  role VARCHAR(50),
  -- Metadados de sincronização
  wc_modified_at TIMESTAMP WITH TIME ZONE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT true,
  -- Índices de busca
  search_vector TSVECTOR
);

-- Tabela de metadados de sincronização
CREATE TABLE IF NOT EXISTS wc_sync_metadata (
  id SERIAL PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL, -- 'products', 'customers', 'full', 'incremental'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'running' NOT NULL, -- 'running', 'completed', 'failed'
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  error_message TEXT,
  last_synced_at TIMESTAMP WITH TIME ZONE, -- Última data modificada do WooCommerce
  triggered_by TEXT, -- 'login', 'manual', 'webhook', 'scheduled'
  user_id TEXT, -- Usuário que disparou o sync
  metadata JSONB
);

-- Índices para performance - produtos
CREATE INDEX IF NOT EXISTS idx_wc_products_name ON wc_products_cache USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_wc_products_sku ON wc_products_cache(sku);
CREATE INDEX IF NOT EXISTS idx_wc_products_synced_at ON wc_products_cache(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_wc_products_is_active ON wc_products_cache(is_active);
CREATE INDEX IF NOT EXISTS idx_wc_products_search ON wc_products_cache USING gin(search_vector);

-- Índices para performance - clientes
CREATE INDEX IF NOT EXISTS idx_wc_customers_email ON wc_customers_cache(email);
CREATE INDEX IF NOT EXISTS idx_wc_customers_name ON wc_customers_cache USING gin(to_tsvector('portuguese', first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_wc_customers_synced_at ON wc_customers_cache(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_wc_customers_is_active ON wc_customers_cache(is_active);
CREATE INDEX IF NOT EXISTS idx_wc_customers_search ON wc_customers_cache USING gin(search_vector);

-- Índices para performance - metadados
CREATE INDEX IF NOT EXISTS idx_wc_sync_metadata_status ON wc_sync_metadata(status);
CREATE INDEX IF NOT EXISTS idx_wc_sync_metadata_started_at ON wc_sync_metadata(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_wc_sync_metadata_sync_type ON wc_sync_metadata(sync_type);

-- Função para atualizar search_vector de produtos
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.sku, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.short_description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para search_vector de produtos
DROP TRIGGER IF EXISTS update_wc_products_search_vector ON wc_products_cache;
CREATE TRIGGER update_wc_products_search_vector
BEFORE INSERT OR UPDATE ON wc_products_cache
FOR EACH ROW
EXECUTE FUNCTION update_product_search_vector();

-- Função para atualizar search_vector de clientes
CREATE OR REPLACE FUNCTION update_customer_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.username, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para search_vector de clientes
DROP TRIGGER IF EXISTS update_wc_customers_search_vector ON wc_customers_cache;
CREATE TRIGGER update_wc_customers_search_vector
BEFORE INSERT OR UPDATE ON wc_customers_cache
FOR EACH ROW
EXECUTE FUNCTION update_customer_search_vector();

-- Função para limpar cache antigo (opcional, para manutenção)
CREATE OR REPLACE FUNCTION cleanup_old_cache(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Marcar produtos inativos se não foram sincronizados recentemente
  UPDATE wc_products_cache
  SET is_active = false
  WHERE synced_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND is_active = true;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter status do último sync
CREATE OR REPLACE FUNCTION get_last_sync_status(sync_type_param VARCHAR DEFAULT NULL)
RETURNS TABLE (
  id INTEGER,
  sync_type VARCHAR,
  status VARCHAR,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  items_processed INTEGER,
  items_created INTEGER,
  items_updated INTEGER,
  items_failed INTEGER,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    sync_type,
    status,
    started_at,
    completed_at,
    items_processed,
    items_created,
    items_updated,
    items_failed,
    error_message
  FROM wc_sync_metadata
  WHERE (sync_type_param IS NULL OR sync_type = sync_type_param)
  ORDER BY started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação (com verificação de existência)
DO $$
BEGIN
  -- Comentários de tabela
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wc_products_cache') THEN
    EXECUTE 'COMMENT ON TABLE wc_products_cache IS ''Cache de produtos do WooCommerce para melhorar performance de consultas''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wc_customers_cache') THEN
    EXECUTE 'COMMENT ON TABLE wc_customers_cache IS ''Cache de clientes do WooCommerce para melhorar performance de consultas''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wc_sync_metadata') THEN
    EXECUTE 'COMMENT ON TABLE wc_sync_metadata IS ''Metadados de sincronização com WooCommerce''';
  END IF;

  -- Comentários de colunas
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_products_cache' AND column_name = 'precos_por_quantidade') THEN
    EXECUTE 'COMMENT ON COLUMN wc_products_cache.precos_por_quantidade IS ''Preços dinâmicos por quantidade (JSON)''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_products_cache' AND column_name = 'wc_modified_at') THEN
    EXECUTE 'COMMENT ON COLUMN wc_products_cache.wc_modified_at IS ''Data da última modificação no WooCommerce''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_products_cache' AND column_name = 'synced_at') THEN
    EXECUTE 'COMMENT ON COLUMN wc_products_cache.synced_at IS ''Data da última sincronização com o cache''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_products_cache' AND column_name = 'is_active') THEN
    EXECUTE 'COMMENT ON COLUMN wc_products_cache.is_active IS ''Indica se o produto está ativo no cache''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_sync_metadata' AND column_name = 'sync_type') THEN
    EXECUTE 'COMMENT ON COLUMN wc_sync_metadata.sync_type IS ''Tipo de sync: products, customers, full, incremental''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wc_sync_metadata' AND column_name = 'triggered_by') THEN
    EXECUTE 'COMMENT ON COLUMN wc_sync_metadata.triggered_by IS ''Quem disparou o sync: login, manual, webhook, scheduled''';
  END IF;

  -- Comentários de funções
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cleanup_old_cache') THEN
    EXECUTE 'COMMENT ON FUNCTION cleanup_old_cache IS ''Marca produtos como inativos se não foram sincronizados recentemente''';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_last_sync_status') THEN
    EXECUTE 'COMMENT ON FUNCTION get_last_sync_status IS ''Retorna o status do último sync realizado''';
  END IF;
END $$;
