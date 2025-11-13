import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { ProductionOrder } from './types';
import crypto from 'crypto';

const app = express();
const port = 3001;

const dbPath = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Helper para ler o DB
const readDb = async (): Promise<{ orders: ProductionOrder[] }> => {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Se o arquivo não existir, retorna uma estrutura vazia
    return { orders: [] };
  }
};

// Helper para escrever no DB
const writeDb = async (data: { orders: ProductionOrder[] }) => {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
};

// --- ROTAS DA API ---

// Listar todas as ordens
app.get('/api/orders', async (req, res) => {
  const db = await readDb();
  res.json(db.orders);
});

// Criar uma nova ordem
app.post('/api/orders', async (req, res) => {
  const { customerName, products, priority, notes } = req.body;

  if (!customerName || !products) {
    return res.status(400).json({ message: 'Cliente e produtos são obrigatórios.' });
  }

  const newOrder: ProductionOrder = {
    id: crypto.randomUUID(),
    customerName,
    products,
    priority: priority || 'Normal',
    notes,
    status: 'Pendente',
    createdAt: new Date().toISOString(),
    history: [{ event: 'Ordem criada', timestamp: new Date().toISOString(), user: 'Vendedor' }],
    comments: [],
  };

  const db = await readDb();
  db.orders.push(newOrder);
  await writeDb(db);

  res.status(201).json(newOrder);
});

// Atualizar status da ordem
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Novo status é obrigatório.' });
  }

  const db = await readDb();
  const orderIndex = db.orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ message: 'Ordem não encontrada.' });
  }

  const order = db.orders[orderIndex];
  order.status = status;
  order.history.push({
    event: `Status alterado para ${status}`,
    timestamp: new Date().toISOString(),
    user: 'Produção', // Simplificação, idealmente viria do usuário logado
  });

  await writeDb(db);
  res.json(order);
});

// Adicionar um comentário
app.post('/api/orders/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { text, user } = req.body;

    if (!text || !user) {
        return res.status(400).json({ message: 'Texto do comentário e usuário são obrigatórios.' });
    }

    const db = await readDb();
    const orderIndex = db.orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
        return res.status(404).json({ message: 'Ordem não encontrada.' });
    }

    const order = db.orders[orderIndex];
    order.comments.push({
        text,
        user,
        timestamp: new Date().toISOString(),
    });

    await writeDb(db);
    res.json(order);
});


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});