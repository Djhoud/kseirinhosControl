import pool from '../config/database.js';

export class Produto {
    static async listar() {
        const result = await pool.query(
            'SELECT * FROM produtos ORDER BY nome'
        );
        return result.rows;
    }

    static async buscarPorId(id) {
        const result = await pool.query(
            'SELECT * FROM produtos WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async criar(dados) {
        const { nome, categoria, preco, estoque, descricao } = dados;
        
        const result = await pool.query(
            `INSERT INTO produtos (nome, categoria, preco, estoque, descricao) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [nome, categoria, preco, estoque, descricao]
        );
        
        return result.rows[0];
    }

    static async atualizar(id, dados) {
        const { nome, categoria, preco, estoque, descricao } = dados;
        
        const result = await pool.query(
            `UPDATE produtos 
             SET nome = $1, categoria = $2, preco = $3, estoque = $4, descricao = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6 RETURNING *`,
            [nome, categoria, preco, estoque, descricao, id]
        );
        
        return result.rows[0];
    }

    static async excluir(id) {
        const result = await pool.query(
            'DELETE FROM produtos WHERE id = $1 RETURNING id',
            [id]
        );
        return result.rows[0];
    }

    static async atualizarEstoque(id, quantidade) {
        const result = await pool.query(
            'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2 RETURNING *',
            [quantidade, id]
        );
        return result.rows[0];
    }

    static async contar() {
        const result = await pool.query('SELECT COUNT(*) FROM produtos');
        return parseInt(result.rows[0].count);
    }

    static async listarBaixoEstoque() {
        const result = await pool.query(
            'SELECT COUNT(*) FROM produtos WHERE estoque < 10'
        );
        return parseInt(result.rows[0].count);
    }
}