import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

async function diagnoseKong() {
  console.log('🔍 Diagnosticando problema com Kong/PostgREST\n');

  // Testar diferentes URLs e métodos
  const tests = [
    { method: 'GET', url: '/rest/v1/orders', desc: 'GET orders' },
    { method: 'POST', url: '/rest/v1/orders', desc: 'POST orders' },
    { method: 'GET', url: '/rest/v1/users', desc: 'GET users' },
    { method: 'POST', url: '/rest/v1/users', desc: 'POST users' },
    { method: 'GET', url: '/rest/v1/', desc: 'GET root' },
  ];

  for (const test of tests) {
    try {
      const config: any = {
        method: test.method,
        url: `${supabaseUrl}${test.url}`,
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        }
      };

      if (test.method === 'POST') {
        config.data = {
          id: `test-${Date.now()}`,
          customerName: 'Test',
          products: '[]',
          status: 'Pendente',
          priority: 'Normal',
          createdAt: new Date().toISOString(),
          history: '[]',
          comments: '[]',
          userId: null
        };
      }

      const response = await axios(config);
      console.log(`✅ ${test.desc}: ${response.status}`);
    } catch (error: any) {
      const status = error.response?.status;
      const via = error.response?.headers?.via;
      const kong = error.response?.headers?.['x-kong-proxy-latency'];
      console.log(`❌ ${test.desc}: ${status} (Kong: ${kong ? 'yes' : 'no'}, Via: ${via || 'none'})`);
    }
  }

  // Testar com diferentes Content-Types
  console.log('\n📝 Testando diferentes Content-Types:\n');
  
  const contentTypes = [
    'application/json',
    'application/vnd.pgrst.object+json',
    'application/vnd.pgrst.object',
  ];

  for (const ct of contentTypes) {
    try {
      const response = await axios.post(
        `${supabaseUrl}/rest/v1/orders`,
        {
          id: `test-ct-${Date.now()}`,
          customerName: 'Test CT',
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
            'Content-Type': ct
          }
        }
      );
      console.log(`✅ Content-Type ${ct}: ${response.status}`);
    } catch (error: any) {
      console.log(`❌ Content-Type ${ct}: ${error.response?.status}`);
    }
  }

  process.exit(0);
}

diagnoseKong();
