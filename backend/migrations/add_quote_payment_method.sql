-- Migration: Adicionar coluna condicoes_pagamento à tabela quotes
-- Criado em: 2026-02-11
-- Descrição: Adiciona suporte para formas de pagamento detalhadas nas cotações

DO $$
BEGIN
  -- Verifica se a coluna já existe antes de adicionar
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'quotes'
      AND column_name = 'condicoes_pagamento'
  ) THEN
    ALTER TABLE quotes ADD COLUMN condicoes_pagamento TEXT;

    RAISE NOTICE '✅ Coluna condicoes_pagamento adicionada com sucesso à tabela quotes';

    -- Adicionar comentário explicando o propósito da coluna
    COMMENT ON COLUMN quotes.condicoes_pagamento IS
      'Armazena a forma de pagamento da cotação como JSON string. Inclui tipo (pix, cartão, boleto, dinheiro, combinação), detalhes específicos de cada método, e observações.';

  ELSE
    RAISE NOTICE 'ℹ️  Coluna condicoes_pagamento já existe na tabela quotes. Nenhuma ação necessária.';
  END IF;
END $$;
