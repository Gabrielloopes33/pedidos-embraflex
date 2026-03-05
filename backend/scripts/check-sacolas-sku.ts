/**
 * Script para verificar SKUs dos produtos na categoria Sacolas de Papel / Linha Comercial
 * 
 * Uso: npx ts-node scripts/check-sacolas-sku.ts
 */

import { supabase } from '../src/supabase-client';
import wooCommerceApi from '../src/woocommerce';

async function checkCacheSacolas() {
  console.log('🔍 Verificando produtos no cache do Supabase...\n');
  
  // Buscar todos os produtos do cache
  const { data: products, error } = await supabase
    .from('wc_products_cache')
    .select('id, name, sku, categories')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('❌ Erro ao buscar produtos do cache:', error);
    return;
  }

  console.log(`📦 Total de produtos no cache: ${products?.length || 0}\n`);

  // Filtrar produtos relacionados a "Sacolas"
  const sacolasProducts = products?.filter(p => 
    p.name.toLowerCase().includes('sacola') ||
    p.categories?.some((c: any) => c.name?.toLowerCase().includes('sacola'))
  ) || [];

  console.log(`🛍️ Produtos relacionados a "Sacolas": ${sacolasProducts.length}\n`);
  console.log('─'.repeat(100));
  console.log('ID'.padEnd(8), 'SKU'.padEnd(15), 'Nome');
  console.log('─'.repeat(100));

  for (const product of sacolasProducts) {
    const skuDisplay = product.sku || '[VAZIO]';
    const skuStatus = !product.sku || product.sku.trim() === '' ? '⚠️' : '✅';
    console.log(
      product.id.toString().padEnd(8),
      skuDisplay.padEnd(15),
      `${skuStatus} ${product.name}`
    );
  }
  console.log('─'.repeat(100));

  // Contar produtos sem SKU
  const semSku = sacolasProducts.filter(p => !p.sku || p.sku.trim() === '');
  console.log(`\n📊 Resumo Sacolas:`);
  console.log(`   Total: ${sacolasProducts.length}`);
  console.log(`   Com SKU: ${sacolasProducts.length - semSku.length}`);
  console.log(`   Sem SKU: ${semSku.length}`);

  return sacolasProducts;
}

async function checkWooCommerceSacolas() {
  console.log('\n\n🌐 Verificando produtos diretamente no WooCommerce...\n');
  
  try {
    // Buscar categorias para encontrar "Sacolas de Papel" ou similar
    const { data: categories } = await wooCommerceApi.get('products/categories', {
      per_page: 100
    });

    console.log(`📁 Total de categorias: ${categories.length}`);
    
    // Encontrar categorias relacionadas a "Sacolas" ou "Comercial"
    const sacolaCategories = categories.filter((c: any) => 
      c.name.toLowerCase().includes('sacola') ||
      c.name.toLowerCase().includes('comercial')
    );

    console.log(`\n📂 Categorias encontradas:`);
    for (const cat of sacolaCategories) {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Slug: ${cat.slug})`);
    }

    // Buscar produtos de cada categoria
    for (const category of sacolaCategories) {
      console.log(`\n\n🔍 Buscando produtos da categoria: ${category.name} (ID: ${category.id})`);
      console.log('═'.repeat(100));
      
      const { data: products } = await wooCommerceApi.get('products', {
        category: category.id.toString(),
        per_page: 100
      });

      console.log(`📦 Produtos encontrados: ${products.length}\n`);
      console.log('ID'.padEnd(8), 'SKU'.padEnd(15), 'Tipo'.padEnd(10), 'Nome');
      console.log('─'.repeat(100));

      for (const product of products) {
        const skuDisplay = product.sku || '[VAZIO]';
        const skuStatus = !product.sku || product.sku.trim() === '' ? '⚠️' : '✅';
        console.log(
          product.id.toString().padEnd(8),
          skuDisplay.padEnd(15),
          product.type.padEnd(10),
          `${skuStatus} ${product.name}`
        );
      }
      console.log('─'.repeat(100));

      // Resumo
      const semSku = products.filter((p: any) => !p.sku || p.sku.trim() === '');
      console.log(`\n📊 Resumo ${category.name}:`);
      console.log(`   Total: ${products.length}`);
      console.log(`   Com SKU: ${products.length - semSku.length}`);
      console.log(`   Sem SKU: ${semSku.length}`);
      
      if (semSku.length > 0) {
        console.log(`\n   ⚠️ Produtos sem SKU:`);
        for (const p of semSku) {
          console.log(`      - ID ${p.id}: ${p.name}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro ao buscar do WooCommerce:', error);
  }
}

async function checkSpecificProducts() {
  console.log('\n\n🔍 Verificando produtos específicos mencionados (k-034)...\n');
  
  const productIds = [34]; // k-034 provavelmente tem ID 34
  
  for (const id of productIds) {
    try {
      // Verificar no cache
      const { data: cached } = await supabase
        .from('wc_products_cache')
        .select('*')
        .eq('id', id)
        .single();

      if (cached) {
        console.log(`\n📦 Produto ID ${id} no cache:`);
        console.log(`   Nome: ${cached.name}`);
        console.log(`   SKU: ${cached.sku || '[VAZIO]'}`);
        console.log(`   SKU (raw): "${cached.sku}"`);
        console.log(`   Categorias: ${cached.categories?.map((c: any) => c.name).join(', ')}`);
      }

      // Verificar no WooCommerce
      const { data: wcProduct } = await wooCommerceApi.get(`products/${id}`);
      
      console.log(`\n🌐 Produto ID ${id} no WooCommerce:`);
      console.log(`   Nome: ${wcProduct.name}`);
      console.log(`   SKU: ${wcProduct.sku || '[VAZIO]'}`);
      console.log(`   SKU (raw): "${wcProduct.sku}"`);
      console.log(`   Tipo: ${wcProduct.type}`);
      console.log(`   Categorias: ${wcProduct.categories?.map((c: any) => c.name).join(', ')}`);
      
    } catch (error) {
      console.log(`   Erro ao buscar produto ${id}:`, error);
    }
  }
}

async function main() {
  console.log('═'.repeat(100));
  console.log('  DIAGNÓSTICO DE SKU - SACOLAS DE PAPEL / LINHA COMERCIAL');
  console.log('═'.repeat(100));

  await checkCacheSacolas();
  await checkWooCommerceSacolas();
  await checkSpecificProducts();

  console.log('\n\n✅ Diagnóstico completo!\n');
  process.exit(0);
}

main().catch(console.error);
