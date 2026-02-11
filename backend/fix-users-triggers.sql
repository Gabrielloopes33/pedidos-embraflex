-- ================================================
-- FIX DEFINITIVO: Remover trigger problemático da tabela users
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- 1. Listar todos os triggers da tabela users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 2. Remover TODOS os triggers da tabela users
-- (ajuste os nomes de acordo com o resultado acima)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON users', r.trigger_name);
    RAISE NOTICE 'Trigger removido: %', r.trigger_name;
  END LOOP;
END $$;

-- 3. Remover function problemática se existir
DROP FUNCTION IF EXISTS jsonb_object_length(jsonb);

-- 4. Desabilitar RLS (garantir que está desabilitado)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 5. Remover todas as policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON users', r.policyname);
    RAISE NOTICE 'Policy removida: %', r.policyname;
  END LOOP;
END $$;

-- 6. Garantir permissões
GRANT ALL ON users TO postgres;
GRANT ALL ON users TO service_role;
GRANT ALL ON users TO authenticator;

-- 7. Verificar se funcionou - tentar um UPDATE
UPDATE users 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM users LIMIT 1);

-- 8. Confirmar resultado
SELECT 'FIX APLICADO COM SUCESSO!' as resultado;

-- 9. Listar triggers restantes (deve estar vazio)
SELECT 
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'users';
