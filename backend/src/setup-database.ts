import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function setupDatabase() {
  console.log('🔧 Configurando banco de dados no Supabase...\n');

  try {
    console.log('✅ Verificando se tabelas existem...');
    
    // Tentar fazer uma query simples para verificar
    const { error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (checkError) {
      if (checkError.code === 'PGRST116' || checkError.message.includes('relation') || checkError.message.includes('does not exist')) {
        console.log('\n⚠️  As tabelas ainda não existem!');
        console.log('\n📋 EXECUTE O SQL ABAIXO NO SUPABASE STUDIO:');
        console.log('   1. Acesse: https://supa.agenciatouch.com.br');
        console.log('   2. Vá em: SQL Editor');
        console.log('   3. Cole e execute:\n');
        console.log('─'.repeat(60));
        console.log(`
-- Criar tabela users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'vendedor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  "customerName" TEXT NOT NULL,
  products TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  notes TEXT,
  "createdAt" TEXT NOT NULL,
  history TEXT NOT NULL,
  comments TEXT NOT NULL,
  "userId" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users (id) ON DELETE SET NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdat ON orders("createdAt");

-- Desabilitar RLS temporariamente para testes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
        `);
        console.log('─'.repeat(60));
        console.log('\n4. Após executar, rode: npm run seed');
        console.log('\n');
        process.exit(1);
      } else {
        console.log('✅ Tabelas encontradas!');
      }
    } else {
      console.log('✅ Tabela users encontrada!');
    }

    const { error: ordersCheck } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (!ordersCheck || ordersCheck.code !== 'PGRST116') {
      console.log('✅ Tabela orders encontrada!');
    }

    console.log('\n✅ Verificação completa! Você pode rodar: npm run seed');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

setupDatabase();
