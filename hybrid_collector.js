const WebSocket = require('ws');
const { Pool } = require('pg');
const express = require('express');
const axios = require('axios');

console.log('🚀 Starting Hybrid Data Collector (WebSocket + REST API)...');
console.log('🔄 Railway deployment update - ' + new Date().toISOString());
console.log('🔧 FIXING RAILWAY VARIABLES - ' + new Date().toISOString());

// ==================== ENVIRONMENT VARIABLES ====================
const ENV = {
    // Database - Railway PostgreSQL с правильными переменными
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway',
    NODE_ENV: process.env.NODE_ENV || 'production',
    
    // Server - Railway defaults
    PORT: process.env.PORT || 8082,
    IP: process.env.IP || '0.0.0.0',
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // WebSocket Configuration
    WS_RECONNECT_INTERVAL: parseInt(process.env.WS_RECONNECT_INTERVAL) || 5000,
    WS_PING_INTERVAL: parseInt(process.env.WS_PING_INTERVAL) || 20000,
    
    // API Configuration
    API_RATE_LIMIT: parseInt(process.env.API_RATE_LIMIT) || 100,
    API_TIMEOUT: parseInt(process.env.API_TIMEOUT) || 30000,
    
    // Railway Specific - правильные переменные
    RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
    RAILWAY_PRIVATE_DOMAIN: process.env.RAILWAY_PRIVATE_DOMAIN,
    RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME,
    RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
    
    // PostgreSQL Railway переменные
    POSTGRES_USER: process.env.POSTGRES_USER || 'postgres',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt',
    POSTGRES_DB: process.env.POSTGRES_DB || 'railway',
    PGHOST: process.env.PGHOST || 'postgres.railway.internal',
    PGPORT: process.env.PGPORT || '5432'
};

// Принудительная проверка Railway переменных
if (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_PRIVATE_DOMAIN) {
    console.log('🚂 Railway Environment Detected!');
    ENV.NODE_ENV = 'production';
    ENV.PORT = process.env.PORT || 8082;
    
    // ПРИНУДИТЕЛЬНО используем Railway DATABASE_URL или строим из переменных
    if (process.env.DATABASE_URL) {
        ENV.DATABASE_URL = process.env.DATABASE_URL;
        console.log('✅ Railway PostgreSQL URL detected');
        console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL.substring(0, 50)}...`);
    } else if (process.env.POSTGRES_USER && process.env.POSTGRES_PASSWORD && process.env.RAILWAY_PRIVATE_DOMAIN) {
        // Строим DATABASE_URL из Railway переменных
        ENV.DATABASE_URL = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.RAILWAY_PRIVATE_DOMAIN}:5432/${process.env.POSTGRES_DB || 'railway'}`;
        console.log('✅ Railway PostgreSQL URL built from variables');
        console.log(`🔗 DATABASE_URL: ${ENV.DATABASE_URL.substring(0, 50)}...`);
    } else {
        console.log('❌ ERROR: DATABASE_URL not found in Railway');
        console.log('🔧 Using fallback Railway PostgreSQL URL');
        ENV.DATABASE_URL = 'postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway';
    }
    
    // Проверяем, что это правильный Railway URL
    if (ENV.DATABASE_URL.includes('railway.internal') || ENV.DATABASE_URL.includes('railway')) {
        console.log('✅ Railway PostgreSQL URL confirmed');
    } else {
        console.log('⚠️  Warning: DATABASE_URL may not be Railway PostgreSQL');
    }
}

