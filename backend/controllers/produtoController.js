import { Produto } from '../models/Produto.js';

export const listarProdutos = async (req, res) => {
    try {
        const produtos = await Produto.listar();
        res.json(produtos);
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const buscarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const produto = await Produto.buscarPorId(id);
        
        if (!produto) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        
        res.json(produto);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const criarProduto = async (req, res) => {
    try {
        const { nome, categoria, preco, estoque, descricao } = req.body;

        if (!nome || !categoria || preco === undefined || estoque === undefined) {
            return res.status(400).json({ error: 'Campos obrigatórios: nome, categoria, preco, estoque' });
        }

        const produto = await Produto.criar({
            nome,
            categoria,
            preco: parseFloat(preco),
            estoque: parseInt(estoque),
            descricao
        });

        res.status(201).json(produto);
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const atualizarProduto = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, categoria, preco, estoque, descricao } = req.body;

        // Verificar se produto existe
        const produtoExistente = await Produto.buscarPorId(id);
        if (!produtoExistente) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        const produto = await Produto.atualizar(id, {
            nome,
            categoria,
            preco: parseFloat(preco),
            estoque: parseInt(estoque),
            descricao
        });

        res.json(produto);
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

export const excluirProduto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se produto existe
        const produtoExistente = await Produto.buscarPorId(id);
        if (!produtoExistente) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        await Produto.excluir(id);
        res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};