// Script de diagnóstico para testar autenticação e acesso a clientes
// Execute no console do navegador (F12 > Console)

console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO - EMBRAFLEX\n');

// 1. Verificar token no localStorage
console.log('1. 📦 Verificando localStorage...');
const authToken = localStorage.getItem('authToken');
const authUser = localStorage.getItem('authUser');

if (!authToken) {
  console.error('❌ Token não encontrado no localStorage!');
  console.log('   Faça login novamente.');
} else {
  console.log('✅ Token encontrado:', authToken.substring(0, 20) + '...');
}

if (!authUser) {
  console.warn('⚠️ Usuário não encontrado no localStorage');
} else {
  console.log('✅ Usuário:', JSON.parse(authUser));
}

// 2. Verificar se o token é válido (decodificar JWT)
if (authToken) {
  try {
    console.log('\n2. 🔓 Decodificando token JWT...');
    const tokenParts = authToken.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('   Payload:', payload);
      
      // Verificar expiração
      if (payload.exp) {
        const expirationDate = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = now > expirationDate;
        
        console.log('   Expira em:', expirationDate.toLocaleString());
        console.log('   Agora:', now.toLocaleString());
        
        if (isExpired) {
          console.error('❌ Token EXPIRADO! Faça login novamente.');
        } else {
          const minutesLeft = Math.floor((expirationDate - now) / 60000);
          console.log(`✅ Token válido por mais ${minutesLeft} minutos`);
        }
      }
    }
  } catch (e) {
    console.error('❌ Erro ao decodificar token:', e);
  }
}

// 3. Testar requisição para produtos (SEM autenticação necessária)
console.log('\n3. 🛍️ Testando acesso a produtos...');
const apiUrl = localStorage.getItem('VITE_API_BASE_URL') || 'http://localhost:3001/api';
console.log('   API URL:', apiUrl);

fetch(`${apiUrl}/wc/products?per_page=5`)
  .then(res => {
    console.log('   Status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('✅ Produtos carregados:', data.length);
    console.log('   Exemplo:', data[0]?.name);
  })
  .catch(err => {
    console.error('❌ Erro ao carregar produtos:', err);
  });

// 4. Testar requisição para clientes (COM autenticação necessária)
console.log('\n4. 👥 Testando acesso a clientes...');

if (!authToken) {
  console.error('❌ Não é possível testar clientes sem token. Faça login primeiro.');
} else {
  fetch(`${apiUrl}/wc/customers?per_page=5`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      console.log('   Status:', res.status);
      if (res.status === 401) {
        console.error('❌ Token REJEITADO (401 Unauthorized)');
        console.log('   Possível causa: token inválido ou expirado');
      } else if (res.status === 403) {
        console.error('❌ Acesso NEGADO (403 Forbidden)');
        console.log('   Possível causa: token válido mas sem permissões');
      }
      return res.json();
    })
    .then(data => {
      if (Array.isArray(data)) {
        console.log('✅ Clientes carregados:', data.length);
        if (data.length > 0) {
          console.log('   Exemplo:', data[0]?.first_name, data[0]?.last_name);
        }
      } else {
        console.error('❌ Resposta não é um array:', data);
      }
    })
    .catch(err => {
      console.error('❌ Erro ao carregar clientes:', err);
    });
}

console.log('\n📋 RESUMO:');
console.log('- Se produtos carregam mas clientes não, o problema é autenticação');
console.log('- Verifique se o token está válido e não expirado');
console.log('- Caso necessário, faça logout e login novamente');
console.log('\n💡 Para mais informações, verifique a aba Network (Rede) nas DevTools');
