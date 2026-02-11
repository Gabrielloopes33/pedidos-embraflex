import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('📋 Configuração:');
console.log('   URL:', supabaseUrl);
console.log('   Service Key:', supabaseServiceKey ? '✅ Presente' : '❌ Ausente');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente faltando!');
  console.error('   Verifique se SUPABASE_URL e SUPABASE_SERVICE_KEY estão no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnoseUsersTable() {
  console.log('🔍 Diagnosticando tabela users...\n');

  try {
    // 1. Verificar se consegue ler usuários
    console.log('1️⃣ Testando leitura de usuários...');
    const { data: users, error: readError } = await supabase
      .from('users')
      .select('id, username, role')
      .limit(5);

    if (readError) {
      console.error('❌ Erro ao ler usuários:', readError);
    } else {
      console.log('✅ Leitura OK. Usuários encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('   Exemplo:', users[0]);
      }
    }

    // 2. Verificar se consegue atualizar
    console.log('\n2️⃣ Testando atualização de usuário...');
    if (users && users.length > 0) {
      const testUserId = users[0].id;
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testUserId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError);
        console.error('   Código:', updateError.code);
        console.error('   Detalhes:', updateError.details);
        console.error('   Hint:', updateError.hint);
      } else {
        console.log('✅ Atualização OK');
      }
    }

    // 3. Verificar RLS status via query direta
    console.log('\n3️⃣ Verificando status de RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_table_rls', { table_name: 'users' })
      .single();

    if (rlsError) {
      console.log('⚠️  Função check_table_rls não existe (não é um problema)');
    } else {
      console.log('   RLS Status:', rlsStatus);
    }

    // 4. Tentar inserir um usuário de teste
    console.log('\n4️⃣ Testando inserção de usuário...');
    const testUser = {
      id: `test_${Date.now()}`,
      username: `test_${Date.now()}`,
      password: 'test_hash',
      role: 'vendedor',
      created_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir usuário:', insertError);
      console.error('   Código:', insertError.code);
      console.error('   Detalhes:', insertError.details);
      console.error('   Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção OK, deletando usuário de teste...');
      await supabase.from('users').delete().eq('id', testUser.id);
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETO');
    console.log('─'.repeat(60));
    console.log('Se você viu erro com código 42883, execute o SQL:');
    console.log('backend/fix-users-permissions.sql');
    console.log('no Supabase Studio > SQL Editor');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

diagnoseUsersTable();
