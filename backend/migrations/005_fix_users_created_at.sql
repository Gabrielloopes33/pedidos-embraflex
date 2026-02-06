-- Migration: Add created_at to users table
-- Created: 2026-02-06
-- Description: Adiciona campo created_at na tabela users (corrige problema de criação de usuários)

-- Adicionar coluna created_at se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_at'
  ) THEN
    -- Adicionar coluna
    ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    
    -- Atualizar registros existentes com a data atual (ou usar outra data razoável)
    UPDATE users SET created_at = NOW() WHERE created_at IS NULL;
    
    RAISE NOTICE 'Coluna created_at adicionada à tabela users';
  ELSE
    RAISE NOTICE 'Coluna created_at já existe na tabela users';
  END IF;
END $$;

-- Verificar estrutura da tabela
DO $$
BEGIN
  RAISE NOTICE 'Estrutura atual da tabela users:';
END $$;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
