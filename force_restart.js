// Принудительный перезапуск приложения
console.log('🔄 Принудительный перезапуск приложения...');
console.log('📝 Проверка структуры таблицы websocket_data...');

const { Pool } = require('pg');

// Конфигурация базы данных
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkTableStructure() {
    try {
        console.log('🔍 Проверяем структуру таблицы websocket_data...');
        
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Структура таблицы websocket_data:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        const hasSymbolColumn = result.rows.some(row => row.column_name === 'symbol');
        const hasPairSymbolColumn = result.rows.some(row => row.column_name === 'pair_symbol');
        
        console.log(`\n✅ Результат проверки:`);
        console.log(`  - Колонка 'symbol': ${hasSymbolColumn ? 'ЕСТЬ' : 'НЕТ'}`);
        console.log(`  - Колонка 'pair_symbol': ${hasPairSymbolColumn ? 'ЕСТЬ' : 'НЕТ'}`);
        
        if (hasPairSymbolColumn && !hasSymbolColumn) {
            console.log('🔧 Добавляем колонку symbol...');
            await pool.query(`
                ALTER TABLE websocket_data ADD COLUMN symbol VARCHAR(20)
            `);
            console.log('✅ Колонка symbol добавлена');
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await pool.end();
    }
}

checkTableStructure(); 