import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { initializeDb } from './database';

const saltRounds = 10;

async function seed() {
  const db = await initializeDb();

  try {
    console.log('Iniciando o processo de seeding...');

    // --- Usuário Admin ---
    const adminUsername = 'admin';
    const adminExists = await db.get('SELECT id FROM users WHERE username = ?', adminUsername);
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('admin123', saltRounds);
      const adminId = crypto.randomUUID();
      await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
        adminId,
        adminUsername,
        adminPassword,
        'admin'
      );
      console.log(`Usuário 'admin' criado com sucesso.`);
    } else {
      console.log(`Usuário 'admin' já existe.`);
    }

    // --- Usuário Vendedor ---
    const vendedorUsername = 'vendedor1';
    const vendedorExists = await db.get('SELECT id FROM users WHERE username = ?', vendedorUsername);
    if (!vendedorExists) {
      const vendedorPassword = await bcrypt.hash('vendedor123', saltRounds);
      const vendedorId = crypto.randomUUID();
      await db.run('INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
        vendedorId,
        vendedorUsername,
        vendedorPassword,
        'vendedor'
      );
      console.log(`Usuário 'vendedor1' criado com sucesso.`);
    } else {
      console.log(`Usuário 'vendedor1' já existe.`);
    }

    console.log('Seeding concluído.');

  } catch (error) {
    console.error('Erro durante o seeding:', error);
  } finally {
    await db.close();
  }
}

seed();
