import { supabase } from './src/supabase-client';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🔄 Executando migração para adicionar colunas de vendedor...');

  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'add-vendedor-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao executar migração:', error);
      
      // Tentar executar manualmente
      console.log('⚠️  Tentando adicionar colunas manualmente...');
      
      // Adicionar vendedorId
      const { error: error1 } = await supabase.rpc('exec_sql', {
        sql_query: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vendedorId" TEXT'
      });
      
      if (!error1) {
        console.log('✅ Coluna vendedorId adicionada!');
      }
      
      // Adicionar vendedorName
      const { error: error2 } = await supabase.rpc('exec_sql', {
        sql_query: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS "vendedorName" TEXT'
      });
      
      if (!error2) {
        console.log('✅ Coluna vendedorName adicionada!');
      }
      
      // Atualizar pedidos existentes
      const { data: orders, error: error3 } = await supabase
        .from('orders')
        .select('id, userId')
        .is('vendedorId', null);
      
      if (orders && orders.length > 0) {
        console.log(`📝 Atualizando ${orders.length} pedidos existentes...`);
        
        for (const order of orders) {
          if (order.userId) {
            // Buscar username do usuário
            const { data: user } = await supabase
              .from('users')
              .select('username')
              .eq('id', order.userId)
              .single();
            
            if (user) {
              await supabase
                .from('orders')
                .update({
                  vendedorId: order.userId,
                  vendedorName: user.username
                })
                .eq('id', order.id);
              
              console.log(`  ✅ Pedido ${order.id} atualizado`);
            }
          }
        }
      }
      
      console.log('✅ Migração concluída manualmente!');
    } else {
      console.log('✅ Migração executada com sucesso!', data);
    }
  } catch (error) {
    console.error('💥 Erro fatal na migração:', error);
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Processo de migração finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
