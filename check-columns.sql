-- Script simples para verificar quais colunas existem na tabela quotes
-- Execute para conferir se condicoes_pagamento existe
-- Executar no Supabase SQL Editor

-- Listar todas as colunas da tabela quotes
SELECT
  column_name,
  data_type,
  is_nullable,
  character_maximum_length,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'quotes'
ORDER BY ordinal_position;

-- Verificação específica para coluna condicoes_pagamento
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
    RAISE NOTICE '✅ A coluna condicoes_pagamento EXISTE na tabela quotes';
  ELSE
    RAISE NOTICE '❌ A coluna condicoes_pagamento NÃO EXISTE na tabela quotes';
  END IF;
END $$;
