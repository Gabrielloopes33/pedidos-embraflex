/**
 * Script para forçar re-sync de todos os produtos do WooCommerce
 * Usar após alterações na lógica de SKU
 * 
 * Uso: npx ts-node scripts/force-resync-products.ts
 */

import { wooCommerceSyncService } from '../src/services/sync';

async function forceResync() {
  console.log('═'.repeat(80));
  console.log('  FORÇANDO RE-SYNC DE PRODUTOS DO WOOCOMMERCE');
  console.log('  Isso vai atualizar todos os SKUs no cache');
  console.log('═'.repeat(80));
  console.log();

  try {
    const result = await wooCommerceSyncService.sync({
      syncType: 'products',
      triggeredBy: 'manual',
      forceFullSync: true, // Força sync completo, não incremental
      batchSize: 50,
    });

    if (result.success) {
      console.log('✅ Re-sync completado com sucesso!');
      console.log();
      console.log('📊 Resumo:');
      console.log(`   - Processados: ${result.metadata?.items_processed || 0}`);
      console.log(`   - Criados: ${result.metadata?.items_created || 0}`);
      console.log(`   - Atualizados: ${result.metadata?.items_updated || 0}`);
      console.log(`   - Falhas: ${result.metadata?.items_failed || 0}`);
    } else {
      console.error('❌ Re-sync falhou:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro durante o re-sync:', error);
  }

  console.log();
  console.log('═'.repeat(80));
  process.exit(0);
}

forceResync().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
