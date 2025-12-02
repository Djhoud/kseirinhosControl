import express from 'express';
import { login, validate } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/validate', authenticateToken, validate);

export default router;