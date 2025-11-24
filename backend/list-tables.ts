import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
  },
});

async function listTables() {
  console.log('🔍 Verificando tabelas no Supabase...\n');
  console.log('URL:', supabaseUrl);
  console.log('Schema: public\n');

  try {
    // Tentar acessar várias tabelas para ver quais existem
    const tables = ['orders', 'users', 'products', 'customers'];
    
    for (const table of tables) {
      console.log(`📋 Testando tabela: ${table}`);
      const result = await supabase.from(table).select('*').limit(0);
      
      if (result.error) {
        console.log(`  ❌ Erro: ${result.status} - ${result.statusText}`);
        if (result.error.message) {
          console.log(`  📝 Mensagem: ${result.error.message}`);
        }
      } else {
        console.log(`  ✅ Tabela acessível`);
      }
      console.log('');
    }

    // Tentar fazer uma query usando SQL direto
    console.log('\n🔧 Tentando listar tabelas via RPC...');
    const { data, error } = await supabase
      .rpc('pg_catalog.pg_tables');
    
    if (error) {
      console.log('❌ Não foi possível listar tabelas via RPC');
    } else {
      console.log('✅ Tabelas encontradas:', data);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }

  process.exit(0);
}

listTables();
