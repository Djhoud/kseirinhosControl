import express from 'express';
import {
    buscarFicha,
    confirmarFicha,
    criarFicha, // ← ESTA IMPORT ESTÁ FALTANDO?
    dashboard,
    listarPendentes,
    relatorioFichas
} from '../controllers/fichaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// VERIFIQUE SE TEM ESTA LINHA:
router.get('/relatorio', authenticateToken, relatorioFichas);

// Resto das rotas...
router.get('/dashboard', authenticateToken, dashboard);
router.post('/', authenticateToken, criarFicha);
router.get('/:numero', authenticateToken, buscarFicha);
router.get('/pendentes', authenticateToken, listarPendentes);
router.post('/:id/confirmar', authenticateToken, confirmarFicha);

export default router;