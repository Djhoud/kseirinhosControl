import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import authRoutes from './routes/auth.js';
import fichaRoutes from './routes/fichas.js';
import produtoRoutes from './routes/produtos.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/produtos', produtoRoutes);
app.use('/api/fichas', fichaRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Backend da Lanchonete Online',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    database: 'connected'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    available: ['/', '/api/health', '/api/auth', '/api/produtos', '/api/fichas']
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Export para Vercel
export default app;

// Iniciar servidor apenas se executado diretamente
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor local na porta ${PORT}`);
    console.log(`🔗 http://localhost:${PORT}/`);
  });
}