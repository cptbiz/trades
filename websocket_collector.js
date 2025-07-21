const WebSocket = require('ws');
const { Pool } = require('pg');
const express = require('express');
const path = require('path');

console.log('🚀 Starting WebSocket Data Collector...');

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

// Список торговых пар для отслеживания (20 основных пар)
const tradingPairs = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT',
    'DOGEUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT', 'LTCUSDT',
    'LINKUSDT', 'BCHUSDT', 'ETCUSDT', 'UNIUSDT', 'OPUSDT',
    'ARBUSDT', 'APTUSDT', 'SUIUSDT', 'SHIBUSDT', 'FILUSDT'
];

// WebSocket соединения
let binanceFuturesWS = null;
let binanceSpotWS = null;
let bybitWS = null;
let coinbaseWS = null;

// Кэш для хранения последних данных
const dataCache = {
    klines: new Map(),
    trades: new Map(),
    tickers: new Map(),
    orderbook: new Map()
};

class WebSocketCollector {
    constructor() {
        this.isRunning = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.pool = pool; // Используем глобальный пул
    }

    // Инициализация базы данных
    async initDatabase() {
        try {
            console.log('🔍 Проверка подключения к базе данных...');
            const result = await pool.query('SELECT 1');
            console.log('✅ Подключение к базе данных установлено');
        } catch (error) {
            console.error('❌ Ошибка подключения к БД:', error.message);
        }
    }

