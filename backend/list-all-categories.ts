import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import dotenv from 'dotenv';

dotenv.config();

const wooCommerceApi = new WooCommerceRestApi({
  url: process.env.WOOCOMMERCE_URL || 'https://embraflex.com.br',
  consumerKey: process.env.WOOCOMMERCE_KEY || '',
  consumerSecret: process.env.WOOCOMMERCE_SECRET || '',
  version: 'wc/v3',
  queryStringAuth: true,
});

async function listAllCategories() {
  try {
    console.log('🔍 Buscando todas as categorias...\n');
    
    const { data: categories } = await wooCommerceApi.get('products/categories', {
      per_page: 100
    });
    
    console.log(`📊 Total de categorias: ${categories.length}\n`);
    console.log('='.repeat(80));
    
    categories.forEach((cat: any, index: number) => {
      console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, Produtos: ${cat.count || 0})`);
      if (cat.parent > 0) {
        const parent = categories.find((c: any) => c.id === cat.parent);
        console.log(`   └─ Subcategoria de: ${parent?.name || 'Desconhecido'}`);
      }
    });
    
    console.log('='.repeat(80));
    
    // Filtrar categorias INTERNO
    const internoCategories = categories.filter((cat: any) => {
      const name = cat.name.toLowerCase();
      return name === 'interno' || name === 'interna' || name.includes('intern');
    });
    
    console.log(`\n📁 Categorias INTERNO: ${internoCategories.length}`);
    internoCategories.forEach((cat: any) => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Produtos: ${cat.count || 0})`);
    });
    
    // Filtrar categorias de LINHA
    const linhaCategories = categories.filter((cat: any) => {
      const name = cat.name.toLowerCase();
      return name.includes('linha') || name.includes('premium') || name.includes('econômica') || name.includes('economica');
    });
    
    console.log(`\n🏷️ Categorias de LINHA: ${linhaCategories.length}`);
    linhaCategories.forEach((cat: any) => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Produtos: ${cat.count || 0})`);
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar categorias:', error.message);
    if (error.response) {
      console.error('Resposta:', error.response.data);
    }
  }
}

listAllCategories();
