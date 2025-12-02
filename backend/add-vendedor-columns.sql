-- ================================================
-- Adicionar colunas de vendedor à tabela orders
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- Adicionar coluna vendedorId se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'vendedorId'
  ) THEN
    ALTER TABLE orders ADD COLUMN "vendedorId" TEXT;
    RAISE NOTICE 'Coluna vendedorId adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna vendedorId já existe.';
  END IF;
END $$;

-- Adicionar coluna vendedorName se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'vendedorName'
  ) THEN
    ALTER TABLE orders ADD COLUMN "vendedorName" TEXT;
    RAISE NOTICE 'Coluna vendedorName adicionada com sucesso!';
  ELSE
    RAISE NOTICE 'Coluna vendedorName já existe.';
  END IF;
END $$;

-- Atualizar pedidos existentes com dados do vendedor baseado no userId
UPDATE orders o
SET 
  "vendedorId" = o."userId",
  "vendedorName" = u.username
FROM users u
WHERE o."userId" = u.id
  AND o."vendedorId" IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_orders_vendedorid ON orders("vendedorId");

-- Mensagem de sucesso
SELECT 'Colunas de vendedor adicionadas e pedidos atualizados com sucesso!' as message;
