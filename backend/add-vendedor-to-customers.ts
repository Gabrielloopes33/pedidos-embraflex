/**
 * Script para adicionar meta_data 'vendedor_name' em clientes existentes do WooCommerce
 * 
 * USO:
 * 1. Certifique-se de que o backend está rodando
 * 2. Execute: npm run add-vendedor-to-customers
 * 
 * Este script irá:
 * - Buscar todos os clientes do WooCommerce
 * - Perguntar qual vendedor associar
 * - Adicionar o meta_data 'vendedor_name' em cada cliente
 */

import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import * as readline from 'readline';

const wooCommerceApi = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL || 'https://embraflex.com.br',
  consumerKey: process.env.WOOCOMMERCE_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_SECRET || '',
  version: 'wc/v3',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    console.log('🔍 Buscando clientes do WooCommerce...\n');
    
    // Buscar todos os clientes
    const { data: customers } = await wooCommerceApi.get('customers', {
      per_page: 100
    });
    
    console.log(`📊 Total de clientes encontrados: ${customers.length}\n`);
    
    // Listar clientes sem vendedor
    const customersWithoutVendedor = customers.filter((customer: any) => {
      const vendedorMeta = customer.meta_data?.find((meta: any) => meta.key === 'vendedor_name');
      return !vendedorMeta;
    });
    
    console.log(`⚠️  Clientes SEM vendedor definido: ${customersWithoutVendedor.length}`);
    
    if (customersWithoutVendedor.length === 0) {
      console.log('✅ Todos os clientes já têm vendedor definido!');
      rl.close();
      return;
    }
    
    console.log('\n📋 Clientes sem vendedor:');
    customersWithoutVendedor.forEach((customer: any, index: number) => {
      console.log(`  ${index + 1}. ${customer.first_name} ${customer.last_name} (ID: ${customer.id}) - ${customer.email}`);
    });
    
    console.log('\n📝 Vendedores disponíveis no sistema:');
    console.log('  1. yan');
    console.log('  2. admin');
    console.log('  3. Outro (digitar manualmente)');
    
    const opcao = await question('\nEscolha o vendedor (1-3): ');
    
    let vendedorName = '';
    
    if (opcao === '1') {
      vendedorName = 'yan';
    } else if (opcao === '2') {
      vendedorName = 'admin';
    } else if (opcao === '3') {
      vendedorName = await question('Digite o nome do vendedor: ');
    } else {
      console.log('❌ Opção inválida!');
      rl.close();
      return;
    }
    
    console.log(`\n🔧 Adicionando vendedor "${vendedorName}" aos ${customersWithoutVendedor.length} clientes...\n`);
    
    let success = 0;
    let errors = 0;
    
    for (const customer of customersWithoutVendedor) {
      try {
        // Filtrar meta_data existente
        const existingMetaData = (customer.meta_data || []).filter((meta: any) => 
          meta.key !== 'vendedor_name' && meta.key !== 'vendedor_id'
        );
        
        // Atualizar cliente com novo meta_data
        await wooCommerceApi.put(`customers/${customer.id}`, {
          meta_data: [
            ...existingMetaData,
            {
              key: 'vendedor_name',
              value: vendedorName
            }
          ]
        });
        
        console.log(`  ✅ ${customer.first_name} ${customer.last_name} (ID: ${customer.id})`);
        success++;
      } catch (error: any) {
        console.error(`  ❌ Erro ao atualizar ${customer.first_name} ${customer.last_name}:`, error.response?.data?.message || error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`  ✅ Sucesso: ${success}`);
    console.log(`  ❌ Erros: ${errors}`);
    console.log(`\n✨ Processo concluído!`);
    
  } catch (error: any) {
    console.error('❌ Erro ao executar script:', error.message);
  } finally {
    rl.close();
  }
}

main();
