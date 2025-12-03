import express from 'express';
import {
    buscarFicha,
    confirmarFicha,
    criarFicha,
    dashboard,
    listarPendentes,
    relatorioFichas
} from '../controllers/fichaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, dashboard);
router.post('/', authenticateToken, criarFicha);
router.get('/:numero', authenticateToken, buscarFicha);
router.get('/relatorio', authenticateToken, relatorioFichas);
router.get('/pendentes', authenticateToken, listarPendentes);
router.post('/:id/confirmar', authenticateToken, confirmarFicha);

export default router;