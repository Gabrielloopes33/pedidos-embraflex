import { supabase } from './src/database';

async function testInsertDirect() {
  console.log('🧪 Teste direto de inserção...\n');

  // Primeiro, testar uma leitura
  console.log('1️⃣ Testando SELECT...');
  const selectResult = await supabase
    .from('orders')
    .select('*')
    .limit(1);
  
  console.log('   Status:', selectResult.status);
  console.log('   Erro:', selectResult.error);
  console.log('   Count:', selectResult.count);
  console.log('   Sucesso:', !selectResult.error);

  // Tentar inserção SEM .select()
  console.log('\n2️⃣ Testando INSERT sem .select()...');
  const testId1 = `test-${Date.now()}-a`;
  const insertResult1 = await supabase
    .from('orders')
    .insert([{
      id: testId1,
      customerName: 'Teste 1',
      products: '[]',
      status: 'Pendente',
      priority: 'Normal',
      createdAt: new Date().toISOString(),
      history: '[]',
      comments: '[]',
      userId: null
    }]);

  console.log('   Status:', insertResult1.status);
  console.log('   StatusText:', insertResult1.statusText);
  console.log('   Erro:', insertResult1.error);
  console.log('   Data:', insertResult1.data);

  // Tentar inserção COM .select()
  console.log('\n3️⃣ Testando INSERT com .select()...');
  const testId2 = `test-${Date.now()}-b`;
  const insertResult2 = await supabase
    .from('orders')
    .insert([{
      id: testId2,
      customerName: 'Teste 2',
      products: '[]',
      status: 'Pendente',
      priority: 'Normal',
      createdAt: new Date().toISOString(),
      history: '[]',
      comments: '[]',
      userId: null
    }])
    .select();

  console.log('   Status:', insertResult2.status);
  console.log('   StatusText:', insertResult2.statusText);
  console.log('   Erro:', insertResult2.error);
  console.log('   Data:', insertResult2.data);

  // Verificar se foram inseridos
  console.log('\n4️⃣ Verificando se os registros existem...');
  const checkResult = await supabase
    .from('orders')
    .select('id, customerName')
    .in('id', [testId1, testId2]);

  console.log('   Encontrados:', checkResult.data?.length || 0);
  console.log('   IDs:', checkResult.data?.map(r => r.id));

  // Limpar
  if (checkResult.data && checkResult.data.length > 0) {
    console.log('\n🧹 Removendo testes...');
    await supabase
      .from('orders')
      .delete()
      .in('id', [testId1, testId2]);
    console.log('   ✅ Removidos');
  }

  process.exit(0);
}

testInsertDirect();
