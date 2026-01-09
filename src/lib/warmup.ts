import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/**
 * Acorda o backend do Render (cold start) em background
 * Chama o health check para "esquentar" o servidor
 */
export const warmupBackend = () => {
  console.log('🔥 Warming up backend...');
  
  axios.get(`${API_BASE_URL}/health`, { timeout: 30000 })
    .then(() => {
      console.log('✅ Backend aquecido e pronto!');
    })
    .catch((error) => {
      console.warn('⚠️ Backend warmup falhou (pode estar offline):', error.message);
    });
};
