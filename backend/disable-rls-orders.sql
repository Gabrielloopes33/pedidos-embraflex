-- Desabilitar RLS na tabela orders para permitir acesso sem autenticação
-- Execute este SQL no Supabase SQL Editor

-- Desabilitar RLS
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Opcional: Remover todas as policies existentes
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- Verificar se RLS foi desabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'orders';
-- Se rowsecurity = false, está desabilitado ✓
