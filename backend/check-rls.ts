import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function checkAndFixRLS() {
  console.log('🔍 Verificando configuração de RLS...\n');

  try {
    // Tentar acessar a tabela
    console.log('\n🔧 Testando acesso à tabela orders...');
    
    const { data: disableData, error: disableError } = await supabase
      .from('orders')
      .select('*')
      .limit(0);

    console.log('Teste de acesso:', { error: disableError });

    if (disableError) {
      console.log('\n❌ Erro de RLS detectado!');
      console.log('❌ Código:', disableError.code);
      console.log('❌ Mensagem:', disableError.message);
      console.log('\n📋 Execute este SQL no Supabase Studio:');
      console.log('-------------------------------------------');
      console.log('ALTER TABLE orders DISABLE ROW LEVEL SECURITY;');
      console.log('ALTER TABLE users DISABLE ROW LEVEL SECURITY;');
      console.log('-------------------------------------------');
    } else {
      console.log('\n✅ RLS parece estar configurado corretamente');
      
      // Tentar um insert de teste
      console.log('\n🧪 Testando inserção...');
      const testId = Date.now().toString();
      const testData = {
        id: testId,
        customerName: 'Teste RLS',
        products: '[]',
        status: 'Pendente',
        priority: 'Normal',
        createdAt: new Date().toISOString(),
        history: '[]',
        comments: '[]',
        userId: null
      };
      
      console.log('📦 Dados do teste:', testData);
      
      const insertResult = await supabase
        .from('orders')
        .insert([testData])
        .select();

      console.log('📤 Resultado completo:', insertResult);
      console.log('📤 Data:', insertResult.data);
      console.log('📤 Error:', insertResult.error);
      console.log('📤 Status:', insertResult.status);
      console.log('📤 StatusText:', insertResult.statusText);

      if (insertResult.error) {
        const err = insertResult.error;
        console.log('❌ Erro ao inserir:');
        console.log('  - Error object:', err);
        console.log('  - Code:', err.code);
        console.log('  - Message:', err.message);
        console.log('  - Details:', err.details);
        console.log('  - Hint:', err.hint);
        console.log('  - JSON:', JSON.stringify(err, null, 2));
        console.log('\n📋 Possível problema de RLS! Execute:');
        console.log('-------------------------------------------');
        console.log('ALTER TABLE orders DISABLE ROW LEVEL SECURITY;');
        console.log('-------------------------------------------');
      } else {
        console.log('✅ Inserção bem-sucedida!');
        console.log('📄 Data retornada:', insertResult.data);
        
        // Limpar teste
        await supabase.from('orders').delete().eq('id', testId);
        console.log('🧹 Teste removido');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }

  process.exit(0);
}

checkAndFixRLS();
