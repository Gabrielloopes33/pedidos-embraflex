import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ SUPABASE_URL e SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY) devem estar configurados no .env');
}

console.log('🔌 Conectando ao Supabase...');
console.log('📍 URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // @ts-ignore - signal é suportado mas não está nos types
        signal: options.signal || AbortSignal.timeout(60000) // 60s timeout para operações do Supabase
      });
    }
  }
});

console.log('✅ Cliente Supabase inicializado com sucesso!');
