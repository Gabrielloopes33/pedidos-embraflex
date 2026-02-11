-- ================================================
-- INVESTIGAR: Ver exatamente o que está causando o problema
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- 1. Ver TODOS os triggers da tabela users
SELECT 
  trigger_name,
  event_manipulation as "quando",
  action_timing as "timing",
  action_statement as "o_que_executa"
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Ver todas as policies (RLS)
SELECT 
  policyname as "nome_policy",
  cmd as "comando",
  qual as "condição"
FROM pg_policies 
WHERE tablename = 'users';

-- 3. Ver se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as "rls_habilitado"
FROM pg_tables
WHERE tablename = 'users';

-- 4. Ver todas as funções que usam jsonb
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%jsonb%'
  AND specific_schema = 'public';
