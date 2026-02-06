/**
 * Script para criar usuário admin no Supabase
 * Este usuário é necessário para acessar a página de gestão de usuários
 * 
 * Execução: npx ts-node backend/create-admin-user.ts
 */

import { supabase } from './src/supabase-client';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  console.log('🔧 Criando usuário admin...\n');

  // Dados do admin (mesmos do hardcoded no frontend)
  const adminData = {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    email: 'admin@embraflex.com',
    full_name: 'Administrador',
    role: 'admin' as 'admin',
    is_active: true,
    created_by: null, // Admin não tem criador
  };

  try {
    // 1. Verificar se admin já existe
    console.log('1️⃣ Verificando se admin já existe...');
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('username', 'admin')
      .single();

    if (existingAdmin) {
      console.log('✅ Admin já existe:', existingAdmin);
      console.log('\n📝 Para fazer login, use:');
      console.log('   Username: admin');
      console.log('   Password: admin123\n');
      return;
    }

    // 2. Hash da senha
    console.log('2️⃣ Gerando hash da senha...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminData.password, saltRounds);

    // 3. Criar admin
    console.log('3️⃣ Criando usuário admin no Supabase...');
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: adminData.id,
        username: adminData.username,
        password: passwordHash,
        email: adminData.email,
        full_name: adminData.full_name,
        role: adminData.role,
        is_active: adminData.is_active,
        created_by: adminData.created_by,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Admin criado com sucesso!');
    console.log('\n📋 Detalhes:');
    console.log('   ID:', data.id);
    console.log('   Username:', data.username);
    console.log('   Email:', data.email);
    console.log('   Role:', data.role);
    console.log('\n📝 Para fazer login, use:');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
    }
    process.exit(1);
  }
}

// Executar
createAdminUser()
  .then(() => {
    console.log('🎉 Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
