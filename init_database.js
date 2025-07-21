const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Конфигурация базы данных через TCP прокси
const dbConfig = {
    host: 'turntable.proxy.rlwy.net',
    port: 37516,
    database: 'railway',
    user: 'postgres',
    password: 'pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt',
    ssl: {
        rejectUnauthorized: false
    }
};

// Создание пула соединений
const pool = new Pool(dbConfig);

async function initDatabase() {
    try {
        console.log('🔌 Подключение к PostgreSQL через TCP прокси...');
        
        // Проверка подключения
        const client = await pool.connect();
        console.log('✅ Подключение к базе данных установлено');
        
        // Чтение схемы из файла
        const schemaPath = path.join(__dirname, 'database_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📋 Создание таблиц...');
        
        // Выполнение SQL команд
        await client.query(schema);
        
        console.log('✅ Таблицы созданы успешно');
        
        // Проверка созданных таблиц
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📊 Созданные таблицы:');
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Проверка индексов
        const indexesResult = await client.query(`
            SELECT indexname, tablename 
            FROM pg_indexes 
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);
        
        console.log('🔍 Созданные индексы:');
        indexesResult.rows.forEach(row => {
            console.log(`  - ${row.indexname} (${row.tablename})`);
        });
        
        client.release();
        
        console.log('🎉 Инициализация базы данных завершена успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error.message);
        console.error('Детали:', error);
    } finally {
        await pool.end();
    }
}

// Запуск инициализации
initDatabase(); 