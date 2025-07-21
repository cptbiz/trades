const ccxt = require('ccxt');
const { Pool } = require('pg');
const express = require('express');
const path = require('path');

// Конфигурация базы данных через TCP прокси
const dbConfig = {
    host: process.env.PGHOST || 'turntable.proxy.rlwy.net',
    port: process.env.PGPORT || 37516,
    database: process.env.PGDATABASE || 'railway',
    user: process.env.PGUSER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt',
    ssl: {
        rejectUnauthorized: false
    }
};

// Создание пула соединений
const pool = new Pool(dbConfig);

// Инициализация бирж
const exchanges = {
    binance: new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET,
        sandbox: false
    }),
    bybit: new ccxt.bybit({
        apiKey: process.env.BYBIT_API_KEY,
        secret: process.env.BYBIT_SECRET,
        sandbox: false
    }),
    coinbase: new ccxt.coinbase({
        apiKey: process.env.COINBASE_API_KEY,
        secret: process.env.COINBASE_SECRET,
        passphrase: process.env.COINBASE_PASSPHRASE,
        sandbox: false
    })
};

// Список символов для отслеживания
const symbols = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT',
    'XRP/USDT', 'DOT/USDT', 'DOGE/USDT', 'AVAX/USDT', 'LINK/USDT',
    'UNI/USDT', 'BCH/USDT', 'LTC/USDT', 'ATOM/USDT', 'FIL/USDT',
    'ALGO/USDT', 'NEO/USDT', 'ETC/USDT'
];

// Класс для сбора данных
class DataCollector {
    constructor() {
        this.isRunning = false;
        this.websockets = {};
        this.lastCandleData = {};
    }

    // Форматирование символа для конкретной биржи
    formatSymbol(symbol, exchange) {
        if (exchange === 'bybit') {
            // Для Bybit убираем дублирование USDT
            return symbol.replace('/USDT', 'USDT');
        }
        return symbol;
    }

    // Инициализация базы данных
    async initDatabase() {
        try {
            const schema = require('fs').readFileSync(path.join(__dirname, 'database_schema.sql'), 'utf8');
            await pool.query(schema);
            console.log('✅ База данных инициализирована');
        } catch (error) {
            console.error('❌ Ошибка инициализации БД:', error.message);
        }
    }

