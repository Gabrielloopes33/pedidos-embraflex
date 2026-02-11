-- ================================================
-- INVESTIGAÇÃO DETALHADA: Schemas e duplicações
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- 1. Ver TODAS as tabelas users em TODOS os schemas
SELECT 
  schemaname as "schema",
  tablename as "tabela",
  tableowner as "dono",
  rowsecurity as "rls_habilitado",
  hasindexes as "tem_indices"
FROM pg_tables
WHERE tablename = 'users'
ORDER BY schemaname;

-- 2. Ver o schema que você está usando
SELECT current_schema();

-- 3. Ver todos os schemas disponíveis
SELECT schema_name 
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name;

-- 4. Ver triggers APENAS do schema public
SELECT 
  n.nspname as "schema",
  t.tgname as "trigger_name",
  c.relname as "tabela",
  pg_get_triggerdef(t.oid) as "definição_completa"
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 5. Tentar desabilitar RLS especificamente no schema public
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 6. Verificar novamente
SELECT 
  schemaname as "schema",
  tablename as "tabela",
  rowsecurity as "rls_habilitado"
FROM pg_tables
WHERE tablename = 'users'
ORDER BY schemaname;

-- 7. Se houver trigger, ver a definição completa
SELECT 
  trigger_name,
  event_object_schema as "schema",
  event_object_table as "tabela",
  action_statement as "ação"
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;
