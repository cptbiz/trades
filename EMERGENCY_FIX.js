// ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ pair_symbol
console.log('🚨 ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ pair_symbol');

const { Pool } = require('pg');

// Конфигурация базы данных
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function emergencyFix() {
    try {
        console.log('🔍 Проверяем структуру таблицы websocket_data...');
        
        // 1. Проверяем текущую структуру
        const structure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Текущая структура:');
        structure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        // 2. Делаем pair_symbol nullable
        console.log('🔧 Делаем pair_symbol nullable...');
        await pool.query(`
            ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL
        `);
        console.log('✅ pair_symbol теперь nullable');
        
        // 3. Добавляем колонку symbol если её нет
        const hasSymbol = structure.rows.some(row => row.column_name === 'symbol');
        if (!hasSymbol) {
            console.log('🔧 Добавляем колонку symbol...');
            await pool.query(`
                ALTER TABLE websocket_data ADD COLUMN symbol VARCHAR(20)
            `);
            console.log('✅ Колонка symbol добавлена');
        } else {
            console.log('✅ Колонка symbol уже существует');
        }
        
        // 4. Проверяем финальную структуру
        const finalStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data' 
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Финальная структура:');
        finalStructure.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
        });
        
        console.log('✅ ЭКСТРЕННОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await pool.end();
    }
}

emergencyFix(); 