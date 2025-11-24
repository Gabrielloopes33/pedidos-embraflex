-- ================================================
-- DESABILITAR RLS (Row Level Security)
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- Desabilitar RLS para permitir acesso via service_role
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT 'RLS desabilitado com sucesso!' as message;
