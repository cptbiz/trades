const { Pool } = require('pg');
const fs = require('fs');

console.log('🚀 Инициализация базы данных на Railway...');

// Конфигурация для Railway
const ENV = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway',
    NODE_ENV: process.env.NODE_ENV || 'production',
    POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt',
    POSTGRES_DB: process.env.POSTGRES_DB || 'railway',
    PGHOST: process.env.PGHOST || 'postgres.railway.internal',
    PGPORT: process.env.PGPORT || '5432'
};

console.log('📋 Railway Configuration:');
console.log(`  - DATABASE_URL: ${ENV.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`  - POSTGRES_USER: ${ENV.POSTGRES_USER}`);
console.log(`  - POSTGRES_DB: ${ENV.POSTGRES_DB}`);
console.log(`  - PGHOST: ${ENV.PGHOST}`);

// Создание подключения к PostgreSQL
const pool = new Pool({
    connectionString: ENV.DATABASE_URL,
    ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

async function initDatabase() {
    try {
        console.log('🔍 Проверка подключения к Railway PostgreSQL...');
        
        // Тест подключения
        const client = await pool.connect();
        console.log('✅ Подключение к Railway PostgreSQL установлено');
        
        // Проверяем существующие таблицы
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log(`📊 Найдено таблиц: ${tablesResult.rows.length}`);
        tablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Читаем схему базы данных
        const schemaSQL = fs.readFileSync('./database_schema.sql', 'utf8');
        
        console.log('🗄️ Создание таблиц...');
        
        // Выполняем SQL схему
        await client.query(schemaSQL);
        
        console.log('✅ Таблицы созданы успешно');
        
        // Проверяем созданные таблицы
        const newTablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log(`📊 Всего таблиц после создания: ${newTablesResult.rows.length}`);
        newTablesResult.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Проверяем структуру таблицы websocket_data
        const columnsResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'websocket_data'
        `);
        
        console.log('📋 Структура таблицы websocket_data:');
        columnsResult.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type}`);
        });
        
        client.release();
        
        console.log('🎉 База данных Railway инициализирована успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error.message);
        console.error('🔧 Детали ошибки:', error);
    } finally {
        await pool.end();
    }
}

// Запуск инициализации
initDatabase(); 