import { Pool } from 'pg';
import { ProductionOrder } from './types';

// Configuração da conexão com o PostgreSQL
// As variáveis de ambiente devem ser configuradas no Render ou no arquivo .env
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'embraflex',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function initializeDb(): Promise<Pool> {
  try {
    const client = await pool.connect();
    console.log('Conectado ao PostgreSQL com sucesso!');
    client.release(); // Libera o cliente de volta para o pool

    // Criação das tabelas (se não existirem)
    // Usando aspas duplas para garantir que o Postgres respeite o camelCase das colunas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'vendedor'))
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        "customerName" TEXT NOT NULL,
        products TEXT NOT NULL, -- Armazenado como JSON string
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        notes TEXT,
        "createdAt" TEXT NOT NULL,
        history TEXT NOT NULL, -- Armazenado como JSON string
        comments TEXT NOT NULL, -- Armazenado como JSON string
        "userId" TEXT, -- Chave estrangeira para o usuário que criou
        FOREIGN KEY ("userId") REFERENCES users (id)
      );
    `);

    return pool;
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error);
    throw error;
  }
}

function parseOrder(row: any): ProductionOrder {
  // O Postgres retorna os nomes das colunas em minúsculo se não forem criadas com aspas.
  // Como estamos usando aspas no CREATE TABLE, elas devem vir em camelCase.
  // Mas por segurança, vamos verificar ambos.
  return {
    id: row.id,
    customerName: row.customerName || row.customername,
    products: typeof row.products === 'string' ? JSON.parse(row.products) : row.products,
    status: row.status,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.createdAt || row.createdat,
    history: typeof row.history === 'string' ? JSON.parse(row.history) : row.history,
    comments: typeof row.comments === 'string' ? JSON.parse(row.comments) : row.comments,
    userId: row.userId || row.userid
  };
}

export { initializeDb, parseOrder, pool };
