-- Script SIMPLES para adicionar coluna condicoes_pagamento
-- Tenta adicionar a coluna, ignora se já existir
-- Executar no Supabase SQL Editor

-- Comando direto e simples para adicionar a coluna
-- Se a coluna já existir, PostgreSQL retorna um aviso mas não erro
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS condicoes_pagamento TEXT;

-- Adicionar comentário à coluna
COMMENT ON COLUMN quotes.condicoes_pagamento IS
  'Armazena a forma de pagamento da cotação como JSON string. Inclui tipo (pix, cartão, boleto, dinheiro, combinação), detalhes específicos de cada método, e observações.';

-- Verificar se a coluna foi criada listando-a
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
    RAISE NOTICE '✅ SUCESSO: A coluna condicoes_pagamento EXISTE na tabela quotes!';
    RAISE NOTICE '🎯 Próximo passo: Reinicie o backend no Render para forçar nova conexão.';
  ELSE
    RAISE NOTICE '❌ FALHA: A coluna condicoes_pagamento NÃO existe.';
    RAISE NOTICE '🔧 Verifique se o comando ALTER TABLE acima teve erro.';
  END IF;
END $$;
