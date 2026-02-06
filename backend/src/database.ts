import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductionOrder } from './types';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY devem estar configurados no .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  },
});

async function initializeDb(): Promise<SupabaseClient> {
  try {
    console.log('🔌 Conectando ao Supabase via REST API...');
    console.log('📍 URL:', supabaseUrl);
    
    // Testar conexão fazendo uma query simples
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe (ok para primeira execução)
      console.log('📊 Criando tabelas no Supabase...');
      
      // Criar tabelas usando SQL via Supabase
      const createTablesSQL = `
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
          products TEXT NOT NULL,
          status TEXT NOT NULL,
          priority TEXT NOT NULL,
          notes TEXT,
          "createdAt" TEXT NOT NULL,
          history TEXT NOT NULL,
          comments TEXT NOT NULL,
          "userId" TEXT,
          FOREIGN KEY ("userId") REFERENCES users (id)
        );
      `;

      // Executar SQL via RPC ou diretamente no Supabase Studio
      // Como não temos RPC configurado, vamos apenas logar
      console.log('⚠️  Execute este SQL no Supabase Studio (SQL Editor):');
      console.log(createTablesSQL);
      console.log('\n✅ Após executar o SQL, as tabelas estarão prontas!');
    } else {
      console.log('✅ Conectado ao Supabase com sucesso!');
      console.log('✅ Tabelas já existem ou estão prontas para uso');
    }

    return supabase;
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error);
    throw error;
  }
}

function parseOrder(row: any): ProductionOrder {
  return {
    id: row.id,
    customerName: row.customerName,
    products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
    status: row.status,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.createdAt,
    history: typeof row.history === 'string' ? JSON.parse(row.history) : row.history,
    comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : row.comments,
    userId: row.userId,
    vendedorId: row.vendedorId,
    vendedorName: row.vendedorName
  };
}

export { initializeDb, parseOrder };
