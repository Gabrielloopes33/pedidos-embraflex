import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supa.agenciatouch.com.br';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0._G0caHkMnfr_HyJR9knteSCT0H9q3tDO5pL3AUb2mic';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Cliente Supabase inicializado no frontend');
