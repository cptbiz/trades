const { Pool } = require('pg');

console.log('🔧 Исправление таблицы websocket_data на Railway...');

// Конфигурация Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway',
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function fixWebSocketTable() {
    try {
        console.log('🔍 Подключение к Railway PostgreSQL...');
        
        const client = await pool.connect();
        console.log('✅ Подключение установлено');
        
        // Создание таблицы websocket_data
        console.log('🗄️ Создание таблицы websocket_data...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS websocket_data (
                id SERIAL PRIMARY KEY,
                exchange_id INTEGER NOT NULL,
                symbol VARCHAR(20) NOT NULL,
                data_type VARCHAR(50) NOT NULL,
                raw_data TEXT,
                processed_data JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Создание индексов
        console.log('📊 Создание индексов...');
        
        await client.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);');
        
        // Проверка таблицы
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data'
        `);
        
        console.log('📋 Структура таблицы websocket_data:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
        
        client.release();
        
        console.log('🎉 Таблица websocket_data исправлена успешно!');
        console.log('✅ Теперь WebSocket данные будут сохраняться корректно');
        
    } catch (error) {
        console.error('❌ Ошибка исправления таблицы:', error.message);
    } finally {
        await pool.end();
    }
}

fixWebSocketTable(); 