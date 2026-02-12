-- Script para adicionar coluna condicoes_pagamento à tabela quotes existente
-- Executar no Supabase SQL Editor

-- Verificar se a tabela quotes existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'quotes'
  ) THEN
    RAISE NOTICE '⚠️ Tabela quotes não existe. Execute o script fix-quotes-table.sql completo.';
  ELSE
    -- Tabela existe, apenas adicionar a coluna faltante
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
  END IF;
END $$;
