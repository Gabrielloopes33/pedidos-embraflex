import express, { Request, Response } from 'express';
import { wooCommerceSyncService } from '../services/sync';
import { cacheService } from '../services/cache';

const router = express.Router();

/**
 * POST /api/sync/woocommerce
 * Dispara sincronização com WooCommerce
 * Body: { syncType?: 'products' | 'customers' | 'full' | 'incremental', forceFullSync?: boolean }
 */
router.post('/woocommerce', async (req: Request, res: Response) => {
  try {
    const { syncType = 'incremental', forceFullSync = false } = req.body;

    // Obter usuário do token (se disponível)
    const userId = (req as any).user?.id;
    const triggeredBy = userId ? 'login' : 'manual';

    // Disparar sync em background (não bloquear a resposta)
    wooCommerceSyncService
      .sync({
        syncType,
        triggeredBy,
        userId,
        forceFullSync,
      })
      .then((result) => {
        console.log('Sync completed:', result);
      })
      .catch((error) => {
        console.error('Sync failed:', error);
      });

    // Retornar imediatamente
    res.json({
      message: 'Sincronização iniciada em background',
      syncType,
      triggeredBy,
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({
      message: 'Erro ao iniciar sincronização',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/status
 * Obtém status do último sync
 * Query: ?syncType=products|customers|full|incremental
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { syncType } = req.query;

    const lastSync = await wooCommerceSyncService.getLastSyncStatus(
      syncType as 'products' | 'customers' | 'full' | 'incremental' | undefined
    );

    res.json({
      lastSync,
      isStale: await wooCommerceSyncService.isCacheStale(),
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({
      message: 'Erro ao buscar status de sincronização',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/sync/stats
 * Obtém estatísticas do cache
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await cacheService.getCacheStats();
    const isEmpty = await cacheService.isCacheEmpty();

    res.json({
      ...stats,
      isEmpty,
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      message: 'Erro ao buscar estatísticas do cache',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/sync/cleanup
 * Limpa cache antigo (marca como inativo)
 * Body: { daysToKeep?: number }
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const { daysToKeep = 30 } = req.body;

    const cleanedCount = await cacheService.cleanupOldCache(daysToKeep);

    res.json({
      message: 'Cache limpo com sucesso',
      cleanedCount,
      daysToKeep,
    });
  } catch (error) {
    console.error('Error cleaning up cache:', error);
    res.status(500).json({
      message: 'Erro ao limpar cache',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
