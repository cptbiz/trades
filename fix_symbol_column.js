const { Pool } = require('pg');
const fs = require('fs');

console.log('🔧 ДОБАВЛЕНИЕ КОЛОНКИ SYMBOL В ТАБЛИЦУ WEBSOCKET_DATA...');

// Подключение к Railway PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 10
});

async function addSymbolColumn() {
    try {
        console.log('🔍 Подключение к Railway PostgreSQL...');
        
        const client = await pool.connect();
        console.log('✅ Подключение установлено');
        
        // Проверяем текущую структуру таблицы
        console.log('📋 Текущая структура таблицы websocket_data:');
        const structureResult = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data' 
            ORDER BY ordinal_position
        `);
        
        structureResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // Добавляем колонку symbol
        console.log('🔧 Добавление колонки symbol...');
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'websocket_data' AND column_name = 'symbol'
                ) THEN
                    ALTER TABLE websocket_data ADD COLUMN symbol VARCHAR(20);
                    RAISE NOTICE 'Колонка symbol добавлена в таблицу websocket_data';
                ELSE
                    RAISE NOTICE 'Колонка symbol уже существует';
                END IF;
            END $$;
        `);
        
        // Создаем индекс
        console.log('📊 Создание индекса для колонки symbol...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);');
        
        // Проверяем обновленную структуру
        console.log('📋 Обновленная структура таблицы websocket_data:');
        const updatedResult = await client.query(`
            SELECT 
                column_name, 
                data_type, 
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data' 
            ORDER BY ordinal_position
        `);
        
        updatedResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        client.release();
        
        console.log('🎉 КОЛОНКА SYMBOL ДОБАВЛЕНА УСПЕШНО!');
        console.log('✅ Теперь WebSocket данные будут сохраняться корректно');
        console.log('🚀 Ошибки с базой данных должны исчезнуть');
        
    } catch (error) {
        console.error('❌ Ошибка добавления колонки:', error.message);
        console.error('🔧 Детали ошибки:', error);
    } finally {
        await pool.end();
    }
}

addSymbolColumn(); 