import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { ProductionOrder } from './types';

let db: Database | null = null;

async function initializeDb(): Promise<Database> {
  if (db) {
    return db;
  }

  const dbPath = process.env.DATABASE_PATH || './database.sqlite';

  const newDb = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Estrutura da tabela de usuários
  await newDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'vendedor'))
    );
  `);

  // Estrutura da tabela de ordens
  await newDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customerName TEXT NOT NULL,
      products TEXT NOT NULL, -- Armazenado como JSON string
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      history TEXT NOT NULL, -- Armazenado como JSON string
      comments TEXT NOT NULL, -- Armazenado como JSON string
      userId TEXT, -- Chave estrangeira para o usuário que criou
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  db = newDb;
  return db;
}

function parseOrder(row: any): ProductionOrder {
    return {
        ...row,
        products: JSON.parse(row.products),
        history: JSON.parse(row.history),
        comments: JSON.parse(row.comments),
    };
}

export { initializeDb, parseOrder };
