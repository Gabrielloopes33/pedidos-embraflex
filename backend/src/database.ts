import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProductionOrder } from './types';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY) devem estar configurados no .env');
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

    const errorMessage = String(error?.message || '').toLowerCase();
    const isMissingUsersTable = Boolean(error) && (
      error?.code === 'PGRST205' ||
      error?.code === '42P01' ||
      errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
      errorMessage.includes('table') && errorMessage.includes('not found')
    );

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

    if (isMissingUsersTable) {
      console.log('📊 Criando tabelas no Supabase...');
      
      // Executar SQL via RPC ou diretamente no Supabase Studio
      // Como não temos RPC configurado, vamos apenas logar
      console.log('⚠️  Execute este SQL no Supabase Studio (SQL Editor):');
      console.log(createTablesSQL);
      console.log('\n✅ Após executar o SQL, as tabelas estarão prontas!');
    } else if (error) {
      console.warn('⚠️  Erro ao validar conexão com Supabase/tabela users:', error);
      console.log('📊 Execute este SQL no Supabase Studio (SQL Editor) para criar as tabelas necessárias:');
      console.log(createTablesSQL);
      console.log('\n⚠️  O backend continuará iniciando, mas algumas funcionalidades podem não funcionar até que as tabelas sejam criadas.');
    } else {
      console.log('✅ Conectado ao Supabase com sucesso!');
      console.log('✅ Tabelas já existem ou estão prontas para uso');
    }

    return supabase;
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error);
    console.log('⚠️  Continuando inicialização do backend apesar do erro de banco...');
    return supabase;
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
