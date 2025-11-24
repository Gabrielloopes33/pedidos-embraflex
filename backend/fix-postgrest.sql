-- ================================================
-- VERIFICAR E CORRIGIR CONFIGURAÇÃO DO POSTGREST
-- Execute no Supabase Studio > SQL Editor
-- ================================================

-- 1. Verificar se a tabela está no schema correto
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'orders';

-- 2. Garantir que o schema public está acessível
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Definir permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 4. Verificar o owner da tabela
SELECT 
  t.tablename,
  t.tableowner,
  has_table_privilege('anon', 'orders', 'INSERT') as anon_can_insert,
  has_table_privilege('service_role', 'orders', 'INSERT') as service_can_insert,
  has_table_privilege('authenticated', 'orders', 'INSERT') as auth_can_insert
FROM pg_tables t
WHERE t.tablename = 'orders';

-- 5. Se o owner não for postgres, alterar
ALTER TABLE orders OWNER TO postgres;
ALTER TABLE users OWNER TO postgres;

-- 6. Re-aplicar permissões explicitamente
GRANT ALL ON TABLE orders TO postgres;
GRANT ALL ON TABLE orders TO anon;
GRANT ALL ON TABLE orders TO authenticated; 
GRANT ALL ON TABLE orders TO service_role;

-- 7. Testar inserção novamente
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
  'test-postgrest-' || gen_random_uuid()::text,
  'Teste PostgREST Fix',
  '[]',
  'Pendente',
  'Normal',
  NOW()::text,
  '[]',
  '[]',
  NULL
) RETURNING *;

-- 8. Verificar todas as permissões
SELECT 
  grantee,
  table_name,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.table_privileges
WHERE table_name IN ('orders', 'users')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'postgres')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;