    // Сохранение WebSocket данных
    async saveWebSocketData(exchangeId, pairSymbol, dataType, rawData, processedData = null) {
        try {
            const timestamp = Date.now();
            const query = `
                INSERT INTO websocket_data (exchange_id, pair_symbol, data_type, raw_data, processed_data, timestamp)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            
            await this.pool.query(query, [
                exchangeId, pairSymbol, dataType, 
                JSON.stringify(rawData), 
                processedData ? JSON.stringify(processedData) : null,
                timestamp
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сохранения WebSocket данных ${pairSymbol}:`, error.message);
        }
    }

    // Получение ID торговой пары
    async getTradingPairId(exchangeId, pairSymbol) {
        try {
            const query = `
                SELECT id FROM trading_pairs 
                WHERE exchange_id = $1 AND pair_symbol = $2 AND is_active = TRUE
            `;
            const result = await this.pool.query(query, [exchangeId, pairSymbol]);
            return result.rows[0]?.id || null;
        } catch (error) {
            console.error('❌ Ошибка получения ID торговой пары:', error);
            return null;
        }
    }

    // Сохранение тикеров в базу
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
            console.error('❌ Ошибка сохранения тикера:', error);
        }
    }

    // Сохранение свечей
    async saveCandle(tradingPairId, intervalId, candleData) {
        try {
            const query = `
                INSERT INTO candles (
                    trading_pair_id, interval_id, open_time, open_price, high_price, 
                    low_price, close_price, volume, quote_asset_volume, number_of_trades,
                    taker_buy_base_asset_volume, taker_buy_quote_asset_volume, 
                    is_closed, last_updated_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (trading_pair_id, interval_id, open_time) 
                DO UPDATE SET 
                    open_price = EXCLUDED.open_price,
                    high_price = EXCLUDED.high_price,
                    low_price = EXCLUDED.low_price,
                    close_price = EXCLUDED.close_price,
                    volume = EXCLUDED.volume,
                    quote_asset_volume = EXCLUDED.quote_asset_volume,
                    number_of_trades = EXCLUDED.number_of_trades,
                    taker_buy_base_asset_volume = EXCLUDED.taker_buy_base_asset_volume,
                    taker_buy_quote_asset_volume = EXCLUDED.taker_buy_quote_asset_volume,
                    is_closed = EXCLUDED.is_closed,
                    last_updated_at = EXCLUDED.last_updated_at
            `;
            
            await this.pool.query(query, [
                tradingPairId, intervalId, candleData.openTime, candleData.openPrice,
                candleData.highPrice, candleData.lowPrice, candleData.closePrice,
                candleData.volume, candleData.quoteAssetVolume, candleData.numberOfTrades,
                candleData.takerBuyBaseAssetVolume, candleData.takerBuyQuoteAssetVolume,
                candleData.isClosed, candleData.lastUpdatedAt
            ]);
        } catch (error) {
            console.error(`❌ Ошибка сохранения свечи:`, error.message);
        }
    }

    // Получение ID торговой пары
    async getTradingPairId(pairSymbol, exchangeId) {
        try {
            const result = await this.pool.query(
                'SELECT id FROM trading_pairs WHERE pair_symbol = $1 AND exchange_id = $2 AND is_active = TRUE',
                [pairSymbol, exchangeId]
            );
            return result.rows[0]?.id;
        } catch (error) {
            console.error(`❌ Ошибка получения ID торговой пары ${pairSymbol}:`, error.message);
            return null;
        }
    }

    // Получение ID интервала
    async getIntervalId(intervalName) {
        try {
            const result = await this.pool.query(
                'SELECT id FROM intervals WHERE name = $1',
                [intervalName]
            );
            return result.rows[0]?.id;
        } catch (error) {
            console.error(`❌ Ошибка получения ID интервала ${intervalName}:`, error.message);
            return null;
        }
    }

    // Обработка данных свечей Binance
    async handleBinanceKline(data) {
        try {
            const kline = data.k;
            const pairSymbol = data.s;
            const interval = data.k.i;
            
            // Сохраняем сырые данные
            await this.saveWebSocketData(1, pairSymbol, 'kline', data);
            
            // Получаем ID торговой пары и интервала
            const tradingPairId = await this.getTradingPairId(pairSymbol, 1);
            const intervalId = await this.getIntervalId(interval);
            
            if (!tradingPairId || !intervalId) {
                console.log(`⚠️ Не найдены ID для ${pairSymbol} ${interval}`);
                return;
            }
            
            // Обрабатываем данные свечи
            const candleData = {
                openTime: kline.t,
                openPrice: parseFloat(kline.o),
                highPrice: parseFloat(kline.h),
                lowPrice: parseFloat(kline.l),
                closePrice: parseFloat(kline.c),
                volume: parseFloat(kline.v),
                quoteAssetVolume: parseFloat(kline.q),
                numberOfTrades: parseInt(kline.n),
                takerBuyBaseAssetVolume: parseFloat(kline.V),
                takerBuyQuoteAssetVolume: parseFloat(kline.Q),
                isClosed: kline.x,
                lastUpdatedAt: Date.now()
            };
            
            await this.saveCandle(tradingPairId, intervalId, candleData);
            
            // Обновляем кэш
            const cacheKey = `${pairSymbol}_${interval}`;
            dataCache.klines.set(cacheKey, {
                ...candleData,
                symbol: pairSymbol,
                interval: interval,
                timestamp: Date.now()
            });
            
            console.log(`✅ Свеча ${pairSymbol} ${interval}: $${candleData.closePrice}`);
            
        } catch (error) {
            console.error('❌ Ошибка обработки свечи Binance:', error.message);
        }
    }

    // Обработка данных тикера Binance
    async handleBinanceTicker(data) {
        try {
            const pairSymbol = data.s;
            
            // Сохраняем сырые данные
            await this.saveWebSocketData(1, pairSymbol, 'ticker', data);
            
            // Получаем ID торговой пары и сохраняем тикер
            const tradingPairId = await this.getTradingPairId(pairSymbol, 1);
            if (tradingPairId) {
                const tickerData = {
                    price: parseFloat(data.c),
                    priceChange: parseFloat(data.p) || 0,
                    volume: parseFloat(data.v) || 0,
                    timestamp: Date.now()
                };
                
                await this.saveTicker(tradingPairId, tickerData);
            }
            
            // Обновляем кэш
            dataCache.tickers.set(pairSymbol, {
                symbol: pairSymbol,
                price: parseFloat(data.c),
                priceChange: parseFloat(data.P),
                priceChangePercent: parseFloat(data.P),
                volume: parseFloat(data.v),
                quoteVolume: parseFloat(data.q),
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.error('❌ Ошибка обработки тикера Binance:', error.message);
        }
    }

    // Обработка данных сделок Binance
    async handleBinanceTrade(data) {
        try {
            const pairSymbol = data.s;
            
            // Сохраняем сырые данные
            await this.saveWebSocketData(1, pairSymbol, 'trade', data);
            
            // Обновляем кэш
            const tradeData = {
                symbol: pairSymbol,
                price: parseFloat(data.p),
                quantity: parseFloat(data.q),
                time: data.T,
                isBuyerMaker: data.m,
                timestamp: Date.now()
            };
            
            if (!dataCache.trades.has(pairSymbol)) {
                dataCache.trades.set(pairSymbol, []);
            }
            
            const trades = dataCache.trades.get(pairSymbol);
            trades.push(tradeData);
            
            // Оставляем только последние 100 сделок
            if (trades.length > 100) {
                trades.splice(0, trades.length - 100);
            }
            
        } catch (error) {
            console.error('❌ Ошибка обработки сделки Binance:', error.message);
        }
    }

    // Инициализация WebSocket соединений
    initializeWebSockets() {
        console.log('🔌 Инициализация WebSocket соединений...');
        
        // Binance Futures WebSocket
        this.initializeBinanceFuturesWS();
        
        // Binance Spot WebSocket
        this.initializeBinanceSpotWS();
        
        // Bybit WebSocket
        this.initializeBybitWS();
        
        // Coinbase WebSocket
        this.initializeCoinbaseWS();
    }

    // Инициализация Binance Futures WebSocket
    initializeBinanceFuturesWS() {
        try {
            binanceFuturesWS = new WebSocket('wss://fstream.binance.com/ws');
            
            binanceFuturesWS.on('open', () => {
                console.log('✅ Binance Futures WebSocket подключен');
                this.reconnectAttempts = 0;
                
                // Подписываемся на свечи и тикеры
                const streams = tradingPairs.map(symbol => 
                    `${symbol.toLowerCase()}@kline_1m/${symbol.toLowerCase()}@ticker`
                ).join('/');
                
                const subscribeMsg = {
                    method: 'SUBSCRIBE',
                    params: streams.split('/'),
                    id: 1
                };
                
                binanceFuturesWS.send(JSON.stringify(subscribeMsg));
                console.log(`📊 Подписка на ${tradingPairs.length} пар Binance Futures (свечи + тикеры)`);
            });
            
            binanceFuturesWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleBinanceMessage(message);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения Binance:', error);
                }
            });
            
            binanceFuturesWS.on('error', (error) => {
                console.error('❌ Ошибка Binance Futures WebSocket:', error);
            });
            
            binanceFuturesWS.on('close', () => {
                console.log('🔌 Binance Futures WebSocket отключен, переподключение...');
                this.reconnectWebSocket('binance_futures');
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Binance Futures WebSocket:', error);
        }
    }

    // Инициализация Binance Spot WebSocket
    initializeBinanceSpotWS() {
        try {
            binanceSpotWS = new WebSocket('wss://stream.binance.com:9443/ws');
            
            binanceSpotWS.on('open', () => {
                console.log('✅ Binance Spot WebSocket подключен');
                
                // Подписываемся на тикеры
                const streams = tradingPairs.map(symbol => 
                    `${symbol.toLowerCase()}@ticker`
                ).join('/');
                
                const subscribeMsg = {
                    method: 'SUBSCRIBE',
                    params: streams.split('/'),
                    id: 2
                };
                
                binanceSpotWS.send(JSON.stringify(subscribeMsg));
                console.log(`📊 Подписка на ${tradingPairs.length} пар Binance Spot`);
            });
            
            binanceSpotWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleBinanceMessage(message);
                } catch (error) {
                    console.error('❌ Ошибка парсинга сообщения Binance Spot:', error);
                }
            });
            
            binanceSpotWS.on('error', (error) => {
                console.error('❌ Ошибка Binance Spot WebSocket:', error);
            });
            
            binanceSpotWS.on('close', () => {
                console.log('🔌 Binance Spot WebSocket отключен');
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Binance Spot WebSocket:', error);
        }
    }

    // Инициализация Bybit WebSocket
    initializeBybitWS() {
        try {
            bybitWS = new WebSocket('wss://stream.bybit.com/v5/public/linear');
            
            bybitWS.on('open', () => {
                console.log('✅ Bybit WebSocket подключен');
                
                // Подписываемся на свечи и тикеры согласно спецификации
                const streams = tradingPairs.map(symbol => [
                    `kline.1m.${symbol}`,
                    `tickers.${symbol}`
                ]).flat();
                
                const subscribeMsg = {
                    op: 'subscribe',
                    args: streams
                };
                
                bybitWS.send(JSON.stringify(subscribeMsg));
                console.log(`📊 Подписка на ${tradingPairs.length} пар Bybit (свечи + тикеры)`);
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
            });
            
            bybitWS.on('close', () => {
                console.log('🔌 Bybit WebSocket отключен');
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Bybit WebSocket:', error);
        }
    }

    // Инициализация Coinbase WebSocket
    initializeCoinbaseWS() {
        try {
            coinbaseWS = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            
            coinbaseWS.on('open', () => {
                console.log('✅ Coinbase WebSocket подключен');
                
                // Подписываемся на тикеры согласно документации
                const coinbasePairs = tradingPairs.map(symbol => {
                    // Конвертируем USDT пары в USD формат для Coinbase
                    return symbol.replace('USDT', '-USD');
                });
                
                // Подписка на тикеры согласно официальной документации
                const subscribeMsg = {
                    type: 'subscribe',
                    product_ids: coinbasePairs,
                    channels: ['ticker']
                };
                
                coinbaseWS.send(JSON.stringify(subscribeMsg));
                console.log(`📊 Подписка на ${coinbasePairs.length} пар Coinbase (тикеры)`);
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
            });
            
            coinbaseWS.on('close', () => {
                console.log('🔌 Coinbase WebSocket отключен');
            });
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Coinbase WebSocket:', error);
        }
    }

    // Обработка сообщений Binance
    handleBinanceMessage(message) {
        try {
            if (message.e === 'kline') {
                this.handleBinanceKline(message);
            } else if (message.e === '24hrTicker') {
                this.handleBinanceTicker(message);
            } else if (message.e === 'trade') {
                this.handleBinanceTrade(message);
            } else {
                // Логируем неизвестные типы сообщений для отладки
                console.log(`🔍 Binance сообщение: ${message.e || 'unknown'}`);
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения Binance:', error);
        }
    }

    // Обработка сообщений Bybit
    async handleBybitMessage(message) {
        try {
            if (message.topic && message.topic.startsWith('tickers.')) {
                const pairSymbol = message.topic.replace('tickers.', '');
                const data = message.data;
                
                // Сохраняем сырые данные
                await this.saveWebSocketData(2, pairSymbol, 'ticker', message);
                
                // Получаем ID торговой пары и сохраняем тикер
                const tradingPairId = await this.getTradingPairId(pairSymbol, 2);
                if (tradingPairId) {
                    const tickerData = {
                        price: parseFloat(data.lastPrice),
                        priceChange: parseFloat(data.price24hPcnt) * parseFloat(data.lastPrice),
                        volume: parseFloat(data.volume24h),
                        timestamp: Date.now()
                    };
                    
                    await this.saveTicker(tradingPairId, tickerData);
                }
                
                // Обновляем кэш
                dataCache.tickers.set(pairSymbol, {
                    symbol: pairSymbol,
                    price: parseFloat(data.lastPrice),
                    priceChange: parseFloat(data.price24hPcnt),
                    volume: parseFloat(data.volume24h),
                    timestamp: Date.now()
                });
                
                console.log(`✅ Bybit тикер ${pairSymbol}: $${data.lastPrice}`);
            } else if (message.topic && message.topic.startsWith('kline.')) {
                const pairSymbol = message.topic.split('.')[2];
                const interval = message.topic.split('.')[1];
                const data = message.data[0];
                
                // Сохраняем сырые данные
                await this.saveWebSocketData(2, pairSymbol, 'candle', message);
                
                // Получаем ID торговой пары и сохраняем свечу
                const tradingPairId = await this.getTradingPairId(pairSymbol, 2);
                const intervalId = await this.getIntervalId(interval);
                
                if (tradingPairId && intervalId) {
                    const candleData = {
                        openTime: parseInt(data.start),
                        openPrice: parseFloat(data.open),
                        highPrice: parseFloat(data.high),
                        lowPrice: parseFloat(data.low),
                        closePrice: parseFloat(data.close),
                        volume: parseFloat(data.volume),
                        quoteAssetVolume: parseFloat(data.turnover || 0),
                        numberOfTrades: 1,
                        takerBuyBaseAssetVolume: 0,
                        takerBuyQuoteAssetVolume: 0,
                        isClosed: data.confirm || false,
                        lastUpdatedAt: Date.now()
                    };
                    
                    await this.saveCandle(tradingPairId, intervalId, candleData);
                }
                
                console.log(`✅ Bybit свеча ${pairSymbol}: $${data.close}`);
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения Bybit:', error);
        }
    }

    // Обработка сообщений Coinbase
    async handleCoinbaseMessage(message) {
        try {
            if (message.type === 'ticker') {
                const pairSymbol = message.product_id;
                if (pairSymbol) {
                    // Сохраняем сырые данные
                    await this.saveWebSocketData(3, pairSymbol, 'ticker', message);
                    
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
                    
                    // Конвертируем обратно в USDT формат для единообразия кэша
                    const usdtSymbol = pairSymbol.replace('-USD', 'USDT');
                    
                    // Обновляем кэш
                    dataCache.tickers.set(usdtSymbol, {
                        symbol: usdtSymbol,
                        price: parseFloat(message.price),
                        priceChange: parseFloat(message.open_24h ? (message.price - message.open_24h) : 0),
                        volume: parseFloat(message.volume_24h || 0),
                        timestamp: Date.now()
                    });
                    
                    console.log(`✅ Coinbase тикер ${usdtSymbol}: $${message.price}`);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка обработки сообщения Coinbase:', error);
        }
    }

    // Переподключение WebSocket
    reconnectWebSocket(type) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`❌ Максимальное количество попыток переподключения для ${type}`);
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`🔄 Попытка переподключения ${this.reconnectAttempts}/${this.maxReconnectAttempts} для ${type}`);
        
        setTimeout(() => {
            if (type === 'binance_futures') {
                this.initializeBinanceFuturesWS();
            }
        }, 5000 * this.reconnectAttempts);
    }

    // Получение статистики
    async getStats() {
        try {
            const stats = {};
            
            // Количество записей в каждой таблице
            const tables = ['websocket_data', 'candles', 'trading_pairs'];
            for (const table of tables) {
                const result = await this.pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                stats[table] = parseInt(result.rows[0].count);
            }

            // Последние записи
            const lastWebSocket = await this.pool.query('SELECT created_at FROM websocket_data ORDER BY created_at DESC LIMIT 1');
            stats.lastWebSocketUpdate = lastWebSocket.rows[0]?.received_at;

            // Статистика кэша
            stats.cacheStats = {
                klines: dataCache.klines.size,
                tickers: dataCache.tickers.size,
                trades: dataCache.trades.size
            };

            return stats;
        } catch (error) {
            console.error('❌ Ошибка получения статистики:', error.message);
            return {};
        }
    }

    // Запуск коллектора
    start() {
        if (this.isRunning) {
            console.log('⚠️ Коллектор уже запущен');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Запуск WebSocket коллектора данных...');
        
        this.initializeWebSockets();
        
        // Периодическое сохранение статистики
        setInterval(async () => {
            const stats = await this.getStats();
            console.log('📊 Статистика:', stats);
        }, 60000); // Каждую минуту
    }

    // Остановка коллектора
    stop() {
        this.isRunning = false;
        
        if (binanceFuturesWS) {
            binanceFuturesWS.close();
        }
        if (binanceSpotWS) {
            binanceSpotWS.close();
        }
        if (bybitWS) {
            bybitWS.close();
        }
        if (coinbaseWS) {
            coinbaseWS.close();
        }
        
        console.log('⏹️ WebSocket коллектор остановлен');
    }
}

// Создание Express приложения
const app = express();
const collector = new WebSocketCollector();

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
            klines: Array.from(dataCache.klines.values()),
            tickers: Array.from(dataCache.tickers.values()),
            trades: Array.from(dataCache.trades.entries())
        }
    });
});

app.post('/api/start', (req, res) => {
    collector.start();
    res.json({ success: true, message: 'Коллектор запущен' });
});

app.post('/api/stop', (req, res) => {
    collector.stop();
    res.json({ success: true, message: 'Коллектор остановлен' });
});

// Запуск сервера
const port = process.env.PORT || 8082;
const ip = process.env.IP || '0.0.0.0';

console.log('🚀 Запуск WebSocket Collector сервера...');

app.listen(port, ip, async () => {
    console.log(`🚀 WebSocket Collector запущен на http://${ip}:${port}`);
    console.log(`📊 API доступен по адресу http://${ip}:${port}/api`);
    console.log(`📈 Статистика: http://${ip}:${port}/api/stats`);
    console.log(`💾 Кэш: http://${ip}:${port}/api/cache`);
    
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