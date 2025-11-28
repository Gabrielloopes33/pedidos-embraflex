import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import https from "https";

const api = new WooCommerceRestApi({
  url: "https://embraflexbr.com.br",
  consumerKey: "ck_58c97d066289e666ad8a5f91741042f90633d340",
  consumerSecret: "cs_d342dee925de0370f45a892d1bb903f589238a86",
  version: "wc/v3",
  queryStringAuth: true,
  axiosConfig: {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  }
});

async function searchAndInspectProduct(searchTerm: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 Buscando produto: "${searchTerm}"`);
  console.log('='.repeat(80));

  try {
    // Buscar produtos com o termo de pesquisa
    const response = await api.get("products", {
      search: searchTerm,
      per_page: 5,
    });

    const products = response.data;
    
    if (products.length === 0) {
      console.log(`❌ Nenhum produto encontrado com o termo: "${searchTerm}"`);
      return;
    }

    console.log(`\n✅ Encontrados ${products.length} produto(s):\n`);

    for (const product of products) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📦 Produto: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   SKU: ${product.sku || 'N/A'}`);
      console.log(`   Tipo: ${product.type}`);
      console.log(`   Preço: R$ ${product.price}`);
      console.log(`${'─'.repeat(80)}`);

      // Exibir TODOS os atributos
      if (product.attributes && product.attributes.length > 0) {
        console.log(`\n📋 ATRIBUTOS (${product.attributes.length}):\n`);
        
        product.attributes.forEach((attr: any, index: number) => {
          console.log(`   ${index + 1}. "${attr.name}" (slug: ${attr.slug || 'N/A'})`);
          console.log(`      - ID: ${attr.id || 'N/A'}`);
          console.log(`      - Visível: ${attr.visible ? 'Sim' : 'Não'}`);
          console.log(`      - Usado em variação: ${attr.variation ? 'Sim' : 'Não'}`);
          console.log(`      - Posição: ${attr.position}`);
          
          if (attr.options && attr.options.length > 0) {
            console.log(`      - Opções (${attr.options.length}):`);
            attr.options.forEach((option: string, optIndex: number) => {
              console.log(`         ${optIndex + 1}. "${option}"`);
            });
          } else {
            console.log(`      - Opções: Nenhuma`);
          }
          console.log('');
        });
      } else {
        console.log(`\n⚠️  Este produto não possui atributos definidos\n`);
      }

      // Exibir meta_data relevante
      if (product.meta_data && product.meta_data.length > 0) {
        console.log(`\n🔧 META DATA (${product.meta_data.length} itens):\n`);
        
        // Filtrar meta_data relevante (não interna do WP)
        const relevantMeta = product.meta_data.filter((meta: any) => 
          !meta.key.startsWith('_') && meta.value !== ''
        );

        if (relevantMeta.length > 0) {
          relevantMeta.forEach((meta: any, index: number) => {
            console.log(`   ${index + 1}. ${meta.key}:`);
            if (typeof meta.value === 'object') {
              console.log(`      ${JSON.stringify(meta.value, null, 8)}`);
            } else {
              console.log(`      "${meta.value}"`);
            }
          });
        } else {
          console.log(`   (Nenhum meta_data público relevante)`);
        }
      }

      // Se for produto variável, buscar variações
      if (product.type === 'variable') {
        console.log(`\n🔄 Produto VARIÁVEL - Buscando variações...\n`);
        try {
          const variationsResponse = await api.get(`products/${product.id}/variations`, {
            per_page: 100,
          });
          
          const variations = variationsResponse.data;
          console.log(`   ✅ ${variations.length} variação(ões) encontrada(s)\n`);
          
          variations.slice(0, 3).forEach((variation: any, index: number) => {
            console.log(`   Variação ${index + 1}:`);
            console.log(`      - ID: ${variation.id}`);
            console.log(`      - SKU: ${variation.sku || 'N/A'}`);
            console.log(`      - Preço: R$ ${variation.price}`);
            console.log(`      - Em estoque: ${variation.stock_status}`);
            
            if (variation.attributes && variation.attributes.length > 0) {
              console.log(`      - Atributos da variação:`);
              variation.attributes.forEach((attr: any) => {
                console.log(`         • ${attr.name}: "${attr.option}"`);
              });
            }
            console.log('');
          });

          if (variations.length > 3) {
            console.log(`   ... e mais ${variations.length - 3} variação(ões)\n`);
          }
        } catch (error) {
          console.error(`   ❌ Erro ao buscar variações:`, error);
        }
      }

      // Exibir dimensões
      if (product.dimensions) {
        console.log(`\n📏 DIMENSÕES:`);
        console.log(`   - Largura: ${product.dimensions.width || 'N/A'}`);
        console.log(`   - Altura: ${product.dimensions.height || 'N/A'}`);
        console.log(`   - Comprimento: ${product.dimensions.length || 'N/A'}`);
      }

      console.log(`\n`);
    }

  } catch (error: any) {
    console.error(`\n❌ Erro ao buscar produto:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Dados:`, error.response.data);
    }
  }
}

async function main() {
  console.log('\n🚀 Iniciando busca de produtos...\n');

  // Buscar os dois produtos solicitados
  await searchAndInspectProduct('k-034 Extra Alvura');
  await searchAndInspectProduct('k-034 duplex klabim');

  console.log('\n✅ Busca concluída!\n');
}

main();
