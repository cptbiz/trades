const { Pool } = require('pg');

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

const pool = new Pool(dbConfig);

async function checkData() {
    try {
        console.log('🔍 Проверка данных в базе...\n');
        
        // Проверка свечей
        console.log('📊 Последние свечи:');
        const candlesResult = await pool.query(`
            SELECT symbol, exchange, timeframe, timestamp, close, volume 
            FROM candles 
            WHERE exchange = 'bybit' 
            ORDER BY timestamp DESC 
            LIMIT 10
        `);
        
        candlesResult.rows.forEach(row => {
            console.log(`  ${row.symbol} (${row.exchange}) ${row.timeframe}: ${row.close} @ ${row.timestamp}`);
        });
        
        console.log('\n📈 Последние данные OI:');
        const oiResult = await pool.query(`
            SELECT symbol, exchange, timestamp, open_interest, oi_change_pct 
            FROM open_interest 
            WHERE exchange = 'bybit' 
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        
        oiResult.rows.forEach(row => {
            console.log(`  ${row.symbol} (${row.exchange}): OI=${row.open_interest}, Change=${row.oi_change_pct}% @ ${row.timestamp}`);
        });
        
        console.log('\n📋 Статистика по биржам:');
        const statsResult = await pool.query(`
            SELECT exchange, COUNT(*) as count 
            FROM candles 
            GROUP BY exchange 
            ORDER BY count DESC
        `);
        
        statsResult.rows.forEach(row => {
            console.log(`  ${row.exchange}: ${row.count} записей`);
        });
        
        console.log('\n🎯 Проверка символов Bybit:');
        const bybitSymbolsResult = await pool.query(`
            SELECT DISTINCT symbol 
            FROM candles 
            WHERE exchange = 'bybit' 
            ORDER BY symbol
        `);
        
        bybitSymbolsResult.rows.forEach(row => {
            console.log(`  ${row.symbol}`);
        });
        
    } catch (error) {
        console.error('❌ Ошибка проверки данных:', error.message);
    } finally {
        await pool.end();
    }
}

checkData(); 