    // Сохранение свечей
    async saveCandles(symbol, exchange, timeframe, candleData) {
        try {
            const query = `
                INSERT INTO candles (symbol, exchange, timeframe, timestamp, open, high, low, close, volume)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (symbol, exchange, timeframe, timestamp) 
                DO UPDATE SET open = EXCLUDED.open, high = EXCLUDED.high, low = EXCLUDED.low, 
                close = EXCLUDED.close, volume = EXCLUDED.volume
            `;
            
            await pool.query(query, [
                symbol, exchange, timeframe, new Date(candleData.timestamp),
                candleData.open, candleData.high, candleData.low, candleData.close, candleData.volume
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сохранения свечей ${symbol}:`, error.message);
        }
    }

    // Сохранение открытого интереса
    async saveOpenInterest(symbol, exchange, oiData) {
        try {
            const query = `
                INSERT INTO open_interest (symbol, exchange, timestamp, open_interest, oi_change_pct)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (symbol, exchange, timestamp) 
                DO UPDATE SET open_interest = EXCLUDED.open_interest, oi_change_pct = EXCLUDED.oi_change_pct
            `;
            
            await pool.query(query, [
                symbol, exchange, new Date(), oiData.openInterest || 0, oiData.changePercent || 0
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сохранения OI ${symbol}:`, error.message);
        }
    }

    // Сохранение фандинга
    async saveFunding(symbol, exchange, fundingData) {
        try {
            const query = `
                INSERT INTO funding (symbol, exchange, timestamp, funding_rate, next_funding_time)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (symbol, exchange, timestamp) 
                DO UPDATE SET funding_rate = EXCLUDED.funding_rate, next_funding_time = EXCLUDED.next_funding_time
            `;
            
            await pool.query(query, [
                symbol, exchange, new Date(), fundingData.fundingRate || 0, 
                fundingData.nextFundingTime ? new Date(fundingData.nextFundingTime) : null
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сохранения фандинга ${symbol}:`, error.message);
        }
    }

    // Сохранение order book
    async saveOrderBook(symbol, exchange, orderbookData) {
        try {
            const top10Bids = orderbookData.bids.slice(0, 10).map(bid => ({ price: bid[0], volume: bid[1] }));
            const top10Asks = orderbookData.asks.slice(0, 10).map(ask => ({ price: ask[0], volume: ask[1] }));
            
            const bidAskSpread = orderbookData.asks[0]?.[0] - orderbookData.bids[0]?.[0] || 0;
            const totalBidVolume = orderbookData.bids.reduce((sum, bid) => sum + bid[1], 0);
            const totalAskVolume = orderbookData.asks.reduce((sum, ask) => sum + ask[1], 0);
            const imbalance = totalBidVolume > 0 ? (totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume) : 0;

            const query = `
                INSERT INTO orderbook_snapshots (symbol, exchange, timestamp, bid_ask_spread, order_book_imbalance, 
                top_10_bids, top_10_asks, total_bid_volume, total_ask_volume)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (symbol, exchange, timestamp) 
                DO UPDATE SET bid_ask_spread = EXCLUDED.bid_ask_spread, order_book_imbalance = EXCLUDED.order_book_imbalance,
                top_10_bids = EXCLUDED.top_10_bids, top_10_asks = EXCLUDED.top_10_asks,
                total_bid_volume = EXCLUDED.total_bid_volume, total_ask_volume = EXCLUDED.total_ask_volume
            `;
            
            await pool.query(query, [
                symbol, exchange, new Date(), bidAskSpread, imbalance,
                JSON.stringify(top10Bids), JSON.stringify(top10Asks), totalBidVolume, totalAskVolume
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сохранения order book ${symbol}:`, error.message);
        }
    }

    // Получение свечей с биржи
    async fetchCandles(symbol, exchange, timeframe = '1m') {
        try {
            const ex = exchanges[exchange];
            if (!ex) {
                console.error(`❌ Биржа ${exchange} не найдена`);
                return;
            }

            const formattedSymbol = this.formatSymbol(symbol, exchange);
            const candles = await ex.fetchOHLCV(formattedSymbol, timeframe, undefined, 100);
            
            for (const candle of candles) {
                const [timestamp, open, high, low, close, volume] = candle;
                await this.saveCandles(symbol, exchange, timeframe, {
                    timestamp, open, high, low, close, volume
                });
            }
            
            console.log(`✅ Свечи ${symbol} (${exchange}) сохранены`);
        } catch (error) {
            console.error(`❌ Ошибка получения свечей ${symbol}:`, error.message);
        }
    }

    // Получение открытого интереса
    async fetchOpenInterest(symbol, exchange) {
        try {
            const ex = exchanges[exchange];
            if (!ex) return;

            if (ex.has['fetchOpenInterest']) {
                const formattedSymbol = this.formatSymbol(symbol, exchange);
                const oiData = await ex.fetchOpenInterest(formattedSymbol);
                await this.saveOpenInterest(symbol, exchange, oiData);
                console.log(`✅ OI ${symbol} (${exchange}) сохранен`);
            }
        } catch (error) {
            console.error(`❌ Ошибка получения OI ${symbol}:`, error.message);
        }
    }

    // Получение фандинга
    async fetchFunding(symbol, exchange) {
        try {
            const ex = exchanges[exchange];
            if (!ex) return;

            if (ex.has['fetchFundingRate']) {
                const formattedSymbol = this.formatSymbol(symbol, exchange);
                const fundingData = await ex.fetchFundingRate(formattedSymbol);
                await this.saveFunding(symbol, exchange, fundingData);
                console.log(`✅ Фандинг ${symbol} (${exchange}) сохранен`);
            }
        } catch (error) {
            console.error(`❌ Ошибка получения фандинга ${symbol}:`, error.message);
        }
    }

    // Получение order book
    async fetchOrderBook(symbol, exchange) {
        try {
            const ex = exchanges[exchange];
            if (!ex) return;

            const formattedSymbol = this.formatSymbol(symbol, exchange);
            const orderbook = await ex.fetchOrderBook(formattedSymbol);
            await this.saveOrderBook(symbol, exchange, orderbook);
            console.log(`✅ Order book ${symbol} (${exchange}) сохранен`);
        } catch (error) {
            console.error(`❌ Ошибка получения order book ${symbol}:`, error.message);
        }
    }

    // Сбор всех данных для символа
    async collectDataForSymbol(symbol, exchange) {
        try {
            await Promise.all([
                this.fetchCandles(symbol, exchange, '1m'),
                this.fetchCandles(symbol, exchange, '5m'),
                this.fetchCandles(symbol, exchange, '1h'),
                this.fetchOpenInterest(symbol, exchange),
                this.fetchFunding(symbol, exchange),
                this.fetchOrderBook(symbol, exchange)
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сбора данных для ${symbol}:`, error.message);
        }
    }

    // Сбор данных для всех символов
    async collectAllData() {
        console.log('🔄 Начинаю сбор данных...');
        
        for (const symbol of symbols) {
            for (const exchange of Object.keys(exchanges)) {
                await this.collectDataForSymbol(symbol, exchange);
                // Небольшая задержка между запросами
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log('✅ Сбор данных завершен');
    }

    // Запуск периодического сбора данных
    startDataCollection(intervalMinutes = 1) {
        if (this.isRunning) {
            console.log('⚠️ Сбор данных уже запущен');
            return;
        }

        this.isRunning = true;
        console.log(`🚀 Запуск сбора данных каждые ${intervalMinutes} минут`);

        // Первоначальный сбор
        this.collectAllData();

        // Периодический сбор
        this.collectionInterval = setInterval(() => {
            this.collectAllData();
        }, intervalMinutes * 60 * 1000);
    }

    // Остановка сбора данных
    stopDataCollection() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.isRunning = false;
            console.log('⏹️ Сбор данных остановлен');
        }
    }

    // Получение статистики
    async getStats() {
        try {
            const stats = {};
            
            // Количество записей в каждой таблице
            const tables = ['candles', 'open_interest', 'funding', 'orderbook_snapshots'];
            for (const table of tables) {
                const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                stats[table] = parseInt(result.rows[0].count);
            }

            // Последние записи
            const lastCandle = await pool.query('SELECT timestamp FROM candles ORDER BY timestamp DESC LIMIT 1');
            stats.lastUpdate = lastCandle.rows[0]?.timestamp;

            return stats;
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error.message);
            return {};
        }
    }
}

// Создание Express приложения
const app = express();
const collector = new DataCollector();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'templates')));

// View engine
app.set('view engine', 'twig');
app.set('views', path.join(__dirname, 'templates'));

// API маршруты
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await collector.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/collect', async (req, res) => {
    try {
        await collector.collectAllData();
        res.json({ success: true, message: 'Данные собраны' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/start', (req, res) => {
    try {
        const interval = req.body.interval || 1;
        collector.startDataCollection(interval);
        res.json({ success: true, message: `Сбор данных запущен с интервалом ${interval} минут` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/stop', (req, res) => {
    try {
        collector.stopDataCollection();
        res.json({ success: true, message: 'Сбор данных остановлен' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Dashboard route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'data_collector_dashboard.html.twig'));
});

// Запуск сервера
const PORT = process.env.PORT || 8081;

async function startServer() {
    try {
        // Инициализация базы данных
        await collector.initDatabase();
        
        // Запуск сервера
        app.listen(PORT, () => {
            console.log(`🚀 Data Collector запущен на порту ${PORT}`);
            console.log(`📊 API доступен по адресу http://localhost:${PORT}/api`);
            console.log(`📈 Статистика: http://localhost:${PORT}/api/stats`);
        });
        
        // Автоматический запуск сбора данных
        collector.startDataCollection(1);
        
    } catch (error) {
        console.error('❌ Ошибка запуска сервера:', error.message);
    }
}

startServer(); 