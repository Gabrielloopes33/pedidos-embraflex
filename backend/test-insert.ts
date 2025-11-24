import { supabase } from './src/database';
import crypto from 'crypto';

async function testInsert() {
  console.log('🧪 Testando inserção no Supabase...');
  
  const testOrder = {
    id: crypto.randomUUID(),
    customerName: 'Teste Cliente',
    products: JSON.stringify([{
      id: crypto.randomUUID(),
      productId: 123,
      productName: 'Produto Teste',
      quantity: 10,
      codigo: 'TEST001',
      material: '',
      discriminacaoProduto: 'Teste',
      largura: '10',
      altura: '15',
      lateral: '',
      cores: '4x0',
      laminadoBrilho: false,
      laminadoFosco: false,
      vernizIE: false,
      autoMatizada: false,
      furosPresente: '',
      refile: '',
      cordaoBranco: false,
      cordaoPreto: false,
      cordaoBege: false,
      cordao: '',
      gorgurinho35cm: false,
      gorgurao35cm: false,
      sFrancisco35cm: false,
      ilhos: false,
      hotStampSacola: false,
      hotStampEtiqueta: false,
      outros: '',
      observacoes: '',
      unitPrice: 100
    }]),
    status: 'Pendente',
    priority: 'Normal',
    notes: 'Teste',
    createdAt: new Date().toISOString(),
    history: JSON.stringify([{
      event: 'Ordem criada',
      timestamp: new Date().toISOString(),
      user: 'Teste'
    }]),
    comments: JSON.stringify([]),
    userId: null
  };

  console.log('📦 Dados a inserir:', testOrder);

  try {
    // Primeiro, testar leitura
    console.log('\n📖 Testando leitura...');
    const { data: readData, error: readError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    console.log('Resultado da leitura:', { hasData: !!readData, count: readData?.length, error: readError });

    // Agora testar inserção
    console.log('\n✍️  Testando inserção...');
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder]);

    if (error) {
      console.error('❌ Erro ao inserir:', error);
      console.error('❌ Código:', error.code);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Detalhes:', error.details);
      console.error('❌ Hint:', error.hint);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📄 Dados inseridos:', data);
    }

    // Verificar se foi inserido
    const { data: checkData, error: checkError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', testOrder.id);

    console.log('\n🔍 Verificação pós-inserção:', { found: !!checkData && checkData.length > 0, error: checkError });

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }

  process.exit(0);
}

testInsert();
