import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getSyncStatus, triggerSync } from '@/lib/api';
import { toast } from 'sonner';

interface SyncStatusData {
  lastSync: {
    id: string;
    sync_type: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    started_at: string;
    completed_at: string | null;
    items_processed: number;
    items_created: number;
    items_updated: number;
    items_failed: number;
    error_message: string | null;
  } | null;
  isStale: boolean;
}

interface UseSyncStatusReturn {
  isSyncing: boolean;
  syncStatus: SyncStatusData | null;
  lastSyncDate: Date | null;
  startSync: (forceFullSync?: boolean) => Promise<void>;
  error: Error | null;
}

/**
 * Hook para monitorar status do sync com WooCommerce
 *
 * Features:
 * - Polling automático a cada 3s quando sync está rodando
 * - Invalidação automática de queries de produtos quando sync terminar
 * - Expõe estado do sync para UI
 */
export function useSyncStatus(): UseSyncStatusReturn {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Query para status do sync com polling condicional
  const { data: syncStatus, error: queryError } = useQuery<SyncStatusData>({
    queryKey: ['sync-status'],
    queryFn: () => getSyncStatus('products'),
    refetchInterval: isSyncing ? 3000 : false, // Polling só quando syncing
    enabled: true,
    retry: 1,
    staleTime: isSyncing ? 0 : 30000, // Sem stale quando syncing
  });

  // Detectar quando sync terminou
  useEffect(() => {
    if (!syncStatus?.lastSync) return;

    const status = syncStatus.lastSync.status;

    // Se estávamos syncing e agora completou ou falhou
    if (isSyncing && (status === 'completed' || status === 'failed')) {
      console.log('🔄 Sync detectado como finalizado:', status);
      setIsSyncing(false);

      if (status === 'completed') {
        // Invalidar cache de produtos para forçar refetch
        console.log('♻️ Invalidando queries de produtos...');
        queryClient.invalidateQueries({ queryKey: ['cached-products'] });
        queryClient.invalidateQueries({ queryKey: ['wc-products'] });
        queryClient.invalidateQueries({ queryKey: ['cache-stats'] });

        toast.success('Sincronização concluída!', {
          description: `${syncStatus.lastSync.items_processed} produtos processados`,
        });
      } else if (status === 'failed') {
        toast.error('Falha na sincronização', {
          description: syncStatus.lastSync.error_message || 'Erro desconhecido',
        });
      }
    }

    // Detectar se sync foi iniciado externamente (ex: outro usuário)
    if (!isSyncing && (status === 'pending' || status === 'in_progress')) {
      console.log('🔄 Sync externo detectado, iniciando polling...');
      setIsSyncing(true);
    }
  }, [syncStatus, isSyncing, queryClient]);

  // Atualizar erro se houver
  useEffect(() => {
    if (queryError) {
      setError(queryError as Error);
    }
  }, [queryError]);

  // Função para iniciar sync manualmente
  const startSync = useCallback(async (forceFullSync = false) => {
    try {
      setIsSyncing(true);
      setError(null);

      console.log('🚀 Iniciando sync via hook...', { forceFullSync });

      await triggerSync({
        syncType: 'products',
        forceFullSync
      });

      toast.info('Sincronização iniciada', {
        description: 'Os produtos serão atualizados automaticamente.',
      });

      // Refetch imediato para pegar o status 'pending' ou 'in_progress'
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });

    } catch (err) {
      console.error('❌ Erro ao iniciar sync:', err);
      setIsSyncing(false);
      setError(err as Error);

      toast.error('Falha ao iniciar sincronização', {
        description: 'Tente novamente mais tarde.',
      });
    }
  }, [queryClient]);

  // Calcular data do último sync completo
  const lastSyncDate = syncStatus?.lastSync?.completed_at
    ? new Date(syncStatus.lastSync.completed_at)
    : null;

  return {
    isSyncing,
    syncStatus: syncStatus || null,
    lastSyncDate,
    startSync,
    error,
  };
}
