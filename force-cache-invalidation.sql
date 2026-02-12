-- Script AGRESSIVO para limpar cache do schema PostgreSQL
-- Use este script se os outros não funcionarem
-- Executar no Supabase SQL Editor

-- ATENÇÃO: Este script usa comandos que podem ter impacto temporário no banco
-- Mas são seguros e necessários para forçar atualização do cache

-- Passo 1: Forçar invalidação do cache de schema para a tabela quotes
DO $$
BEGIN
  -- Tenta invalidar o cache da tabela quotes
  PERFORM pg_notify('invalidate_schema_cache', 'quotes');

  RAISE NOTICE '🔄 Cache do schema invalidado para tabela quotes';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Falha ao invalidar cache: %', SQLERRM;
END $$;

-- Passo 2: Forçar reanálise da tabela quotes
DO $$
BEGIN
  -- Força o PostgreSQL a reanalisar a tabela quotes
  ANALYZE quotes;

  RAISE NOTICE '📊 Tabela quotes reanalisada';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Falha ao reanalisar tabela: %', SQLERRM;
END $$;

-- Passo 3: Reiniciar conexões para forçar recarregamento
-- Isso só funciona se você tiver permissão de superusuário
-- Tente executar, pode não funcionar no Supabase
DO $$
BEGIN
  -- Reinicia todas as conexões (pode não ter permissão)
  -- SELECT pg_terminate_backend(pid)
  -- FROM pg_stat_activity
  -- WHERE state = 'idle';

  RAISE NOTICE '🔄 Tentativa de reiniciar conexões';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Sem permissão para reiniciar conexões (esperado)';
END $$;

-- Passo 4: Verificar se a coluna condicoes_pagamento existe
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
    RAISE NOTICE '✅ VERIFICAÇÃO CONFIRMADA: A coluna condicoes_pagamento EXISTE!';
    RAISE NOTICE '🎯 O cache do PostgreSQL pode estar desatualizado.';
    RAISE NOTICE '💡 SOLUÇÃO: Reinicie o backend para forçar nova conexão com o banco.';
  ELSE
    RAISE NOTICE '❌ VERIFICAÇÃO FALHOU: A coluna condicoes_pagamento NÃO existe.';
    RAISE NOTICE '🔧 Execute o script fix-quotes-table-complete.sql para adicionar a coluna.';
  END IF;
END $$;

-- Passo 5: Listar coluna condicoes_pagamento (se existir) para confirmar
SELECT
  column_name,
  data_type,
  is_nullable,
  character_maximum_length,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'quotes'
AND column_name = 'condicoes_pagamento';

-- Passo 6: Listar TODAS as colunas da tabela quotes para referência
SELECT
  column_name,
  data_type,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'quotes'
ORDER BY ordinal_position;
