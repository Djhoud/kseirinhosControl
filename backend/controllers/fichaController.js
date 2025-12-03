import { Ficha } from '../models/Ficha.js';
import { Produto } from '../models/Produto.js';

export const criarFicha = async (req, res) => {
    try {
        const { numero, itens } = req.body;
        const usuario_id = req.user.id;

        if (!numero || !itens || !Array.isArray(itens) || itens.length === 0) {
            return res.status(400).json({ error: 'Número da ficha e itens são obrigatórios' });
        }

        const fichaExistente = await Ficha.buscarPorNumero(numero);
        if (fichaExistente) {
            return res.status(400).json({ error: 'Já existe uma ficha com este número' });
        }

        const itensComPrecos = [];
        for (const item of itens) {
            const produto = await Produto.buscarPorId(item.produto_id);
            if (!produto) {
                return res.status(400).json({ error: `Produto com ID ${item.produto_id} não encontrado` });
            }

            if (produto.estoque < item.quantidade) {
                return res.status(400).json({ 
                    error: `Estoque insuficiente para ${produto.nome}. Disponível: ${produto.estoque}` 
                });
            }

            itensComPrecos.push({
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco_unitario: produto.preco
            });
        }

        const ficha = await Ficha.criar({
            numero,
            usuario_id,
            itens: itensComPrecos
        });

        res.status(201).json(ficha);
    } catch (error) {
        console.error('Erro ao criar ficha:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const buscarFicha = async (req, res) => {
    try {
        const { numero } = req.params;
        const { admin = false } = req.query; // Novo parâmetro
        
        // Se for admin, pode ver fichas confirmadas
        const ficha = await Ficha.buscarPorNumero(numero, admin === 'true');
        
        if (!ficha) {
            return res.status(404).json({ 
                error: 'Ficha não encontrada ou já foi finalizada'
            });
        }
        
        res.json(ficha);
    } catch (error) {
        console.error('Erro ao buscar ficha:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const relatorioFichas = async (req, res) => {
    try {
        const { inicio, fim } = req.query;

        if (!inicio || !fim) {
            return res.status(400).json({ error: 'Datas de início e fim são obrigatórias' });
        }

        const relatorio = await Ficha.relatorioPorPeriodo(inicio, fim);
        res.json(relatorio);
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const dashboard = async (req, res) => {
    try {
        const totalProdutos = await Produto.contar();
        const produtosBaixoEstoque = await Produto.listarBaixoEstoque();
        const fichasHoje = await Ficha.contarFichasHoje();
        const vendasHoje = await Ficha.totalVendasHoje();

        res.json({
            totalProdutos,
            produtosBaixoEstoque,
            fichasHoje,
            vendasHoje
        });
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const confirmarFicha = async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioId = req.user.id;
        
        const ficha = await Ficha.confirmarFicha(id, usuarioId);
        
        res.json({
            success: true,
            message: 'Ficha confirmada com sucesso!',
            ficha
        });
        
    } catch (error) {
        console.error('Erro ao confirmar ficha:', error);
        res.status(400).json({ error: error.message });
    }
};

export const listarPendentes = async (req, res) => {
    try {
        const fichas = await Ficha.listarPendentes();
        res.json(fichas);
    } catch (error) {
        console.error('Erro ao listar fichas pendentes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};