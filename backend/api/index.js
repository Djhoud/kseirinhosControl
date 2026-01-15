// api/index.js - Ponto de entrada do Vercel
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

// Importar rotas
import authRoutes from '../routes/auth.js';
import fichaRoutes from '../routes/fichas.js';
import produtoRoutes from '../routes/produtos.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Em produção, especifique seu frontend
  credentials: true
}));
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/fichas', fichaRoutes);

// Health check (obrigatório para Vercel)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Backend da Lanchonete Online',
    status: 'online',
    database: 'Neon.tech',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Handler para o Vercel
export default async (req, res) => {
  return app(req, res);
};