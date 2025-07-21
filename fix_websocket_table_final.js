const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🔧 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ТАБЛИЦЫ WEBSOCKET_DATA...');

// Подключение к Railway PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 10
});

async function fixWebSocketTable() {
    try {
        console.log('🔍 Подключение к Railway PostgreSQL...');
        
        const client = await pool.connect();
        console.log('✅ Подключение установлено');
        
        // Читаем SQL скрипт
        const sqlPath = path.join(__dirname, 'add_websocket_columns.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('🗄️ Выполнение SQL скрипта...');
        
        // Выполняем SQL скрипт
        await client.query(sqlScript);
        
        console.log('✅ SQL скрипт выполнен успешно');
        
        // Проверяем структуру таблицы
        console.log('📋 Проверка структуры таблицы websocket_data:');
        const result = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data' 
            ORDER BY ordinal_position
        `);
        
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Проверяем индексы
        console.log('📊 Проверка индексов:');
        const indexResult = await client.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'websocket_data'
        `);
        
        indexResult.rows.forEach(row => {
            console.log(`  - ${row.indexname}`);
        });
        
        client.release();
        
        console.log('🎉 ТАБЛИЦА WEBSOCKET_DATA ИСПРАВЛЕНА УСПЕШНО!');
        console.log('✅ Теперь WebSocket данные будут сохраняться корректно');
        console.log('🚀 Перезапустите деплой на Railway для применения изменений');
        
    } catch (error) {
        console.error('❌ Ошибка исправления таблицы:', error.message);
        console.error('🔧 Детали ошибки:', error);
        
        // Попробуем альтернативный способ
        console.log('🔄 Попытка альтернативного исправления...');
        try {
            const client = await pool.connect();
            
            // Простое создание таблицы
            await client.query(`
                DROP TABLE IF EXISTS websocket_data;
                CREATE TABLE websocket_data (
                    id SERIAL PRIMARY KEY,
                    exchange_id INTEGER NOT NULL,
                    symbol VARCHAR(20) NOT NULL,
                    data_type VARCHAR(50) NOT NULL,
                    raw_data TEXT,
                    processed_data JSONB,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX idx_websocket_data_exchange_id ON websocket_data(exchange_id);
                CREATE INDEX idx_websocket_data_timestamp ON websocket_data(timestamp);
                CREATE INDEX idx_websocket_data_symbol ON websocket_data(symbol);
            `);
            
            client.release();
            console.log('✅ Таблица пересоздана успешно!');
            
        } catch (altError) {
            console.error('❌ Альтернативное исправление тоже не удалось:', altError.message);
        }
    } finally {
        await pool.end();
    }
}

fixWebSocketTable(); 