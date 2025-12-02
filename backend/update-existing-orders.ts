import { supabase } from './src/supabase-client';

async function updateExistingOrders() {
  console.log('📝 Atualizando pedidos existentes com informações de vendedor...');

  try {
    // Buscar todos os pedidos sem vendedorId
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('id, userId')
      .or('vendedorId.is.null,vendedorName.is.null');

    if (fetchError) {
      console.error('❌ Erro ao buscar pedidos:', fetchError);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('✅ Todos os pedidos já possuem informações de vendedor!');
      return;
    }

    console.log(`📊 Encontrados ${orders.length} pedidos para atualizar`);

    for (const order of orders) {
      if (order.userId) {
        // Buscar informações do usuário
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, username')
          .eq('id', order.userId)
          .single();

        if (userError) {
          console.error(`  ❌ Erro ao buscar usuário ${order.userId}:`, userError);
          continue;
        }

        if (user) {
          // Atualizar o pedido
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              vendedorId: user.id,
              vendedorName: user.username
            })
            .eq('id', order.id);

          if (updateError) {
            console.error(`  ❌ Erro ao atualizar pedido ${order.id}:`, updateError);
          } else {
            console.log(`  ✅ Pedido ${order.id} atualizado - Vendedor: ${user.username}`);
          }
        }
      } else {
        console.log(`  ⚠️  Pedido ${order.id} não possui userId, pulando...`);
      }
    }

    console.log('🎉 Atualização concluída!');
  } catch (error) {
    console.error('💥 Erro fatal:', error);
  }
}

updateExistingOrders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro:', error);
    process.exit(1);
  });
