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

async function initNewDatabase() {
    try {
        console.log('🔌 Подключение к PostgreSQL через TCP прокси...');
        
        // Проверка подключения
        const client = await pool.connect();
        console.log('✅ Подключение к базе данных установлено');
        
        // Чтение схемы из файла
        const schemaPath = path.join(__dirname, 'new_database_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('🗑️ Удаление старых таблиц...');
        
        // Удаление старых таблиц
        const dropSchemaPath = path.join(__dirname, 'drop_old_tables.sql');
        const dropSchema = fs.readFileSync(dropSchemaPath, 'utf8');
        await client.query(dropSchema);
        
        console.log('📋 Создание новой схемы базы данных...');
        
        // Выполнение SQL команд
        await client.query(schema);
        
        console.log('✅ Новая схема создана успешно');
        
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
        
        // Проверка торговых пар
        const pairsResult = await client.query(`
            SELECT pair_symbol, exchange_id, contract_type_id, is_active 
            FROM trading_pairs 
            ORDER BY exchange_id, pair_symbol
        `);
        
        console.log('\n🎯 Торговые пары:');
        pairsResult.rows.forEach(row => {
            const exchange = row.exchange_id === 1 ? 'Binance' : 'Bybit';
            const type = row.contract_type_id === 1 ? 'Futures' : 'Spot';
            console.log(`  - ${row.pair_symbol} (${exchange} ${type})`);
        });
        
        // Проверка интервалов
        const intervalsResult = await client.query(`
            SELECT name FROM intervals ORDER BY name
        `);
        
        console.log('\n⏰ Интервалы:');
        intervalsResult.rows.forEach(row => {
            console.log(`  - ${row.name}`);
        });
        
        client.release();
        
        console.log('\n🎉 Новая схема базы данных инициализирована успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации новой схемы:', error.message);
        console.error('Детали:', error);
    } finally {
        await pool.end();
    }
}

// Запуск инициализации
initNewDatabase(); 