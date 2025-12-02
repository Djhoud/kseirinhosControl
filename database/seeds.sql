-- Inserir usuário padrão
INSERT INTO usuarios (username, password, nome) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador');

-- Inserir produtos de exemplo
INSERT INTO produtos (nome, categoria, preco, estoque, descricao) VALUES 
('Café Expresso', 'Bebidas', 3.50, 100, 'Café expresso tradicional'),
('Cappuccino', 'Bebidas', 5.00, 80, 'Cappuccino cremoso'),
('Sanduíche Natural', 'Lanches', 12.00, 50, 'Sanduíche com frango e vegetais'),
('Misto Quente', 'Lanches', 8.00, 60, 'Pão de forma com queijo e presunto'),
('Suco de Laranja', 'Bebidas', 6.00, 120, 'Suco natural de laranja'),
('Água Mineral', 'Bebidas', 3.00, 200, 'Água mineral sem gás 500ml'),
('Bolo de Chocolate', 'Sobremesas', 8.00, 30, 'Fatia de bolo de chocolate'),
('Torta de Limão', 'Sobremesas', 10.00, 25, 'Fatia de torta de limão'),
('Salada de Frutas', 'Sobremesas', 12.00, 40, 'Salada de frutas frescas'),
('Coxinha', 'Acompanhamentos', 5.00, 80, 'Coxinha de frango'),
('Empada', 'Acompanhamentos', 4.50, 70, 'Empada de palmito'),
('Refrigerante', 'Bebidas', 5.00, 150, 'Lata 350ml');

-- Inserir algumas fichas de exemplo
INSERT INTO fichas (numero, total, usuario_id) VALUES 
('F001', 15.50, 1),
('F002', 25.00, 1);

-- Inserir itens das fichas
INSERT INTO ficha_itens (ficha_id, produto_id, quantidade, preco_unitario) VALUES 
(1, 1, 2, 3.50),  -- 2 Cafés
(1, 4, 1, 8.00),  -- 1 Misto Quente
(2, 3, 2, 12.00), -- 2 Sanduíches Naturais
(2, 5, 1, 6.00);  -- 1 Suco de Laranja