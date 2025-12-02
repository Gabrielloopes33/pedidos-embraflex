import bcrypt from 'bcrypt';
import { supabase } from './src/supabase-client';

async function seedUsers() {
  console.log('🌱 Iniciando seed de usuários...');

  const users = [
    {
      id: 'admin-001',
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    },
    {
      id: 'vendedor-yan',
      username: 'yan',
      password: 'yan123',
      role: 'vendedor'
    },
    {
      id: 'vendedor-luiz',
      username: 'luiz',
      password: 'luiz123',
      role: 'vendedor'
    }
  ];

  for (const user of users) {
    try {
      // Verificar se o usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', user.username)
        .single();

      if (existingUser) {
        console.log(`⚠️  Usuário ${user.username} já existe, pulando...`);
        continue;
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Inserir usuário
      const { error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          username: user.username,
          password: hashedPassword,
          role: user.role
        });

      if (error) {
        console.error(`❌ Erro ao criar usuário ${user.username}:`, error);
      } else {
        console.log(`✅ Usuário ${user.username} criado com sucesso!`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar usuário ${user.username}:`, error);
    }
  }

  console.log('🎉 Seed de usuários concluído!');
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
