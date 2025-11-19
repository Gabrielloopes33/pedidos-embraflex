import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { initializeDb, pool } from './database';

const saltRounds = 10;

async function seed() {
  await initializeDb();

  try {
    console.log('Iniciando o processo de seeding...');

    // --- Usuário Admin ---
    const adminUsername = 'admin';
    const adminCheck = await pool.query('SELECT id FROM users WHERE username = $1', [adminUsername]);

    if (adminCheck.rowCount === 0) {
      const adminPassword = await bcrypt.hash('admin123', saltRounds);
      const adminId = crypto.randomUUID();
      await pool.query('INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
        [adminId, adminUsername, adminPassword, 'admin']
      );
      console.log(`Usuário 'admin' criado com sucesso.`);
    } else {
      console.log(`Usuário 'admin' já existe.`);
    }

    // --- Usuário Vendedor ---
    const vendedorUsername = 'vendedor1';
    const vendedorCheck = await pool.query('SELECT id FROM users WHERE username = $1', [vendedorUsername]);

    if (vendedorCheck.rowCount === 0) {
      const vendedorPassword = await bcrypt.hash('vendedor123', saltRounds);
      const vendedorId = crypto.randomUUID();
      await pool.query('INSERT INTO users (id, username, password, role) VALUES ($1, $2, $3, $4)',
        [vendedorId, vendedorUsername, vendedorPassword, 'vendedor']
      );
      console.log(`Usuário 'vendedor1' criado com sucesso.`);
    } else {
      console.log(`Usuário 'vendedor1' já existe.`);
    }

    console.log('Seeding concluído.');

  } catch (error) {
    console.error('Erro durante o seeding:', error);
  } finally {
    await pool.end();
  }
}

seed();
