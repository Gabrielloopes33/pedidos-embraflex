import bcrypt from 'bcrypt';

const password = process.argv[2] || 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds).then(hash => {
  console.log('\n📝 Senha:', password);
  console.log('🔐 Hash:', hash);
  console.log('\n✅ Use este hash na tabela do Supabase!\n');
});
