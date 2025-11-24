import { supabase } from './src/database';

async function describeTable() {
  console.log('🔍 Analisando estrutura da tabela orders...\n');

  // Tentar obter metadados da tabela
  console.log('1️⃣ Buscando registros existentes...');
  const { data: existingData, error: selectError } = await supabase
    .from('orders')
    .select('*')
    .limit(5);

  if (selectError) {
    console.log('   ❌ Erro ao ler:', selectError);
  } else {
    console.log('   ✅ Registros encontrados:', existingData?.length || 0);
    if (existingData && existingData.length > 0) {
      console.log('   📋 Colunas no primeiro registro:', Object.keys(existingData[0]));
      console.log('   📄 Exemplo de dados:', JSON.stringify(existingData[0], null, 2));
    }
  }

  // Testar UPDATE em vez de INSERT
  if (existingData && existingData.length > 0) {
    console.log('\n2️⃣ Testando UPDATE em registro existente...');
    const firstId = existingData[0].id;
    const updateResult = await supabase
      .from('orders')
      .update({ notes: 'Teste de update' })
      .eq('id', firstId)
      .select();

    console.log('   Status:', updateResult.status);
    console.log('   Erro:', updateResult.error);
    console.log('   Sucesso:', !updateResult.error);

    // Reverter
    if (!updateResult.error) {
      await supabase
        .from('orders')
        .update({ notes: existingData[0].notes })
        .eq('id', firstId);
    }
  }

  // Testar DELETE
  console.log('\n3️⃣ Testando operação DELETE...');
  const deleteResult = await supabase
    .from('orders')
    .delete()
    .eq('id', 'registro-que-nao-existe');

  console.log('   Status:', deleteResult.status);
  console.log('   Erro:', deleteResult.error);

  // Verificar se há trigger ou algo que impede INSERT
  console.log('\n4️⃣ Informações da URL e Endpoint...');
  console.log('   Base URL:', process.env.SUPABASE_URL);
  console.log('   Endpoint completo:', `${process.env.SUPABASE_URL}/rest/v1/orders`);

  process.exit(0);
}

describeTable();
