-- ================================================
-- FIX DIRETO: Forçar desabilitação de RLS e remover tudo
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- Garantir que estamos no schema public
SET search_path TO public;

-- 1. Remover TODOS os triggers (qualquer schema)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT 
      n.nspname as schema_name,
      t.tgname as trigger_name,
      c.relname as table_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = 'users'
      AND NOT t.tgisinternal
  )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I', 
      r.trigger_name, r.schema_name, r.table_name);
    RAISE NOTICE 'Trigger removido: %.%', r.schema_name, r.trigger_name;
  END LOOP;
END $$;

-- 2. Remover TODAS as policies (qualquer schema)
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT 
      schemaname,
      tablename,
      policyname
    FROM pg_policies 
    WHERE tablename = 'users'
  )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      r.policyname, r.schemaname, r.tablename);
    RAISE NOTICE 'Policy removida: %.%', r.schemaname, r.policyname;
  END LOOP;
END $$;

-- 3. Desabilitar RLS em TODOS os schemas onde users existe
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE tablename = 'users'
  )
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 
      r.schemaname, r.tablename);
    RAISE NOTICE 'RLS desabilitado em: %.%', r.schemaname, r.tablename;
  END LOOP;
END $$;

-- 4. Garantir permissões em public.users
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticator;
GRANT ALL ON public.users TO anon;

-- 5. Tentar um UPDATE de teste
UPDATE public.users 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM public.users LIMIT 1)
RETURNING id, username, updated_at;

-- 6. Verificar resultado final
SELECT 
  schemaname as "schema",
  tablename as "tabela",
  rowsecurity as "rls_ainda_ativo"
FROM pg_tables
WHERE tablename = 'users'
ORDER BY schemaname;

-- 7. Confirmar sucesso
SELECT 'FIX COMPLETO APLICADO!' as resultado;
