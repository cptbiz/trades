const { Pool } = require('pg');

console.log('🔧 Создание таблицы websocket_data на Railway...');

// Подключение к Railway PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway',
    ssl: { rejectUnauthorized: false }
});

async function createWebSocketTable() {
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
        
        console.log('✅ Таблица websocket_data создана');
        
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
        
        console.log('🎉 Таблица websocket_data создана успешно!');
        console.log('✅ Теперь WebSocket данные будут сохраняться корректно');
        
    } catch (error) {
        console.error('❌ Ошибка создания таблицы:', error.message);
    } finally {
        await pool.end();
    }
}

createWebSocketTable(); 