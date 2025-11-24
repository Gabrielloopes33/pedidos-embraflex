-- ================================================
-- CORREÇÃO COMPLETA DE RLS E PERMISSÕES
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- 1. Desabilitar RLS completamente para permitir service_role
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON orders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON orders;
DROP POLICY IF EXISTS "Enable all for service role" ON orders;

DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable all for service role" ON users;

-- 3. Garantir que as permissões estão corretas
GRANT ALL ON orders TO service_role;
GRANT ALL ON users TO service_role;
GRANT ALL ON orders TO anon;
GRANT ALL ON users TO anon;

-- 4. Verificar se funcionou
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('orders', 'users');

-- 5. Teste de inserção
-- Descomente a linha abaixo após executar o script para testar
-- INSERT INTO orders (id, "customerName", products, status, priority, "createdAt", history, comments, "userId") 
-- VALUES ('test-' || gen_random_uuid()::text, 'Teste RLS', '[]', 'Pendente', 'Normal', NOW()::text, '[]', '[]', NULL);
