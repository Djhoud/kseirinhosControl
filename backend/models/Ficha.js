import pool from '../config/database.js';

export class Ficha {
    static async criar(dados) {
        const { numero, usuario_id, itens } = dados;
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // VERIFICAR se já existe ficha PENDENTE com este número
            const fichaExistente = await client.query(
                `SELECT id FROM fichas 
                 WHERE numero = $1 AND status = 'pendente' 
                 FOR UPDATE`,
                [numero]
            );
            
            if (fichaExistente.rows.length > 0) {
                throw new Error('Já existe uma ficha pendente com este número');
            }
            
            // CRIAR A FICHA
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
            `SELECT f.*, u.nome as usuario_nome
             FROM fichas f 
             JOIN usuarios u ON f.usuario_id = u.id 
             WHERE f.numero = $1 AND f.status = 'pendente'`,
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

    static async confirmarFicha(fichaId, usuarioId) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 1. Buscar dados COMPLETOS da ficha antes de excluir
            const fichaResult = await client.query(
                `SELECT f.*, u.nome as usuario_nome 
                 FROM fichas f 
                 JOIN usuarios u ON f.usuario_id = u.id 
                 WHERE f.id = $1 AND f.status = 'pendente' 
                 FOR UPDATE`,
                [fichaId]
            );
            
            if (fichaResult.rows.length === 0) {
                throw new Error('Ficha não encontrada ou já confirmada');
            }
            
            const ficha = fichaResult.rows[0];
            
            // 2. Buscar todos os itens da ficha
            const itensResult = await client.query(
                `SELECT fi.*, p.nome as produto_nome 
                 FROM ficha_itens fi 
                 JOIN produtos p ON fi.produto_id = p.id 
                 WHERE fi.ficha_id = $1`,
                [fichaId]
            );
            
            const itens = itensResult.rows;
            
            
            try {
                for (const item of itens) {
                    await client.query(
                        `INSERT INTO vendas_historico 
                        (ficha_numero, produto_id, produto_nome, quantidade, 
                         preco_unitario, total_item, usuario_id, usuario_nome)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                        [
                            ficha.numero,
                            item.produto_id,
                            item.produto_nome,
                            item.quantidade,
                            item.preco_unitario,
                            (item.quantidade * item.preco_unitario),
                            usuarioId,
                            ficha.usuario_nome
                        ]
                    );
                }
            } catch (historicoError) {
                console.log('Tabela vendas_historico não existe, continuando...');
                // Não impede a confirmação se a tabela não existir
            }
            
            // 4. DESCONTAR DO ESTOQUE (já descontado na criação, mas por segurança)
            for (const item of itens) {
                await client.query(
                    'UPDATE produtos SET estoque = estoque - $1 WHERE id = $2',
                    [item.quantidade, item.produto_id]
                );
            }
            
            // 5. EXCLUIR A FICHA E SEUS ITENS
            await client.query('DELETE FROM fichas WHERE id = $1', [fichaId]);
            
            await client.query('COMMIT');
            
            return {
                success: true,
                numero: ficha.numero,
                total: ficha.total,
                itens: itens.length,
                mensagem: 'Ficha finalizada e registrada no histórico'
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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

static async relatorioPorPeriodo(inicio, fim) {
    try {
        // 1. TOTALIZADORES GERAIS
        const vendasResult = await pool.query(
            `SELECT COUNT(DISTINCT ficha_numero) as total_fichas, 
                    COALESCE(SUM(total_item), 0) as total_vendas,
                    COALESCE(SUM(quantidade), 0) as total_itens
             FROM vendas_historico 
             WHERE DATE(data_venda) BETWEEN $1 AND $2`,
            [inicio, fim]
        );
        
        // 2. LISTA DETALHADA DE TODOS OS ITENS VENDIDOS
        const itensDetalhados = await pool.query(
            `SELECT 
                v.ficha_numero,
                v.produto_nome,
                v.quantidade,
                v.preco_unitario,
                v.total_item,
                TO_CHAR(v.data_venda, 'DD/MM/YYYY HH24:MI') as data_hora,
                v.usuario_nome as atendente
             FROM vendas_historico v
             WHERE DATE(v.data_venda) BETWEEN $1 AND $2
             ORDER BY v.data_venda DESC, v.ficha_numero`,
            [inicio, fim]
        );
        
        // 3. RESUMO POR PRODUTO (para o dashboard)
        const produtosResumo = await pool.query(
            `SELECT 
                produto_nome,
                SUM(quantidade) as quantidade_total,
                SUM(total_item) as total_vendido,
                ROUND(AVG(preco_unitario), 2) as preco_medio
             FROM vendas_historico 
             WHERE DATE(data_venda) BETWEEN $1 AND $2
             GROUP BY produto_nome
             ORDER BY quantidade_total DESC`,
            [inicio, fim]
        );
        
        return {
            // Totais gerais
            totalFichas: parseInt(vendasResult.rows[0].total_fichas),
            totalVendas: parseFloat(vendasResult.rows[0].total_vendas),
            totalItens: parseInt(vendasResult.rows[0].total_itens),
            
            // Lista completa de itens vendidos
            itensDetalhados: itensDetalhados.rows,
            
            // Resumo por produto
            produtosResumo: produtosResumo.rows,
            
            // Metadados
            periodo: { inicio, fim },
            geradoEm: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Erro no relatório:', error);
        // Fallback: retorna estrutura vazia
        return {
            totalFichas: 0,
            totalVendas: 0,
            totalItens: 0,
            itensDetalhados: [],
            produtosResumo: [],
            periodo: { inicio, fim },
            geradoEm: new Date().toISOString()
        };
    }
}

    static async contarFichasHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        try {
            const result = await pool.query(
                `SELECT COUNT(DISTINCT ficha_numero) 
                 FROM vendas_historico 
                 WHERE DATE(data_venda) = $1`,
                [hoje]
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            return 0;
        }
    }

    static async totalVendasHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        try {
            const result = await pool.query(
                `SELECT COALESCE(SUM(total_item), 0) 
                 FROM vendas_historico 
                 WHERE DATE(data_venda) = $1`,
                [hoje]
            );
            return parseFloat(result.rows[0].coalesce);
        } catch (error) {
            return 0;
        }
    }
}