const WebSocket = require('ws');
const { Pool } = require('pg');
const express = require('express');
const axios = require('axios');

console.log('🚀 Starting Hybrid Data Collector (WebSocket + REST API)...');

// Конфигурация базы данных
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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

    // Инициализация базы данных
    async initDatabase() {
        try {
            console.log('🔍 Проверка подключения к базе данных...');
            await this.pool.query('SELECT 1');
            console.log('✅ Подключение к базе данных установлено');
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error.message);
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
        try {
            const query = `
                INSERT INTO websocket_data (exchange_id, symbol, data_type, raw_data, processed_data, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            await this.pool.query(query, [
                exchangeId,
                symbol,
                dataType,
                JSON.stringify(rawData),
                processedData ? JSON.stringify(processedData) : null,
                Date.now()
            ]);
        } catch (error) {
            console.error('❌ Ошибка сохранения WebSocket данных:', error.message);
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

app.post('/api/start', async (req, res) => {
    await collector.start();
    res.json({ success: true, message: 'Гибридный коллектор запущен' });
});

app.post('/api/stop', (req, res) => {
    collector.stop();
    res.json({ success: true, message: 'Гибридный коллектор остановлен' });
});

// Запуск сервера
const port = process.env.PORT || 8082;
const ip = process.env.IP || '0.0.0.0';

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