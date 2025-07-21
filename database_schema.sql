-- Схема базы данных для сбора рыночных данных
-- PostgreSQL

-- Таблица свечей (OHLCV)
CREATE TABLE IF NOT EXISTS candles (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    timeframe VARCHAR(10) NOT NULL, -- 1m, 5m, 1h, 1d
    timestamp TIMESTAMP NOT NULL,
    open DECIMAL(20,8) NOT NULL,
    high DECIMAL(20,8) NOT NULL,
    low DECIMAL(20,8) NOT NULL,
    close DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8) NOT NULL,
    taker_buy_vol DECIMAL(20,8),
    taker_sell_vol DECIMAL(20,8),
    delta_vol DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, exchange, timeframe, timestamp)
);

-- Таблица открытого интереса
CREATE TABLE IF NOT EXISTS open_interest (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open_interest DECIMAL(20,8) NOT NULL,
    oi_change_pct DECIMAL(10,4),
    oi_change_24h DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, exchange, timestamp)
);

-- Таблица order book снимков
CREATE TABLE IF NOT EXISTS orderbook_snapshots (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    bid_ask_spread DECIMAL(10,8),
    order_book_imbalance DECIMAL(10,4),
    top_10_bids JSONB, -- [{price, volume}, ...]
    top_10_asks JSONB, -- [{price, volume}, ...]
    total_bid_volume DECIMAL(20,8),
    total_ask_volume DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, exchange, timestamp)
);

-- Таблица фандинга и премии
CREATE TABLE IF NOT EXISTS funding (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    funding_rate DECIMAL(10,8),
    basis_pct DECIMAL(10,4),
    next_funding_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, exchange, timestamp)
);

-- Таблица сигналов
CREATE TABLE IF NOT EXISTS signals_raw (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    timestamp_signal TIMESTAMP NOT NULL,
    timestamp_exec TIMESTAMP,
    signal_type VARCHAR(10) NOT NULL, -- BUY, SELL
    confidence DECIMAL(5,4), -- 0.0 - 1.0
    source VARCHAR(100), -- название стратегии/индикатора
    price_signal DECIMAL(20,8),
    price_exec DECIMAL(20,8),
    latency_ms INTEGER,
    pnl DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица рыночного контекста
CREATE TABLE IF NOT EXISTS market_context (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    btc_dominance DECIMAL(10,4),
    total_market_cap DECIMAL(20,2),
    volatility_index DECIMAL(10,4),
    market_regime VARCHAR(20), -- BULL, BEAR, SIDEWAYS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(timestamp)
);

-- Таблица новостных событий
CREATE TABLE IF NOT EXISTS news_events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    event_type VARCHAR(100), -- FOMC, MAJOR_NEWS, etc.
    title TEXT,
    impact_level VARCHAR(20), -- HIGH, MEDIUM, LOW
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_candles_symbol_timestamp ON candles(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_candles_exchange_timeframe ON candles(exchange, timeframe);
CREATE INDEX IF NOT EXISTS idx_oi_symbol_timestamp ON open_interest(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_orderbook_symbol_timestamp ON orderbook_snapshots(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_funding_symbol_timestamp ON funding(symbol, timestamp);
CREATE INDEX IF NOT EXISTS idx_signals_symbol_timestamp ON signals_raw(symbol, timestamp_signal);
CREATE INDEX IF NOT EXISTS idx_market_context_timestamp ON market_context(timestamp);

-- Представление для объединения данных
CREATE OR REPLACE VIEW market_data_view AS
SELECT 
    c.symbol,
    c.exchange,
    c.timestamp,
    c.open,
    c.high,
    c.low,
    c.close,
    c.volume,
    c.taker_buy_vol,
    c.taker_sell_vol,
    c.delta_vol,
    oi.open_interest,
    oi.oi_change_pct,
    f.funding_rate,
    f.basis_pct,
    ob.bid_ask_spread,
    ob.order_book_imbalance,
    mc.btc_dominance,
    mc.total_market_cap,
    mc.market_regime
FROM candles c
LEFT JOIN open_interest oi ON c.symbol = oi.symbol AND c.exchange = oi.exchange 
    AND c.timestamp = oi.timestamp
LEFT JOIN funding f ON c.symbol = f.symbol AND c.exchange = f.exchange 
    AND c.timestamp = f.timestamp
LEFT JOIN orderbook_snapshots ob ON c.symbol = ob.symbol AND c.exchange = ob.exchange 
    AND c.timestamp = ob.timestamp
LEFT JOIN market_context mc ON DATE_TRUNC('hour', c.timestamp) = DATE_TRUNC('hour', mc.timestamp)
WHERE c.timeframe = '1m'; 