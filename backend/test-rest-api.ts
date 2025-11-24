import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

async function testRestAPI() {
  console.log('🔍 Testando endpoint REST do Supabase...\n');
  console.log('URL Base:', supabaseUrl);
  console.log('Service Key:', supabaseServiceKey.substring(0, 30) + '...\n');

  // Teste 1: GET (sabemos que funciona)
  console.log('1️⃣ Testando GET /rest/v1/orders');
  try {
    const getResponse = await axios.get(`${supabaseUrl}/rest/v1/orders`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    console.log('   ✅ Status:', getResponse.status);
    console.log('   📊 Registros:', getResponse.data.length);
  } catch (error: any) {
    console.log('   ❌ Erro:', error.response?.status, error.response?.statusText);
  }

  // Teste 2: POST sem Prefer header
  console.log('\n2️⃣ Testando POST sem Prefer header');
  try {
    const postResponse1 = await axios.post(
      `${supabaseUrl}/rest/v1/orders`,
      {
        id: `test-api-${Date.now()}-a`,
        customerName: 'Teste API 1',
        products: '[]',
        status: 'Pendente',
        priority: 'Normal',
        createdAt: new Date().toISOString(),
        history: '[]',
        comments: '[]',
        userId: null
      },
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('   ✅ Status:', postResponse1.status);
    console.log('   📄 Data:', postResponse1.data);
  } catch (error: any) {
    console.log('   ❌ Status:', error.response?.status);
    console.log('   ❌ StatusText:', error.response?.statusText);
    console.log('   ❌ Data:', error.response?.data);
    console.log('   ❌ Headers:', error.response?.headers);
  }

  // Teste 3: POST com Prefer: return=minimal
  console.log('\n3️⃣ Testando POST com Prefer: return=minimal');
  try {
    const postResponse2 = await axios.post(
      `${supabaseUrl}/rest/v1/orders`,
      {
        id: `test-api-${Date.now()}-b`,
        customerName: 'Teste API 2',
        products: '[]',
        status: 'Pendente',
        priority: 'Normal',
        createdAt: new Date().toISOString(),
        history: '[]',
        comments: '[]',
        userId: null
      },
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      }
    );
    console.log('   ✅ Status:', postResponse2.status);
    console.log('   📄 Data:', postResponse2.data);
  } catch (error: any) {
    console.log('   ❌ Status:', error.response?.status);
    console.log('   ❌ StatusText:', error.response?.statusText);
    console.log('   ❌ Data:', error.response?.data);
  }

  // Teste 4: POST com Prefer: return=representation
  console.log('\n4️⃣ Testando POST com Prefer: return=representation');
  try {
    const postResponse3 = await axios.post(
      `${supabaseUrl}/rest/v1/orders`,
      {
        id: `test-api-${Date.now()}-c`,
        customerName: 'Teste API 3',
        products: '[]',
        status: 'Pendente',
        priority: 'Normal',
        createdAt: new Date().toISOString(),
        history: '[]',
        comments: '[]',
        userId: null
      },
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    console.log('   ✅ Status:', postResponse3.status);
    console.log('   📄 Data:', postResponse3.data);
  } catch (error: any) {
    console.log('   ❌ Status:', error.response?.status);
    console.log('   ❌ StatusText:', error.response?.statusText);
    console.log('   ❌ Data:', error.response?.data);
    console.log('   ❌ Headers da resposta:', error.response?.headers);
  }

  // Teste 5: Verificar configuração da API
  console.log('\n5️⃣ Testando endpoint de configuração');
  try {
    const configResponse = await axios.get(`${supabaseUrl}/rest/`, {
      headers: {
        'apikey': supabaseServiceKey
      }
    });
    console.log('   ✅ Status:', configResponse.status);
    console.log('   📄 Info:', configResponse.data);
  } catch (error: any) {
    console.log('   ❌ Status:', error.response?.status);
  }

  process.exit(0);
}

testRestAPI();
