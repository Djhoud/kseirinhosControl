import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar se usuário ainda existe
        const userResult = await pool.query(
            'SELECT id, username, nome FROM usuarios WHERE id = $1',
            [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        
        req.user = userResult.rows[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
};