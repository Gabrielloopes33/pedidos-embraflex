import wooCommerceApi from './src/woocommerce';

async function testCreateCustomer() {
  console.log('🧪 Testando criação de cliente no WooCommerce...\n');

  const customerData = {
    email: `teste${Date.now()}@exemplo.com`,
    first_name: "Cliente Teste",
    last_name: "Embraflex",
    username: `teste_${Date.now()}`,
    password: "SenhaSegura123!",
    billing: {
      first_name: "Cliente Teste",
      last_name: "Embraflex",
      company: "Empresa Teste LTDA",
      email: `teste${Date.now()}@exemplo.com`,
      phone: "(11) 99999-9999",
      address_1: "Rua Teste, 123",
      city: "São Paulo",
      state: "SP",
      postcode: "01234-567",
      country: "BR",
    },
    meta_data: [
      { key: "_billing_cpf_cnpj", value: "12.345.678/0001-90" },
      { key: "_nome_fantasia", value: "Cliente Teste" },
      { key: "_razao_social", value: "Empresa Teste LTDA" },
    ],
  };

  console.log('📝 Dados a serem enviados:');
  console.log(JSON.stringify(customerData, null, 2));
  console.log('\n');

  try {
    const response = await wooCommerceApi.post('customers', customerData);
    console.log('✅ Cliente criado com sucesso!');
    console.log('ID:', response.data.id);
    console.log('Email:', response.data.email);
    console.log('Nome:', response.data.first_name, response.data.last_name);
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente:');
    console.error('Status:', error.response?.status);
    console.error('Mensagem:', error.response?.data?.message);
    console.error('Código:', error.response?.data?.code);
    console.error('Dados completos:', JSON.stringify(error.response?.data, null, 2));
  }
}

testCreateCustomer();