console.log('📋 Environment Configuration:');
console.log(`  - NODE_ENV: ${ENV.NODE_ENV}`);
console.log(`  - PORT: ${ENV.PORT}`);
console.log(`  - DATABASE_URL: ${ENV.DATABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`  - RAILWAY_DOMAIN: ${ENV.RAILWAY_PUBLIC_DOMAIN || 'NOT SET'}`);
console.log(`  - POSTGRES_USER: ${ENV.POSTGRES_USER}`);
console.log(`  - POSTGRES_DB: ${ENV.POSTGRES_DB}`);
console.log(`  - PGHOST: ${ENV.PGHOST}`);

// ==================== DATABASE CONFIGURATION ====================
const pool = new Pool({
    connectionString: ENV.DATABASE_URL,
    ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Railway PostgreSQL specific settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Список торговых пар для Binance (все поддерживаемые)
const binancePairs = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT',
    'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LTCUSDT',
    'LINKUSDT', 'BCHUSDT', 'ETCUSDT', 'UNIUSDT', 'OPUSDT',
    'ARBUSDT', 'APTUSDT', 'SUIUSDT', 'FILUSDT'
];

// Пары только для Bybit (проверенные)
const bybitPairs = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT',
    'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'LTCUSDT',
    'LINKUSDT', 'BCHUSDT', 'ETCUSDT', 'UNIUSDT', 'OPUSDT',
    'ARBUSDT', 'APTUSDT', 'SUIUSDT', 'FILUSDT'
];

// Общий список для Coinbase (все пары)
const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT',
    'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT', 'LTCUSDT',
    'LINKUSDT', 'BCHUSDT', 'ETCUSDT', 'UNIUSDT', 'OPUSDT',
    'ARBUSDT', 'APTUSDT', 'SUIUSDT', 'SHIBUSDT', 'FILUSDT'
];

// WebSocket соединения
let coinbaseWS = null;
let binanceWS = null;
let bybitWS = null;

// Кэш данных
const dataCache = {
    tickers: new Map(),
    candles: new Map()
};

class HybridCollector {
    constructor() {
        this.isRunning = false;
        this.pool = pool;
    }

    getDatabaseUrl() {
        // 1. Прямо из переменной
        let url = process.env.DATABASE_URL;
        if (url && !url.includes('${{') && url !== '') {
            console.log('[DB] Использую DATABASE_URL:', url);
            return url;
        }
        // 2. PUBLIC_URL
        if (process.env.DATABASE_PUBLIC_URL && !process.env.DATABASE_PUBLIC_URL.includes('${{')) {
            console.log('[DB] Использую DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL);
            return process.env.DATABASE_PUBLIC_URL;
        }
        // 3. Явно собираем из приватных переменных Railway
        const pgUser = process.env.PGUSER || process.env.POSTGRES_USER || 'postgres';
        const pgPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '';
        const pgDatabase = process.env.PGDATABASE || process.env.POSTGRES_DB || 'railway';
        const privateHost = process.env.RAILWAY_PRIVATE_DOMAIN || process.env.PGHOST || 'postgres-production-5ded.up.railway.app';
        const proxyHost = process.env.RAILWAY_TCP_PROXY_DOMAIN || 'trolley.proxy.rlwy.net';
        const proxyPort = process.env.RAILWAY_TCP_PROXY_PORT || '30676';
        // Если есть приватный домен
        if (privateHost) {
            const privateUrl = `postgresql://${pgUser}:${pgPassword}@${privateHost}:5432/${pgDatabase}`;
            console.log('[DB] Использую приватный Railway домен:', privateUrl);
            return privateUrl;
        }
        // Если есть публичный proxy
        if (proxyHost && proxyPort) {
            const proxyUrl = `postgresql://${pgUser}:${pgPassword}@${proxyHost}:${proxyPort}/${pgDatabase}`;
            console.log('[DB] Использую публичный Railway proxy:', proxyUrl);
            return proxyUrl;
        }
        // 4. Альтернативные переменные
        if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
        if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
        if (process.env.PG_URL) return process.env.PG_URL;
        // 5. Не найдено — выводим ошибку
        throw new Error('DATABASE_URL не установлен и не найден ни в одной альтернативной переменной. Проверьте Railway Variables!');
    }

    logAllEnvVars() {
        // Для отладки — выводим все важные переменные
        const keys = [
            'DATABASE_PUBLIC_URL', 'DATABASE_URL', 'PGDATA', 'PGDATABASE', 'PGHOST', 'PGPASSWORD', 'PGPORT', 'PGUSER',
            'POSTGRES_DB', 'POSTGRES_PASSWORD', 'POSTGRES_USER', 'RAILWAY_DEPLOYMENT_DRAINING_SECONDS', 'SSL_CERT_DAYS',
            'RAILWAY_PRIVATE_DOMAIN', 'RAILWAY_TCP_PROXY_DOMAIN', 'RAILWAY_TCP_PROXY_PORT', 'NODE_ENV', 'PORT', 'RAILWAY_DOMAIN'
        ];
        console.log('=== ENVIRONMENT VARIABLES ===');
        keys.forEach(key => {
            console.log(`  - ${key}:`, process.env[key] || 'NOT SET');
        });
        console.log('============================');
    }

    async initDatabase() {
        try {
            this.logAllEnvVars();
            // Получаем URL
            const dbUrl = this.getDatabaseUrl();
            console.log('  - DATABASE_URL (used):', dbUrl ? dbUrl : 'NOT SET');
            // Ждем немного перед подключением
            console.log('⏳ Ожидание готовности PostgreSQL...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('🚂 Подключение к Railway PostgreSQL...');
            this.pool = new Pool({
                connectionString: dbUrl,
                ssl: dbUrl.includes('railway') || dbUrl.includes('proxy') ? { rejectUnauthorized: false } : false,
                connectionTimeoutMillis: 30000,
                idleTimeoutMillis: 30000,
                max: 20,
                retryDelay: 1000,
                maxRetries: 5
            });
            const client = await this.pool.connect();
            console.log('✅ Подключение к базе данных успешно');
            client.release();
            await this.initializeDatabase();
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error.message);
            console.log('🔧 Убедитесь, что все переменные Railway установлены правильно!');
            // Повторная попытка через 10 секунд
            console.log('🔄 Повторная попытка через 10 секунд...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            try {
                const dbUrl = this.getDatabaseUrl();
                console.log('🚂 Повторное подключение к Railway PostgreSQL...');
                this.pool = new Pool({
                    connectionString: dbUrl,
                    ssl: dbUrl.includes('railway') || dbUrl.includes('proxy') ? { rejectUnauthorized: false } : false,
                    connectionTimeoutMillis: 30000,
                    idleTimeoutMillis: 30000,
                    max: 20
                });
                const client = await this.pool.connect();
                console.log('✅ Повторное подключение успешно');
                client.release();
                await this.initializeDatabase();
            } catch (retryError) {
                console.error('❌ Повторная попытка не удалась:', retryError.message);
                throw new Error('Не удалось подключиться к базе данных после повторных попыток');
            }
        }
    }

    // Инициализация базы данных при первом запуске
    async initializeDatabase() {
        try {
            console.log('🗄️ Инициализация базы данных...');
            
            // Проверяем, есть ли таблицы
            const tablesResult = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'trading_pairs'
            `);
            
            if (tablesResult.rows.length === 0) {
                console.log('📝 Создание таблиц...');
                // Здесь можно добавить создание таблиц, если нужно
                console.log('⚠️ Таблицы не найдены. Убедитесь, что база данных инициализирована.');
            } else {
                console.log('✅ Таблицы найдены');
            }
            
            // АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ТАБЛИЦЫ WEBSOCKET_DATA
            console.log('🔧 Проверка таблицы websocket_data...');
            try {
                // Проверяем существование таблицы websocket_data
                const websocketTableResult = await this.pool.query(`
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'websocket_data'
                `);
                
                if (websocketTableResult.rows.length === 0) {
                    console.log('📝 Создание таблицы websocket_data...');
                    await this.pool.query(`
                        CREATE TABLE websocket_data (
                            id SERIAL PRIMARY KEY,
                            exchange_id INTEGER NOT NULL,
                            symbol VARCHAR(20) NOT NULL,
                            data_type VARCHAR(50) NOT NULL,
                            raw_data TEXT,
                            processed_data JSONB,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `);
                    console.log('✅ Таблица websocket_data создана');
                } else {
                    console.log('✅ Таблица websocket_data существует');
                    
                    // Проверяем структуру существующей таблицы
                    const tableStructure = await this.pool.query(`
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns 
                        WHERE table_name = 'websocket_data' 
                        ORDER BY ordinal_position
                    `);
                    
                    console.log('📋 Структура таблицы websocket_data:');
                    tableStructure.rows.forEach(row => {
                        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
                    });
                    
                    // Проверяем колонку symbol
                    const symbolColumnResult = await this.pool.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'websocket_data' 
                        AND column_name = 'symbol'
                    `);
                    
                    if (symbolColumnResult.rows.length === 0) {
                        console.log('🔧 Добавление колонки symbol в websocket_data...');
                        try {
                            await this.pool.query(`
                                ALTER TABLE websocket_data ADD COLUMN symbol VARCHAR(20)
                            `);
                            console.log('✅ Колонка symbol добавлена');
                        } catch (error) {
                            console.log('⚠️  Не удалось добавить колонку symbol:', error.message);
                        }
                    } else {
                        console.log('✅ Колонка symbol существует');
                    }
                }
                
                // Создаем индексы
                console.log('📊 Создание индексов для websocket_data...');
                await this.pool.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id)');
                await this.pool.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp)');
                await this.pool.query('CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol)');
                console.log('✅ Индексы созданы');
                
            } catch (error) {
                console.error('❌ Ошибка создания таблицы websocket_data:', error.message);
            }
            
        } catch (error) {
            console.error('❌ Ошибка инициализации БД:', error.message);
        }
    }

    // Получение ID торговой пары
    async getTradingPairId(pairSymbol, exchangeId) {
        try {
            const result = await this.pool.query(
                'SELECT id FROM trading_pairs WHERE pair_symbol = $1 AND exchange_id = $2 AND is_active = TRUE',
                [pairSymbol, exchangeId]
            );
            return result.rows[0]?.id || null;
        } catch (error) {
            console.error('❌ Ошибка получения ID торговой пары:', error.message);
            return null;
        }
    }

    // Сохранение тикера
    async saveTicker(tradingPairId, tickerData) {
        try {
            const query = `
                INSERT INTO tickers (trading_pair_id, price, price_change, volume, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            `;
            
            await this.pool.query(query, [
                tradingPairId,
                tickerData.price,
                tickerData.priceChange || 0,
                tickerData.volume || 0,
                tickerData.timestamp
            ]);
        } catch (error) {
            console.error('❌ Ошибка сохранения тикера:', error.message);
        }
    }

    // Сохранение свечи
    async saveCandle(tradingPairId, intervalId, candleData) {
        try {
            const query = `
                INSERT INTO candles (
                    trading_pair_id, interval_id, open_time, open_price, high_price, 
                    low_price, close_price, volume, quote_asset_volume, number_of_trades,
                    taker_buy_base_asset_volume, taker_buy_quote_asset_volume, 
                    is_closed, last_updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (trading_pair_id, interval_id, open_time) 
                DO UPDATE SET
                    high_price = GREATEST(candles.high_price, EXCLUDED.high_price),
                    low_price = LEAST(candles.low_price, EXCLUDED.low_price),
                    close_price = EXCLUDED.close_price,
                    volume = candles.volume + EXCLUDED.volume,
                    quote_asset_volume = candles.quote_asset_volume + EXCLUDED.quote_asset_volume,
                    number_of_trades = candles.number_of_trades + EXCLUDED.number_of_trades,
                    taker_buy_base_asset_volume = candles.taker_buy_base_asset_volume + EXCLUDED.taker_buy_base_asset_volume,
                    taker_buy_quote_asset_volume = candles.taker_buy_quote_asset_volume + EXCLUDED.taker_buy_quote_asset_volume,
                    is_closed = EXCLUDED.is_closed,
                    last_updated_at = EXCLUDED.last_updated_at
            `;
            
            await this.pool.query(query, [
                tradingPairId,
                intervalId,
                candleData.openTime,
                candleData.openPrice,
                candleData.highPrice,
                candleData.lowPrice,
                candleData.closePrice,
                candleData.volume,
                candleData.quoteAssetVolume,
                candleData.numberOfTrades,
                candleData.takerBuyBaseAssetVolume,
                candleData.takerBuyQuoteAssetVolume,
                candleData.isClosed,
                candleData.lastUpdatedAt
            ]);
        } catch (error) {
            console.error('❌ Ошибка сохранения свечи:', error.message);
        }
    }

    // Сохранение WebSocket данных
    async saveWebSocketData(exchangeId, symbol, dataType, rawData, processedData = null) {
        // ВРЕМЕННО ОТКЛЮЧЕНО - исправляем структуру таблицы
        // console.log(`📝 WebSocket данные (${dataType}): ${symbol} - временно не сохраняются`);
        // return;
        
        try {
            // Проверяем структуру таблицы websocket_data
            const tableStructure = await this.pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'websocket_data' 
                ORDER BY ordinal_position
            `);
            
            const hasSymbolColumn = tableStructure.rows.some(row => row.column_name === 'symbol');
            const hasPairSymbolColumn = tableStructure.rows.some(row => row.column_name === 'pair_symbol');
            
            let query;
            let params;
            
            if (hasSymbolColumn) {
                // Используем колонку symbol
                query = `
                    INSERT INTO websocket_data (exchange_id, symbol, data_type, raw_data, processed_data, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                params = [exchangeId, symbol, dataType, JSON.stringify(rawData), processedData ? JSON.stringify(processedData) : null, new Date()];
            } else if (hasPairSymbolColumn) {
                // Используем колонку pair_symbol
                query = `
                    INSERT INTO websocket_data (exchange_id, pair_symbol, data_type, raw_data, processed_data, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `;
                params = [exchangeId, symbol, dataType, JSON.stringify(rawData), processedData ? JSON.stringify(processedData) : null, new Date()];
            } else {
                // Fallback - используем только exchange_id и data_type
                query = `
                    INSERT INTO websocket_data (exchange_id, data_type, raw_data, processed_data, timestamp)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                params = [exchangeId, dataType, JSON.stringify(rawData), processedData ? JSON.stringify(processedData) : null, new Date()];
            }
            
            await this.pool.query(query, params);
        } catch (error) {
            // Если ошибка связана с pair_symbol, пытаемся исправить структуру таблицы
            if (error.message.includes('pair_symbol') && error.message.includes('not-null constraint')) {
                console.log('🔧 Автоматическое исправление структуры таблицы...');
                try {
                    // Делаем pair_symbol nullable
                    await this.pool.query(`
                        ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL
                    `);
                    console.log('✅ pair_symbol сделан nullable');
                    
                    // Повторяем попытку сохранения
                    const retryQuery = `
                        INSERT INTO websocket_data (exchange_id, pair_symbol, data_type, raw_data, processed_data, timestamp)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `;
                    await this.pool.query(retryQuery, [
                        exchangeId, symbol, dataType, JSON.stringify(rawData), 
                        processedData ? JSON.stringify(processedData) : null, new Date()
                    ]);
                    console.log('✅ Данные сохранены после исправления');
                } catch (fixError) {
                    console.error('❌ Не удалось исправить структуру таблицы:', fixError.message);
                }
            } else {
                console.error('❌ Ошибка сохранения WebSocket данных:', error.message);
            }
        }
    }

    // Получение ID интервала
    async getIntervalId(intervalName) {
        try {
            const result = await this.pool.query(
                'SELECT id FROM intervals WHERE name = $1',
                [intervalName]
            );
            return result.rows[0]?.id || null;
        } catch (error) {
            console.error('❌ Ошибка получения ID интервала:', error.message);
            return null;
        }
    }

    // ==================== BINANCE WEBSOCKET ====================
    
    initializeBinanceWS() {
        try {
            // Создаем combined stream для всех пар
            const streams = [];
            
            // Добавляем ticker streams для всех пар Binance
            binancePairs.forEach(symbol => {
                streams.push(`${symbol.toLowerCase()}@ticker`);
                streams.push(`${symbol.toLowerCase()}@kline_1m`);
            });
            
            const wsUrl = `wss://fstream.binance.com/stream?streams=${streams.join('/')}`;
            binanceWS = new WebSocket(wsUrl);
            
            binanceWS.on('open', () => {
                console.log('✅ Binance Futures WebSocket подключен');
                console.log(`📊 Подписка на ${binancePairs.length} пар Binance (WebSocket)`);
            });
            
            binanceWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleBinanceMessage(message);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения Binance:', error);
                }
            });
            
            binanceWS.on('error', (error) => {
                console.error('❌ Ошибка Binance WebSocket:', error);
                setTimeout(() => this.initializeBinanceWS(), 5000);
            });
            
            binanceWS.on('close', () => {
                console.log('🔌 Binance WebSocket отключен, переподключение...');
                setTimeout(() => this.initializeBinanceWS(), 5000);
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Binance WebSocket:', error);
        }
    }

    // Обработка сообщений Binance
    async handleBinanceMessage(message) {
        try {
            if (message.data) {
                const data = message.data;
                
                if (data.e === '24hrTicker') {
                    // Обработка тикера
                    const tradingPairId = await this.getTradingPairId(data.s, 1);
                    if (tradingPairId) {
                        const tickerData = {
                            price: parseFloat(data.c),
                            priceChange: parseFloat(data.p),
                            volume: parseFloat(data.v),
                            timestamp: Date.now()
                        };
                        
                        await this.saveTicker(tradingPairId, tickerData);
                    }
                    
                    // Сохраняем WebSocket данные
                    await this.saveWebSocketData(1, data.s, 'ticker', data, {
                        price: parseFloat(data.c),
                        priceChange: parseFloat(data.p),
                        volume: parseFloat(data.v)
                    });
                    
                    // Обновляем кэш
                    dataCache.tickers.set(data.s, {
                        symbol: data.s,
                        price: parseFloat(data.c),
                        priceChange: parseFloat(data.p),
                        priceChangePercent: parseFloat(data.P),
                        volume: parseFloat(data.v),
                        timestamp: Date.now(),
                        source: 'binance_ws'
                    });
                    
                    console.log(`✅ Binance WS ${data.s}: $${data.c}`);
                    
                } else if (data.e === 'kline') {
                    // Обработка свечей
                    const k = data.k;
                    const tradingPairId = await this.getTradingPairId(k.s, 1);
                    const intervalId = await this.getIntervalId('1m');
                    
                    if (tradingPairId && intervalId) {
                        const candleData = {
                            openTime: k.t,
                            openPrice: parseFloat(k.o),
                            highPrice: parseFloat(k.h),
                            lowPrice: parseFloat(k.l),
                            closePrice: parseFloat(k.c),
                            volume: parseFloat(k.v),
                            quoteAssetVolume: parseFloat(k.q),
                            numberOfTrades: k.n,
                            takerBuyBaseAssetVolume: parseFloat(k.V),
                            takerBuyQuoteAssetVolume: parseFloat(k.Q),
                            isClosed: k.x,
                            lastUpdatedAt: Date.now()
                        };
                        
                        await this.saveCandle(tradingPairId, intervalId, candleData);
                    }
                    
                    // Сохраняем WebSocket данные
                    await this.saveWebSocketData(1, k.s, 'candle', data, {
                        openTime: k.t,
                        openPrice: parseFloat(k.o),
                        highPrice: parseFloat(k.h),
                        lowPrice: parseFloat(k.l),
                        closePrice: parseFloat(k.c),
                        volume: parseFloat(k.v),
                        isClosed: k.x
                    });
                    
                    console.log(`✅ Binance WS свеча ${k.s}: $${k.c}`);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения Binance:', error);
        }
    }

    // ==================== COINBASE WEBSOCKET ====================
    
    initializeCoinbaseWS() {
        try {
            coinbaseWS = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            
            coinbaseWS.on('open', () => {
                console.log('✅ Coinbase WebSocket подключен');
                
                const coinbasePairs = tradingPairs.map(symbol => {
                    return symbol.replace('USDT', '-USD');
                });
                
                const subscribeMsg = {
                    type: 'subscribe',
                    product_ids: coinbasePairs,
                    channels: ['ticker']
                };
                
                coinbaseWS.send(JSON.stringify(subscribeMsg));
                console.log(`📊 Подписка на ${coinbasePairs.length} пар Coinbase (WebSocket)`);
            });
            
            coinbaseWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleCoinbaseMessage(message);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения Coinbase:', error);
                }
            });
            
            coinbaseWS.on('error', (error) => {
                console.error('❌ Ошибка Coinbase WebSocket:', error);
                setTimeout(() => this.initializeCoinbaseWS(), 5000);
            });
            
            coinbaseWS.on('close', () => {
                console.log('🔌 Coinbase WebSocket отключен, переподключение...');
                setTimeout(() => this.initializeCoinbaseWS(), 5000);
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Coinbase WebSocket:', error);
        }
    }

    // Обработка сообщений Coinbase
    async handleCoinbaseMessage(message) {
        try {
            if (message.type === 'ticker') {
                const pairSymbol = message.product_id;
                if (pairSymbol) {
                    // Получаем ID торговой пары и сохраняем тикер
                    const tradingPairId = await this.getTradingPairId(pairSymbol, 3);
                    if (tradingPairId) {
                        const tickerData = {
                            price: parseFloat(message.price),
                            priceChange: parseFloat(message.open_24h ? (message.price - message.open_24h) : 0),
                            volume: parseFloat(message.volume_24h || 0),
                            timestamp: Date.now()
                        };
                        
                        await this.saveTicker(tradingPairId, tickerData);
                    }
                    
                    // Сохраняем WebSocket данные
                    await this.saveWebSocketData(3, pairSymbol, 'ticker', message, {
                        price: parseFloat(message.price),
                        priceChange: parseFloat(message.open_24h ? (message.price - message.open_24h) : 0),
                        volume: parseFloat(message.volume_24h || 0)
                    });
                    
                    // Конвертируем для кэша
                    const usdtSymbol = pairSymbol.replace('-USD', 'USDT');
                    
                    dataCache.tickers.set(usdtSymbol, {
                        symbol: usdtSymbol,
                        price: parseFloat(message.price),
                        priceChange: parseFloat(message.open_24h ? (message.price - message.open_24h) : 0),
                        volume: parseFloat(message.volume_24h || 0),
                        timestamp: Date.now(),
                        source: 'coinbase_ws'
                    });
                    
                    console.log(`✅ Coinbase WS ${usdtSymbol}: $${message.price}`);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения Coinbase:', error);
        }
    }



    // ==================== BYBIT WEBSOCKET ====================
    
    initializeBybitWS() {
        try {
            bybitWS = new WebSocket('wss://stream.bybit.com/v5/public/linear');
            
            bybitWS.on('open', () => {
                console.log('✅ Bybit V5 WebSocket подключен');
                
                // Подписываемся на тикеры и kline отдельно (используем проверенные пары)
                const tickerArgs = [];
                const klineArgs = [];
                
                bybitPairs.forEach(symbol => {
                    tickerArgs.push(`tickers.${symbol}`);
                    klineArgs.push(`kline.1.${symbol}`);
                });
                
                // Подписка на тикеры
                const tickerSubscribeMsg = {
                    op: 'subscribe',
                    args: tickerArgs
                };
                
                // Подписка на kline
                const klineSubscribeMsg = {
                    op: 'subscribe', 
                    args: klineArgs
                };
                
                bybitWS.send(JSON.stringify(tickerSubscribeMsg));
                console.log(`📊 Подписка на ${bybitPairs.length} тикеров Bybit`);
                
                setTimeout(() => {
                    bybitWS.send(JSON.stringify(klineSubscribeMsg));
                    console.log(`📊 Подписка на ${bybitPairs.length} свечей Bybit`);
                }, 1000);
                
                // Отправляем ping для поддержания соединения
                setInterval(() => {
                    if (bybitWS && bybitWS.readyState === WebSocket.OPEN) {
                        bybitWS.send(JSON.stringify({op: 'ping'}));
                    }
                }, 20000);
            });
            
            bybitWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleBybitMessage(message);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения Bybit:', error);
                }
            });
            
            bybitWS.on('error', (error) => {
                console.error('❌ Ошибка Bybit WebSocket:', error);
                setTimeout(() => this.initializeBybitWS(), 5000);
            });
            
            bybitWS.on('close', () => {
                console.log('🔌 Bybit WebSocket отключен, переподключение...');
                setTimeout(() => this.initializeBybitWS(), 5000);
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Bybit WebSocket:', error);
        }
    }

    // Обработка сообщений Bybit
    async handleBybitMessage(message) {
        try {
            // Обработка ответов на команды (подписки, ping/pong)
            if (message.op) {
                if (message.op === 'subscribe') {
                    console.log('✅ Bybit подписка подтверждена:', message.success ? 'успешно' : 'ошибка');
                    if (!message.success) {
                        console.log('❌ Ошибка подписки Bybit:', message.ret_msg);
                    }
                    return;
                } else if (message.op === 'pong') {
                    // Игнорируем pong ответы
                    return;
                }
            }
            
            // Обработка данных
            if (message.topic && message.data) {
                if (message.topic.startsWith('tickers.')) {
                    // Обработка тикера
                    const symbol = message.topic.split('.')[1];
                    const data = message.data;
                    
                    const tradingPairId = await this.getTradingPairId(symbol, 2);
                    if (tradingPairId) {
                        const price = parseFloat(data.lastPrice);
                        const priceChange = parseFloat(data.price24hPcnt || 0) * price;
                        const volume = parseFloat(data.volume24h || 0);
                        
                        if (!isNaN(price) && price > 0) {
                            const tickerData = {
                                price: price,
                                priceChange: priceChange,
                                volume: volume,
                                timestamp: Date.now()
                            };
                            
                            await this.saveTicker(tradingPairId, tickerData);
                        }
                    }
                    
                    // Сохраняем WebSocket данные
                    const price = parseFloat(data.lastPrice);
                    const priceChange = parseFloat(data.price24hPcnt || 0) * price;
                    const volume = parseFloat(data.volume24h || 0);
                    
                    await this.saveWebSocketData(2, symbol, 'ticker', message, {
                        price: price,
                        priceChange: priceChange,
                        volume: volume
                    });
                    
                    // Обновляем кэш только если данные валидны
                    if (!isNaN(price) && price > 0) {
                        dataCache.tickers.set(symbol, {
                            symbol: symbol,
                            price: price,
                            priceChange: priceChange,
                            volume: volume,
                            timestamp: Date.now(),
                            source: 'bybit_ws'
                        });
                        
                        console.log(`✅ Bybit WS ${symbol}: $${price}`);
                    }
                    
                } else if (message.topic.startsWith('kline.')) {
                    // Обработка свечей
                    const parts = message.topic.split('.');
                    const symbol = parts[2];
                    const data = message.data[0];
                    
                    const tradingPairId = await this.getTradingPairId(symbol, 2);
                    const intervalId = await this.getIntervalId('1m');
                    
                    if (tradingPairId && intervalId) {
                        const openPrice = parseFloat(data.open);
                        const highPrice = parseFloat(data.high);
                        const lowPrice = parseFloat(data.low);
                        const closePrice = parseFloat(data.close);
                        const volume = parseFloat(data.volume);
                        const quoteAssetVolume = parseFloat(data.turnOver);
                        
                        if (!isNaN(openPrice) && !isNaN(closePrice) && openPrice > 0 && closePrice > 0) {
                            const candleData = {
                                openTime: data.start,
                                openPrice: openPrice,
                                highPrice: highPrice,
                                lowPrice: lowPrice,
                                closePrice: closePrice,
                                volume: volume,
                                quoteAssetVolume: quoteAssetVolume,
                                numberOfTrades: data.tradeNum || 0,
                                takerBuyBaseAssetVolume: volume * 0.5, // Примерное значение
                                takerBuyQuoteAssetVolume: quoteAssetVolume * 0.5, // Примерное значение
                                isClosed: data.confirm,
                                lastUpdatedAt: Date.now()
                            };
                            
                            await this.saveCandle(tradingPairId, intervalId, candleData);
                        }
                    }
                    
                    // Сохраняем WebSocket данные
                    await this.saveWebSocketData(2, symbol, 'candle', message, {
                        openTime: data.start,
                        openPrice: parseFloat(data.open),
                        highPrice: parseFloat(data.high),
                        lowPrice: parseFloat(data.low),
                        closePrice: parseFloat(data.close),
                        volume: parseFloat(data.volume),
                        isClosed: data.confirm
                    });
                    
                    console.log(`✅ Bybit WS свеча ${symbol}: $${data.close}`);
                }
            } else {
                // Отладочная информация для неизвестных сообщений
                console.log('🔍 Bybit сообщение:', JSON.stringify(message).substring(0, 200));
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения Bybit:', error);
            console.log('📋 Сообщение:', JSON.stringify(message).substring(0, 200));
        }
    }

    // ==================== УПРАВЛЕНИЕ КОЛЛЕКТОРОМ ====================
    
    // Получение статистики
    async getStats() {
        try {
            const stats = {};
            
            // Количество записей в таблицах
            const tables = ['tickers', 'trading_pairs'];
            for (const table of tables) {
                const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                stats[table] = parseInt(result.rows[0].count);
            }

            // Последние тикеры по биржам
            const lastTickers = await this.pool.query(`
                SELECT e.name as exchange, COUNT(*) as count, MAX(t.created_at) as last_update
                FROM tickers t
                JOIN trading_pairs tp ON t.trading_pair_id = tp.id
                JOIN exchanges e ON tp.exchange_id = e.id
                WHERE t.created_at > NOW() - INTERVAL '1 hour'
                GROUP BY e.name
                ORDER BY e.name
            `);
            
            stats.exchanges = {};
            lastTickers.rows.forEach(row => {
                stats.exchanges[row.exchange] = {
                    tickers_last_hour: parseInt(row.count),
                    last_update: row.last_update
                };
            });

            // Статистика кэша
            stats.cache = {
                tickers: dataCache.tickers.size,
                candles: dataCache.candles.size
            };

            // Информация о Railway
            stats.environment = {
                nodeEnv: ENV.NODE_ENV,
                port: ENV.PORT,
                railwayDomain: ENV.RAILWAY_PUBLIC_DOMAIN,
                railwayProject: ENV.RAILWAY_PROJECT_NAME,
                uptime: process.uptime()
            };

            // Статус соединений
            stats.connections = {
                binance: binanceWS ? 'connected' : 'disconnected',
                bybit: bybitWS ? 'connected' : 'disconnected',
                coinbase: coinbaseWS ? 'connected' : 'disconnected'
            };

            return stats;
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error.message);
            return {};
        }
    }

    // Запуск коллектора
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Коллектор уже запущен');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Запуск полностью WebSocket коллектора...');
        
        // Инициализация базы данных
        await this.initDatabase();
        await this.initializeDatabase();
        
        // Запускаем все WebSocket соединения
        this.initializeBinanceWS();
        this.initializeCoinbaseWS();
        this.initializeBybitWS();
        
        // Периодическая статистика
        setInterval(async () => {
            const stats = await this.getStats();
            console.log('📊 Статистика:', JSON.stringify(stats, null, 2));
        }, 60000); // Каждую минуту
        
        console.log('✅ Полностью WebSocket коллектор запущен:');
        console.log('  - Binance: WebSocket (реальное время)');
        console.log('  - Coinbase: WebSocket (реальное время)');
        console.log('  - Bybit: WebSocket (реальное время)');
    }

    // Остановка коллектора
    stop() {
        this.isRunning = false;
        
        if (binanceWS) {
            binanceWS.close();
        }
        
        if (coinbaseWS) {
            coinbaseWS.close();
        }
        
        if (bybitWS) {
            bybitWS.close();
        }
        
        console.log('⏹️ WebSocket коллектор остановлен');
    }
}

