import { QueryClient } from '@tanstack/react-query';
import { getCachedProducts, getCacheStats } from './supabase';

/**
 * Prefetch de dados críticos em background
 * Chamado após login para que dados já estejam prontos quando usuário navegar
 */
export async function prefetchCriticalData(queryClient: QueryClient): Promise<void> {
  console.log('🚀 Iniciando prefetch de dados críticos...');

  // Prefetch em paralelo para máxima velocidade
  await Promise.all([
    // Prefetch de produtos (mais importante)
    queryClient.prefetchQuery({
      queryKey: ['cached-products'],
      queryFn: () => getCachedProducts({ limit: 1000 }),
      staleTime: 5 * 60 * 1000, // 5 minutos
    }),

    // Prefetch de estatísticas do cache
    queryClient.prefetchQuery({
      queryKey: ['cache-stats'],
      queryFn: getCacheStats,
      staleTime: 5 * 60 * 1000,
    }),
  ]);

  console.log('✅ Prefetch de dados críticos concluído!');
}

/**
 * Prefetch silencioso (não bloqueia, roda em background)
 */
export function prefetchInBackground(queryClient: QueryClient): void {
  // Usar setTimeout para não bloquear o fluxo principal
  setTimeout(() => {
    prefetchCriticalData(queryClient).catch((error) => {
      console.warn('⚠️ Erro no prefetch (não crítico):', error);
    });
  }, 100);
}
