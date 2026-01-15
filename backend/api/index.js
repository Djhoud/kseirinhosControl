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

// ⭐⭐ ADICIONE ESTA ROTA RAIZ PRIMEIRO ⭐⭐
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend da Lanchonete Online',
    status: 'online',
    environment: 'production',
    database: 'Neon.tech',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      produtos: '/api/produtos',
      fichas: '/api/fichas',
      health: '/api/health',
      docs: '/api'
    },
    documentation: 'API REST para sistema de lanchonete',
    repo: 'https://github.com/Djhoud/kseirinhosControl'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/fichas', fichaRoutes);

// Health check (obrigatório para Vercel)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Backend da Lanchonete Online',
    status: 'online',
    database: 'Neon.tech',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/registrar',
      'GET /api/produtos',
      'GET /api/fichas'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'lanchonete-backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Rota 404 para endpoints não existentes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/registrar',
      'GET /api/produtos',
      'POST /api/produtos',
      'GET /api/fichas',
      'POST /api/fichas'
    ],
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err.stack);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Contacte o administrador',
    timestamp: new Date().toISOString()
  });
});

// Handler para o Vercel
export default async (req, res) => {
  return app(req, res);
};