// ==================== EXPRESS API ====================

const app = express();
const collector = new HybridCollector();

app.use(express.json());

// API маршруты
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await collector.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/cache', (req, res) => {
    res.json({
        success: true,
        data: {
            tickers: Array.from(dataCache.tickers.values()),
            candles: Array.from(dataCache.candles.values())
        }
    });
});

app.get('/api/tickers/:exchange?', (req, res) => {
    const exchange = req.params.exchange;
    const tickers = Array.from(dataCache.tickers.values());
    
    if (exchange) {
        const filtered = tickers.filter(t => t.source && t.source.includes(exchange));
        res.json({ success: true, data: filtered });
    } else {
        res.json({ success: true, data: tickers });
    }
});

app.get('/api/env', (req, res) => {
    res.json({
        success: true,
        data: {
            nodeEnv: ENV.NODE_ENV,
            port: ENV.PORT,
            databaseUrl: ENV.DATABASE_URL ? 'SET' : 'NOT SET',
            railwayDomain: ENV.RAILWAY_PUBLIC_DOMAIN,
            railwayProject: ENV.RAILWAY_PROJECT_NAME,
            uptime: process.uptime()
        }
    });
});

app.post('/api/start', async (req, res) => {
    await collector.start();
    res.json({ success: true, message: 'Гибридный коллектор запущен' });
});

app.post('/api/stop', (req, res) => {
    collector.stop();
    res.json({ success: true, message: 'Гибридный коллектор остановлен' });
});

// Запуск сервера
const port = ENV.PORT;
const ip = ENV.IP;

console.log('🚀 Запуск Hybrid Collector сервера...');

app.listen(port, ip, async () => {
    console.log(`🚀 WebSocket Collector запущен на http://${ip}:${port}`);
    console.log(`📊 API доступен по адресу http://${ip}:${port}/api`);
    console.log(`📈 Статистика: http://${ip}:${port}/api/stats`);
    console.log(`💾 Кэш: http://${ip}:${port}/api/cache`);
    console.log(`🎯 Тикеры: http://${ip}:${port}/api/tickers`);
    console.log(`🔗 По биржам: /api/tickers/binance | /api/tickers/bybit | /api/tickers/coinbase`);
    
    try {
        // Инициализация базы данных
        await collector.initDatabase();
        
        // Автоматический запуск коллектора
        collector.start();
    } catch (error) {
        console.error('❌ Ошибка запуска коллектора:', error);
    }
}).on('error', (error) => {
    console.error('❌ Ошибка запуска сервера:', error);
}); 