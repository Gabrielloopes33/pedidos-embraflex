/**
 * Script para verificar variações de um produto específico no WooCommerce
 * 
 * Uso: npx ts-node scripts/check-product-variations.ts [productId]
 * Exemplo: npx ts-node scripts/check-product-variations.ts 8552
 */

import wooCommerceApi from '../src/woocommerce';

async function checkProductVariations(productId: number) {
  console.log('═'.repeat(80));
  console.log(`  VERIFICANDO PRODUTO ID: ${productId}`);
  console.log('═'.repeat(80));
  console.log();

  try {
    // Buscar produto principal
    console.log('🔍 Buscando produto principal...');
    const { data: product } = await wooCommerceApi.get(`products/${productId}`);
    
    console.log('📦 Produto encontrado:');
    console.log(`   ID: ${product.id}`);
    console.log(`   Nome: ${product.name}`);
    console.log(`   Tipo: ${product.type}`);
    console.log(`   SKU: ${product.sku || '[VAZIO]'}`);
    console.log(`   Status: ${product.status}`);
    console.log();

    // Se for produto variável, buscar variações
    if (product.type === 'variable') {
      console.log('🔍 Produto é do tipo VARIABLE - buscando variações...');
      console.log();

      try {
        const { data: variations } = await wooCommerceApi.get(`products/${productId}/variations`, {
          params: { per_page: 100 }
        });

        console.log(`✅ Variações encontradas: ${variations.length}`);
        console.log();

        if (variations.length === 0) {
          console.log('⚠️ ATENÇÃO: Produto é do tipo VARIABLE mas não tem variações cadastradas!');
          console.log('   Isso explica por que não aparece nada na tela.');
          console.log();
        } else {
          console.log('📋 Lista de variações:');
          console.log('─'.repeat(80));
          console.log('ID'.padEnd(8), 'SKU'.padEnd(15), 'Preço'.padEnd(10), 'Status', 'Atributos');
          console.log('─'.repeat(80));

          for (const v of variations) {
            const attrs = v.attributes?.map((a: any) => `${a.name}=${a.option}`).join(', ') || 'N/A';
            console.log(
              v.id.toString().padEnd(8),
              (v.sku || '[VAZIO]').padEnd(15),
              (v.price || '0').padEnd(10),
              v.status.padEnd(8),
              attrs.substring(0, 40)
            );
          }
          console.log('─'.repeat(80));
        }
      } catch (error: any) {
        console.error('❌ Erro ao buscar variações:', error.response?.data || error.message);
      }
    } else {
      console.log(`ℹ️ Produto é do tipo "${product.type}" - não tem variações.`);
      console.log('   Para sacolas de papel personalizadas, o produto deve ser do tipo VARIABLE.');
    }

    // Mostrar atributos do produto
    console.log();
    console.log('📋 Atributos do produto:');
    if (product.attributes && product.attributes.length > 0) {
      for (const attr of product.attributes) {
        console.log(`   - ${attr.name}: ${attr.options?.join(', ') || 'N/A'}`);
      }
    } else {
      console.log('   Nenhum atributo configurado.');
    }

  } catch (error: any) {
    if (error.response?.status === 404) {
      console.error(`❌ Produto ${productId} não encontrado no WooCommerce.`);
    } else {
      console.error('❌ Erro ao buscar produto:', error.response?.data || error.message);
    }
  }

  console.log();
  console.log('═'.repeat(80));
  process.exit(0);
}

// Pegar ID do produto dos argumentos ou usar 8552 (k-034) como padrão
const productId = process.argv[2] ? parseInt(process.argv[2]) : 8552;
checkProductVariations(productId);
