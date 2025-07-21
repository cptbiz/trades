const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Конфигурация подключения к Railway PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function initDatabase() {
    try {
        console.log('🗄️ Инициализация базы данных Railway...');
        console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
        
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL не установлен');
        }
        
        // Проверяем подключение
        await pool.query('SELECT 1');
        console.log('✅ Подключение к Railway PostgreSQL установлено');
        
        // Читаем SQL схему
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        // Выполняем SQL схему
        console.log('📝 Создание таблиц...');
        await pool.query(schemaSQL);
        
        // Проверяем созданные таблицы
        const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('trading_pairs', 'tickers', 'candles', 'websocket_data', 'intervals', 'signals')
            ORDER BY table_name
        `);
        
        console.log(`📊 Создано таблиц: ${tablesResult.rows.length}`);
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Проверяем данные
        const pairsCount = await pool.query('SELECT COUNT(*) as count FROM trading_pairs');
        const intervalsCount = await pool.query('SELECT COUNT(*) as count FROM intervals');
        
        console.log(`📈 Торговых пар: ${pairsCount.rows[0].count}`);
        console.log(`⏰ Интервалов: ${intervalsCount.rows[0].count}`);
        
        console.log('✅ База данных успешно инициализирована!');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации БД:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

// Запуск инициализации
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('🎉 Инициализация завершена успешно!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Ошибка инициализации:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase }; 