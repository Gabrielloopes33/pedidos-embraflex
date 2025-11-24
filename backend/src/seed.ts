import bcrypt from 'bcrypt';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initializeDb, supabase } from './database';

dotenv.config();

const saltRounds = 10;

async function seed() {
  await initializeDb();

  try {
    console.log('Iniciando o processo de seeding...');

    // --- Usuário Admin ---
    const adminUsername = 'admin';
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', adminUsername)
      .maybeSingle(); // Usar maybeSingle() ao invés de single()

    if (!adminCheck) {
      const adminPassword = await bcrypt.hash('admin123', saltRounds);
      const adminId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: adminId,
          username: adminUsername,
          password: adminPassword,
          role: 'admin'
        }])
        .select();

      if (error) {
        console.error('Erro ao criar admin:', error);
        console.error('Detalhes:', JSON.stringify(error, null, 2));
      } else {
        console.log(`Usuário 'admin' criado com sucesso.`);
      }
    } else {
      console.log(`Usuário 'admin' já existe.`);
    }

    // --- Usuário Vendedor ---
    const vendedorUsername = 'vendedor1';
    const { data: vendedorCheck, error: vendedorCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('username', vendedorUsername)
      .maybeSingle(); // Usar maybeSingle() ao invés de single()

    if (!vendedorCheck) {
      const vendedorPassword = await bcrypt.hash('vendedor123', saltRounds);
      const vendedorId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          id: vendedorId,
          username: vendedorUsername,
          password: vendedorPassword,
          role: 'vendedor'
        }])
        .select();

      if (error) {
        console.error('Erro ao criar vendedor:', error);
        console.error('Detalhes:', JSON.stringify(error, null, 2));
      } else {
        console.log(`Usuário 'vendedor1' criado com sucesso.`);
      }
    } else {
      console.log(`Usuário 'vendedor1' já existe.`);
    }

    console.log('Seeding concluído.');

  } catch (error) {
    console.error('Erro durante o seeding:', error);
  }
}

seed();
