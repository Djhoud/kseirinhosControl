import pool from '../config/database.js';

export class Ficha {
    static async criar(dados) {
        const { numero, usuario_id, itens } = dados;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Inserir ficha
            const fichaResult = await client.query(
                `INSERT INTO fichas (numero, usuario_id, total) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [numero, usuario_id, 0] // Total será calculado
            );
            
            const ficha = fichaResult.rows[0];
            let totalFicha = 0;
            
            // Inserir itens e calcular total
            for (const item of itens) {
                const { produto_id, quantidade, preco_unitario } = item;
                const itemTotal = preco_unitario * quantidade;
                totalFicha += itemTotal;
                
                // Inserir item
                await client.query(
                    `INSERT INTO ficha_itens (ficha_id, produto_id, quantidade, preco_unitario) 
                     VALUES ($1, $2, $3, $4)`,
                    [ficha.id, produto_id, quantidade, preco_unitario]
                );
                
                // Atualizar estoque
                await client.query(
                    'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
                    [quantidade, produto_id]
                );
            }
            
            // Atualizar total da ficha
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
            `SELECT f.*, u.nome as usuario_nome 
             FROM fichas f 
             JOIN usuarios u ON f.usuario_id = u.id 
             WHERE f.numero = $1`,
            [numero]
        );
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const ficha = result.rows[0];
        
        // Buscar itens da ficha
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
        // Total de vendas e fichas
        const vendasResult = await pool.query(
            `SELECT COUNT(*) as total_fichas, COALESCE(SUM(total), 0) as total_vendas
             FROM fichas 
             WHERE data BETWEEN $1 AND $2`,
            [inicio, fim]
        );
        
        // Produtos mais vendidos
        const produtosResult = await pool.query(
            `SELECT p.nome, SUM(fi.quantidade) as quantidade, SUM(fi.quantidade * fi.preco_unitario) as total
             FROM ficha_itens fi
             JOIN produtos p ON fi.produto_id = p.id
             JOIN fichas f ON fi.ficha_id = f.id
             WHERE f.data BETWEEN $1 AND $2
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
            'SELECT COUNT(*) FROM fichas WHERE DATE(data) = $1',
            [hoje]
        );
        return parseInt(result.rows[0].count);
    }

    static async totalVendasHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        const result = await pool.query(
            'SELECT COALESCE(SUM(total), 0) FROM fichas WHERE DATE(data) = $1',
            [hoje]
        );
        return parseFloat(result.rows[0].coalesce);
    }
}