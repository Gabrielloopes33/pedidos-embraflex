import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supa.agenciatouch.com.br';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0._G0caHkMnfr_HyJR9knteSCT0H9q3tDO5pL3AUb2mic';

const BUILD_VERSION = 'v3.2-' + Date.now();
console.log('🚀🚀🚀 VERSÃO:', BUILD_VERSION, '- Supabase DIRETO + Skip userId se vazio!');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
