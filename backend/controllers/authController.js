import jwt from 'jsonwebtoken';
import { Usuario } from '../models/Usuario.js';

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }

        // Buscar usuário
        const usuario = await Usuario.buscarPorUsername(username);
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar senha
        const senhaValida = await Usuario.verificarSenha(password, usuario.password);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token
        const token = jwt.sign(
            { userId: usuario.id, username: usuario.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: usuario.id,
                username: usuario.username,
                nome: usuario.nome
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const validate = async (req, res) => {
    try {
        const usuario = await Usuario.buscarPorId(req.user.id);
        res.json({
            user: {
                id: usuario.id,
                username: usuario.username,
                nome: usuario.nome
            }
        });
    } catch (error) {
        console.error('Erro na validação:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};