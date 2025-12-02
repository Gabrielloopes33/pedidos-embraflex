import { supabase } from './src/supabase-client';

async function addVendedorColumns() {
  console.log('🔧 Adicionando colunas vendedorId e vendedorName...');

  try {
    // Método 1: Tentar via raw SQL direto
    console.log('📝 Tentativa 1: Usando query SQL direta...');
    
    // Como o Supabase REST API não suporta ALTER TABLE diretamente,
    // vamos fazer manualmente via HTTP
    const supabaseUrl = process.env.SUPABASE_URL || 'https://supa.agenciatouch.com.br';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
      console.log('\n⚠️  SOLUÇÃO MANUAL NECESSÁRIA:');
      console.log('Execute o seguinte SQL no Supabase Studio (SQL Editor):');
      console.log('\n' + '='.repeat(60));
      console.log(`
-- Adicionar coluna vendedorId
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vendedorId" TEXT;

-- Adicionar coluna vendedorName  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vendedorName" TEXT;

-- Atualizar pedidos existentes
UPDATE orders o
SET 
  "vendedorId" = o."userId",
  "vendedorName" = u.username
FROM users u
WHERE o."userId" = u.id
  AND o."vendedorId" IS NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_orders_vendedorid ON orders("vendedorId");

-- Verificar
SELECT id, "customerName", "vendedorName" FROM orders LIMIT 5;
      `);
      console.log('='.repeat(60) + '\n');
      
      console.log('📍 Acesse: ' + supabaseUrl + '/project/default/sql');
      return;
    }

    // Se tiver a key, tentar via fetch direto
    console.log('⚠️  Como o Supabase REST não suporta DDL (ALTER TABLE),');
    console.log('você precisa executar o SQL manualmente no Supabase Studio.\n');
    
    console.log('📋 COPIE E EXECUTE ESTE SQL NO SUPABASE STUDIO:');
    console.log('='.repeat(60));
    console.log(`
-- 1. Adicionar colunas
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vendedorId" TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vendedorName" TEXT;

-- 2. Criar índice
CREATE INDEX IF NOT EXISTS idx_orders_vendedorid ON orders("vendedorId");

-- 3. Atualizar pedidos existentes com base no userId
UPDATE orders o
SET 
  "vendedorId" = o."userId",
  "vendedorName" = u.username
FROM users u
WHERE o."userId" = u.id
  AND (o."vendedorId" IS NULL OR o."vendedorName" IS NULL);

-- 4. Verificar resultado
SELECT id, "customerName", "vendedorId", "vendedorName" 
FROM orders 
ORDER BY "createdAt" DESC 
LIMIT 10;
    `);
    console.log('='.repeat(60));
    console.log('\n📍 Acesse o SQL Editor em:');
    console.log('   ' + supabaseUrl + '/project/default/sql\n');
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

addVendedorColumns()
  .then(() => {
    console.log('\n✅ Instruções exibidas!');
    console.log('Após executar o SQL, rode novamente: npx tsx update-existing-orders.ts');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
