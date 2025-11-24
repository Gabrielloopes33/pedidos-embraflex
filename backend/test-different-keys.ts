import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

console.log('🔍 Testando diferentes configurações de cliente...\n');
console.log('URL:', supabaseUrl);
console.log('Service Key (primeiros 20 chars):', supabaseServiceKey.substring(0, 20) + '...');
console.log('Anon Key (primeiros 20 chars):', supabaseAnonKey.substring(0, 20) + '...\n');

async function testWithServiceRole() {
  console.log('1️⃣ Testando com SERVICE_ROLE key...');
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const testId = `test-service-${Date.now()}`;
  const result = await client
    .from('orders')
    .insert([{
      id: testId,
      customerName: 'Teste Service Role',
      products: '[]',
      status: 'Pendente',
      priority: 'Normal',
      createdAt: new Date().toISOString(),
      history: '[]',
      comments: '[]',
      userId: null
    }])
    .select();

  console.log('   Status:', result.status);
  console.log('   Erro:', result.error ? JSON.stringify(result.error, null, 2) : 'null');
  console.log('   Sucesso:', !result.error);

  if (result.data) {
    await client.from('orders').delete().eq('id', testId);
  }
}

async function testWithAnon() {
  console.log('\n2️⃣ Testando com ANON key...');
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const testId = `test-anon-${Date.now()}`;
  const result = await client
    .from('orders')
    .insert([{
      id: testId,
      customerName: 'Teste Anon',
      products: '[]',
      status: 'Pendente',
      priority: 'Normal',
      createdAt: new Date().toISOString(),
      history: '[]',
      comments: '[]',
      userId: null
    }])
    .select();

  console.log('   Status:', result.status);
  console.log('   Erro:', result.error ? JSON.stringify(result.error, null, 2) : 'null');
  console.log('   Sucesso:', !result.error);

  if (result.data) {
    await client.from('orders').delete().eq('id', testId);
  }
}

async function testDirectHTTP() {
  console.log('\n3️⃣ Testando com requisição HTTP direta...');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: `test-http-${Date.now()}`,
        customerName: 'Teste HTTP',
        products: '[]',
        status: 'Pendente',
        priority: 'Normal',
        createdAt: new Date().toISOString(),
        history: '[]',
        comments: '[]',
        userId: null
      })
    });

    console.log('   Status:', response.status);
    console.log('   StatusText:', response.statusText);
    const data = await response.text();
    console.log('   Body:', data);
  } catch (error) {
    console.log('   Erro:', error);
  }
}

async function runTests() {
  await testWithServiceRole();
  await testWithAnon();
  await testDirectHTTP();
  process.exit(0);
}

runTests();
