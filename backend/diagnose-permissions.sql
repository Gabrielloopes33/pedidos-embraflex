-- ================================================
-- DIAGNÓSTICO E CORREÇÃO DE PERMISSÕES
-- Execute no Supabase Studio > SQL Editor
-- ================================================

-- 1. Verificar permissões atuais
SELECT 
  grantee, 
  table_schema, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'orders'
ORDER BY grantee, privilege_type;

-- 2. Garantir todas as permissões necessárias
GRANT ALL PRIVILEGES ON TABLE orders TO postgres;
GRANT ALL PRIVILEGES ON TABLE orders TO service_role;
GRANT ALL PRIVILEGES ON TABLE orders TO anon;
GRANT ALL PRIVILEGES ON TABLE orders TO authenticated;

-- 3. Garantir permissões no schema
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4. Verificar se há triggers que podem estar bloqueando
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- 5. Teste de inserção direto no SQL
INSERT INTO orders (
  id, 
  "customerName", 
  products, 
  status, 
  priority, 
  "createdAt", 
  history, 
  comments, 
  "userId"
) VALUES (
  'test-sql-' || gen_random_uuid()::text,
  'Teste SQL Direto',
  '[]'::text,
  'Pendente'::text,
  'Normal'::text,
  NOW()::text,
  '[]'::text,
  '[]'::text,
  NULL
) RETURNING *;

-- Se o teste acima funcionou, o problema é nas permissões da API
-- Se não funcionou, há algo errado na estrutura da tabela

-- 6. Verificar estrutura completa da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
