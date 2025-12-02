import express from 'express';
import {
    atualizarProduto,
    buscarProduto,
    criarProduto,
    excluirProduto,
    listarProdutos
} from '../controllers/produtoController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, listarProdutos);
router.get('/:id', authenticateToken, buscarProduto);
router.post('/', authenticateToken, criarProduto);
router.put('/:id', authenticateToken, atualizarProduto);
router.delete('/:id', authenticateToken, excluirProduto);

export default router;