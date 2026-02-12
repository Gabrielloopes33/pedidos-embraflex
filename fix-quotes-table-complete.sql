-- Script completo para adicionar coluna condicoes_pagamento com limpeza de cache
-- Executar no Supabase SQL Editor

-- Passo 1: Forçar limpeza do cache do schema
-- Isso é necessário quando o PostgreSQL mantém a estrutura da tabela em cache
NOTIFY pgbouncer_conflict_reload;

-- Passo 2: Adicionar coluna se não existir
DO $$
BEGIN
  -- Verificar se a coluna já existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'quotes'
    AND column_name = 'condicoes_pagamento'
  ) THEN
    -- Adicionar coluna condicoes_pagamento
    ALTER TABLE quotes ADD COLUMN condicoes_pagamento TEXT;

    -- Adicionar comentário
    COMMENT ON COLUMN quotes.condicoes_pagamento IS
      'Armazena a forma de pagamento da cotação como JSON string. Inclui tipo (pix, cartão, boleto, dinheiro, combinação), detalhes específicos de cada método, e observações.';

    RAISE NOTICE '✅ Coluna condicoes_pagamento adicionada com sucesso à tabela quotes!';
  ELSE
    RAISE NOTICE 'ℹ️ Coluna condicoes_pagamento já existe na tabela quotes.';
  END IF;
END $$;

-- Passo 3: Verificar se a coluna foi criada com sucesso
-- Isso força o PostgreSQL a recarregar o schema
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'quotes'
    AND column_name = 'condicoes_pagamento'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE NOTICE '🎯 VERIFICAÇÃO: A coluna condicoes_pagamento existe e está pronta para uso!';
  ELSE
    RAISE NOTICE '❌ ERRO CRÍTICO: A coluna condicoes_pagamento NÃO existe após tentativa de criação!';
  END IF;
END $$;

-- Passo 4: Listar todas as colunas da tabela quotes para conferência
-- Use isso para confirmar visualmente que a coluna está lá
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'quotes'
ORDER BY ordinal_position;
