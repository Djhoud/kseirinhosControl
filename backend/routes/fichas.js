import express from 'express';
import {
    buscarFicha,
    criarFicha,
    dashboard,
    relatorioFichas
} from '../controllers/fichaController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authenticateToken, dashboard);
router.post('/', authenticateToken, criarFicha);
router.get('/:numero', authenticateToken, buscarFicha);
router.get('/relatorio', authenticateToken, relatorioFichas);

export default router;