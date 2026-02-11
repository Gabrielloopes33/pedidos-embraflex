-- ================================================
-- FIX: Remover todas as policies e constraints problemáticas da tabela users
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- 1. Desabilitar RLS completamente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as policies existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable all for service role" ON users;
DROP POLICY IF EXISTS "Allow service role all access" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can do everything" ON users;

-- 3. Garantir que a tabela pertence ao postgres (não ao service role)
ALTER TABLE users OWNER TO postgres;

-- 4. Conceder permissões completas ao service_role e authenticator
GRANT ALL ON users TO service_role;
GRANT ALL ON users TO authenticator;
GRANT ALL ON users TO postgres;

-- 5. Verificar a estrutura da tabela
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 6. Verificar se há triggers problemáticos
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 7. Verificar constraints
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'users';

-- 8. Confirmar que RLS está desabilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- Se você quiser recriar a tabela do zero (última opção):
-- DROP TABLE IF EXISTS users CASCADE;
-- CREATE TABLE users (
--   id TEXT PRIMARY KEY,
--   username TEXT UNIQUE NOT NULL,
--   password TEXT NOT NULL,
--   email TEXT,
--   role TEXT NOT NULL CHECK(role IN ('admin', 'vendedor')),
--   full_name TEXT,
--   is_active BOOLEAN DEFAULT true,
--   last_login TIMESTAMPTZ,
--   created_by TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- 
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- GRANT ALL ON users TO service_role;
-- GRANT ALL ON users TO authenticator;
-- GRANT ALL ON users TO postgres;
