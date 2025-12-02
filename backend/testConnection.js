import dotenv from 'dotenv';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config();

async function testConnection() {
    console.log('🔍 Testando conexão com o banco...');
    console.log('URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ CONECTADO COM SUCESSO!');
        
        // Testar consulta simples
        const result = await client.query('SELECT NOW() as current_time');
        console.log('⏰ Hora do banco:', result.rows[0].current_time);
        
        // Verificar se tabelas existem
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('📊 Tabelas existentes:', tables.rows.map(r => r.table_name));
        
    } catch (error) {
        console.error('❌ ERRO DE CONEXÃO:', error.message);
        console.error('Dica: Verifique se a senha no .env está correta!');
    } finally {
        await client.end();
    }
}

testConnection();