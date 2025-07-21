const { Pool } = require('pg');
const fs = require('fs');

// Конфигурация базы данных
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

async function recreateDatabase() {
    const pool = new Pool(dbConfig);
    
    try {
        console.log('🔌 Подключение к PostgreSQL...');
        await pool.query('SELECT 1');
        console.log('✅ Подключение установлено');
        
        console.log('🗑️ Полная очистка базы данных...');
        
        // Удаляем все таблицы принудительно
        const dropQueries = [
            'DROP TABLE IF EXISTS websocket_data CASCADE',
            'DROP TABLE IF EXISTS tickers CASCADE',
            'DROP TABLE IF EXISTS candles CASCADE',
            'DROP TABLE IF EXISTS bybit_trade_aggregates_5m CASCADE',
            'DROP TABLE IF EXISTS collector_checkpoints CASCADE',
            'DROP TABLE IF EXISTS signals_10min CASCADE',
            'DROP TABLE IF EXISTS trading_pairs CASCADE',
            'DROP TABLE IF EXISTS tokens CASCADE',
            'DROP TABLE IF EXISTS exchanges CASCADE',
            'DROP TABLE IF EXISTS contract_types CASCADE',
            'DROP TABLE IF EXISTS intervals CASCADE'
        ];
        
        for (const query of dropQueries) {
            await pool.query(query);
            console.log(`✅ ${query}`);
        }
        
        console.log('📋 Создание новой схемы...');
        
        // Читаем и выполняем новую схему
        const schema = fs.readFileSync('new_database_schema.sql', 'utf8');
        await pool.query(schema);
        
        console.log('✅ Новая схема создана успешно!');
        
        // Проверяем созданные таблицы
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📊 Созданные таблицы:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
        // Проверяем торговые пары
        const pairs = await pool.query(`
            SELECT tp.pair_symbol, e.name as exchange, ct.name as contract_type
            FROM trading_pairs tp
            JOIN exchanges e ON tp.exchange_id = e.id
            JOIN contract_types ct ON tp.contract_type_id = ct.id
            WHERE tp.is_active = TRUE
            ORDER BY e.name, tp.pair_symbol
        `);
        
        console.log(`🎯 Торговые пары (${pairs.rows.length} шт.):`);
        pairs.rows.forEach(row => {
            console.log(`  - ${row.pair_symbol} (${row.exchange} ${row.contract_type})`);
        });
        
        console.log('🎉 База данных пересоздана успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await pool.end();
    }
}

recreateDatabase(); 