import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const HEALTH_TIMEOUT = Number(import.meta.env.VITE_HEALTH_TIMEOUT_MS || 120000); // Render Free pode levar > 60s

const getHealthUrls = () => {
  const urls = [`${API_BASE_URL}/health`];
  if (API_BASE_URL.endsWith('/api')) {
    urls.push(`${API_BASE_URL.slice(0, -4)}/health`);
  }
  return urls;
};

/**
 * Verifica se o backend está saudável
 */
export const isBackendHealthy = async (): Promise<boolean> => {
  const healthUrls = getHealthUrls();

  for (const healthUrl of healthUrls) {
    try {
      const response = await axios.get(healthUrl, {
        timeout: HEALTH_TIMEOUT
      });
      return response.data?.status === 'ok';
    } catch (error) {
      console.error(`❌ Health check falhou (${healthUrl}):`, error);
    }
  }

  return false;
};

/**
 * Função de delay para exponential backoff
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Aquece o backend com retries e exponential backoff
 * @param maxRetries Número máximo de tentativas (padrão: 3)
 * @returns true se backend ficou saudável, false caso contrário
 */
export const warmupBackendWithRetry = async (
  maxRetries: number = 3,
  onProgress?: (attempt: number, maxRetries: number) => void
): Promise<{ success: boolean; attempt: number }> => {
  console.log('🔥 Iniciando warmup com retries...');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (onProgress) {
      onProgress(attempt, maxRetries);
    }
    
    console.log(`🔄 Tentativa ${attempt}/${maxRetries} de warmup...`);
    
    try {
      const isHealthy = await isBackendHealthy();
      if (isHealthy) {
        console.log(`✅ Backend aquecido com sucesso na tentativa ${attempt}!`);
        return { success: true, attempt };
      }
    } catch (error) {
      console.warn(`⚠️ Tentativa ${attempt} falhou:`, error);
    }
    
    // Se não for a última tentativa, aguarda com exponential backoff
    if (attempt < maxRetries) {
      const backoffTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
      console.log(`⏳ Aguardando ${backoffTime}ms antes da próxima tentativa...`);
      await delay(backoffTime);
    }
  }
  
  console.warn(`❌ Warmup falhou após ${maxRetries} tentativas`);
  return { success: false, attempt: maxRetries };
};

/**
 * Acorda o backend do Render (cold start) em background
 * Chama o health check para "esquentar" o servidor
 * @deprecated Use warmupBackendWithRetry() para warmup mais confiável
 */
export const warmupBackend = () => {
  console.log('🔥 Warming up backend (legacy)...');
  
  axios.get(`${API_BASE_URL}/health`, { timeout: HEALTH_TIMEOUT })
    .then(() => {
      console.log('✅ Backend aquecido e pronto!');
    })
    .catch((error) => {
      console.warn('⚠️ Backend warmup falhou (pode estar offline):', error.message);
    });
};
