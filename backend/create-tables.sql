-- ================================================
-- Script de criação de tabelas para o Supabase
-- Execute este SQL no Supabase Studio > SQL Editor
-- ================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'vendedor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  products TEXT NOT NULL, -- Armazenado como JSON string
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT,
  "createdAt" TEXT NOT NULL,
  history TEXT NOT NULL, -- Armazenado como JSON string
  comments TEXT NOT NULL, -- Armazenado como JSON string
  "userId" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE SET NULL
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdat ON orders("createdAt");

-- Habilitar Row Level Security (RLS) para segurança
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable all access for service role" ON users;
DROP POLICY IF EXISTS "Enable all access for service role" ON orders;
DROP POLICY IF EXISTS "Allow service role full access" ON users;
DROP POLICY IF EXISTS "Allow service role full access" ON orders;

-- Políticas RLS (permitem acesso via service_role key)
-- IMPORTANTE: Estas políticas permitem acesso total via service_role
CREATE POLICY "Allow service role full access" ON users
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access" ON orders
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Mensagem de sucesso
SELECT 'Tabelas criadas com sucesso!' as message;
