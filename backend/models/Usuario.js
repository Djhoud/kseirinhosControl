import bcrypt from 'bcrypt';
import pool from '../config/database.js';

export class Usuario {
    static async criar(username, password, nome) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO usuarios (username, password, nome) VALUES ($1, $2, $3) RETURNING id, username, nome',
            [username, hashedPassword, nome]
        );
        
        return result.rows[0];
    }

    static async buscarPorUsername(username) {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE username = $1',
            [username]
        );
        
        return result.rows[0];
    }

    static async buscarPorId(id) {
        const result = await pool.query(
            'SELECT id, username, nome FROM usuarios WHERE id = $1',
            [id]
        );
        
        return result.rows[0];
    }

    static async verificarSenha(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}