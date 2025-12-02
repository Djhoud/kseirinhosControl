import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
        require: true
    }
});

// Testar conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao banco de dados Neon.tech com SSL');
});

pool.on('error', (err) => {
    console.error('❌ Erro na conexão com o banco:', err);
});

export default pool;