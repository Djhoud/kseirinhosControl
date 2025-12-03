import pool from '../config/database.js';

export class Ficha {
    static async criar(dados) {
        const { numero, usuario_id, itens } = dados;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const fichaResult = await client.query(
                `INSERT INTO fichas (numero, usuario_id, total, status) 
                 VALUES ($1, $2, $3, 'pendente') RETURNING *`,
                [numero, usuario_id, 0]
            );
            
            const ficha = fichaResult.rows[0];
            let totalFicha = 0;
            
            for (const item of itens) {
                const { produto_id, quantidade, preco_unitario } = item;
                const itemTotal = preco_unitario * quantidade;
                totalFicha += itemTotal;
                
                await client.query(
                    `INSERT INTO ficha_itens (ficha_id, produto_id, quantidade, preco_unitario) 
                     VALUES ($1, $2, $3, $4)`,
                    [ficha.id, produto_id, quantidade, preco_unitario]
                );
                
                await client.query(
                    'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
                    [quantidade, produto_id]
                );
            }
            
            await client.query(
                'UPDATE fichas SET total = $1 WHERE id = $2',
                [totalFicha, ficha.id]
            );
            
            ficha.total = totalFicha;
            
            await client.query('COMMIT');
            return ficha;
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async buscarPorNumero(numero) {
        const result = await pool.query(
            `SELECT f.*, 
                u.nome as usuario_nome,
                uc.nome as usuario_confirmacao_nome
             FROM fichas f 
             LEFT JOIN usuarios u ON f.usuario_id = u.id 
             LEFT JOIN usuarios uc ON f.usuario_confirmacao_id = uc.id
             WHERE f.numero = $1`,
            [numero]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const ficha = result.rows[0];
        
        const itensResult = await pool.query(
            `SELECT fi.*, p.nome as produto_nome 
             FROM ficha_itens fi 
             JOIN produtos p ON fi.produto_id = p.id 
             WHERE fi.ficha_id = $1`,
            [ficha.id]
        );
        
        ficha.itens = itensResult.rows;
        return ficha;
    }

    static async relatorioPorPeriodo(inicio, fim) {
        const vendasResult = await pool.query(
            `SELECT COUNT(*) as total_fichas, COALESCE(SUM(total), 0) as total_vendas
             FROM fichas 
             WHERE data BETWEEN $1 AND $2 
             AND status = 'confirmada'`,
            [inicio, fim]
        );
        
        const produtosResult = await pool.query(
            `SELECT p.nome, SUM(fi.quantidade) as quantidade, 
                    SUM(fi.quantidade * fi.preco_unitario) as total
             FROM ficha_itens fi
             JOIN produtos p ON fi.produto_id = p.id
             JOIN fichas f ON fi.ficha_id = f.id
             WHERE f.data BETWEEN $1 AND $2 
             AND f.status = 'confirmada'
             GROUP BY p.id, p.nome
             ORDER BY quantidade DESC`,
            [inicio, fim]
        );
        
        return {
            totalFichas: parseInt(vendasResult.rows[0].total_fichas),
            totalVendas: parseFloat(vendasResult.rows[0].total_vendas),
            produtosVendidos: produtosResult.rows
        };
    }

    static async contarFichasHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        const result = await pool.query(
            `SELECT COUNT(*) FROM fichas 
             WHERE DATE(data) = $1 
             AND status = 'confirmada'`,
            [hoje]
        );
        return parseInt(result.rows[0].count);
    }

    static async totalVendasHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        const result = await pool.query(
            `SELECT COALESCE(SUM(total), 0) 
             FROM fichas 
             WHERE DATE(data) = $1 
             AND status = 'confirmada'`,
            [hoje]
        );
        return parseFloat(result.rows[0].coalesce);
    }

    static async confirmarFicha(fichaId, usuarioId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const fichaCheck = await client.query(
                'SELECT id, status FROM fichas WHERE id = $1 FOR UPDATE',
                [fichaId]
            );
            
            if (fichaCheck.rows.length === 0) {
                throw new Error('Ficha não encontrada');
            }
            
            if (fichaCheck.rows[0].status !== 'pendente') {
                throw new Error('Ficha já foi confirmada ou cancelada');
            }
            
            const result = await client.query(
                `UPDATE fichas 
                 SET status = 'confirmada', 
                     data_confirmacao = CURRENT_TIMESTAMP,
                     usuario_confirmacao_id = $1
                 WHERE id = $2
                 RETURNING *`,
                [usuarioId, fichaId]
            );
            
            await client.query('COMMIT');
            return result.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
    static async buscarPorNumero(numero, incluirConfirmadas = false) {
    const result = await pool.query(
        `SELECT f.*, 
                u.nome as usuario_nome,
                uc.nome as usuario_confirmacao_nome
         FROM fichas f 
         LEFT JOIN usuarios u ON f.usuario_id = u.id 
         LEFT JOIN usuarios uc ON f.usuario_confirmacao_id = uc.id
         WHERE f.numero = $1
         ${!incluirConfirmadas ? "AND f.status != 'confirmada'" : ""}`,
        [numero]
    );
    
    if (result.rows.length === 0) {
        return null;
    }
    
    const ficha = result.rows[0];
    
    const itensResult = await pool.query(
        `SELECT fi.*, p.nome as produto_nome 
         FROM ficha_itens fi 
         JOIN produtos p ON fi.produto_id = p.id 
         WHERE fi.ficha_id = $1`,
        [ficha.id]
    );
    
    ficha.itens = itensResult.rows;
    return ficha;
}

    static async listarPendentes() {
        const result = await pool.query(
            `SELECT f.*, u.nome as usuario_nome 
             FROM fichas f 
             JOIN usuarios u ON f.usuario_id = u.id 
             WHERE f.status = 'pendente'
             ORDER BY f.created_at DESC`
        );
        return result.rows;
    }
}