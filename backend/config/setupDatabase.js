import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config();

console.log('🚀 INICIANDO SETUP DO BANCO...');

async function setupDatabase() {
    console.log('🔧 CONFIGURANDO BANCO DE DADOS...');
    console.log('📡 Conectando ao Neon.tech...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Conectado ao banco!');

        // CRIAR TABELAS
        console.log('\n📋 CRIANDO TABELAS...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                nome VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS produtos (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                categoria VARCHAR(50) NOT NULL,
                preco DECIMAL(10,2) NOT NULL,
                estoque INTEGER NOT NULL DEFAULT 0,
                descricao TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS fichas (
                id SERIAL PRIMARY KEY,
                numero VARCHAR(20) UNIQUE NOT NULL,
                data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total DECIMAL(10,2) NOT NULL,
                usuario_id INTEGER REFERENCES usuarios(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ficha_itens (
                id SERIAL PRIMARY KEY,
                ficha_id INTEGER REFERENCES fichas(id) ON DELETE CASCADE,
                produto_id INTEGER REFERENCES produtos(id),
                quantidade INTEGER NOT NULL,
                preco_unitario DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Tabelas criadas!');

        // CRIAR USUÁRIO ADMIN
        console.log('\n👤 CRIANDO USUÁRIO ADMIN...');
        
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await client.query(`
            INSERT INTO usuarios (username, password, nome) 
            VALUES ('admin', $1, 'Administrador')
            ON CONFLICT (username) DO NOTHING
        `, [hashedPassword]);
        
        console.log('✅ Usuário: admin / Senha: admin123');

        // INSERIR PRODUTOS
        console.log('\n🛒 INSERINDO PRODUTOS...');
        
        await client.query(`
            INSERT INTO produtos (nome, categoria, preco, estoque, descricao) VALUES 
            ('Café Expresso', 'Bebidas', 3.50, 100, 'Café expresso tradicional'),
            ('Cappuccino', 'Bebidas', 5.00, 80, 'Cappuccino cremoso'),
            ('Sanduíche Natural', 'Lanches', 12.00, 50, 'Sanduíche com frango e vegetais'),
            ('Misto Quente', 'Lanches', 8.00, 60, 'Pão de forma com queijo e presunto'),
            ('Suco de Laranja', 'Bebidas', 6.00, 120, 'Suco natural de laranja'),
            ('Água Mineral', 'Bebidas', 3.00, 200, 'Água mineral sem gás 500ml')
            ON CONFLICT DO NOTHING;
        `);
        
        console.log('✅ 6 produtos inseridos!');

        console.log('\n🎉 BANCO CONFIGURADO COM SUCESSO! 🎉');
        console.log('\n👉 Agora inicie o servidor: npm run dev');
        console.log('👉 Frontend: Abra frontend/index.html');
        console.log('👉 Login: admin / admin123');
        
    } catch (error) {
        console.error('❌ ERRO:', error.message);
    } finally {
        await client.end();
        console.log('\n🔌 Fim');
    }
}

// Chamar a função
setupDatabase();