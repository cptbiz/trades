-- ========== 1. Таблица торговых пар ==========
CREATE TABLE trading_pairs (
    id SERIAL PRIMARY KEY,
    token_id INTEGER NOT NULL,
    exchange_id INTEGER NOT NULL,        -- 1=Binance, 2=Bybit
    pair_symbol VARCHAR(50) NOT NULL,    -- Например: BTCUSDT
    contract_type_id INTEGER NOT NULL,   -- 1=Futures, 2=Spot
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_trading_pairs_active_exchange 
ON trading_pairs(exchange_id, contract_type_id, is_active) 
WHERE is_active = TRUE;

CREATE INDEX idx_trading_pairs_symbol 
ON trading_pairs(pair_symbol);


-- ========== 2. Таблица интервалов ==========
CREATE TABLE intervals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10) NOT NULL  -- '5m', '15m', '1h', '4h', '24h'
);

CREATE UNIQUE INDEX idx_intervals_name ON intervals(name);


-- ========== 3. Таблица свечей ==========
CREATE TABLE candles (
    id SERIAL PRIMARY KEY,
    trading_pair_id INTEGER NOT NULL,
    interval_id INTEGER NOT NULL,
    open_time BIGINT NOT NULL,              -- Unix timestamp в миллисекундах
    open_price NUMERIC(25,8) NOT NULL,
    high_price NUMERIC(25,8) NOT NULL,
    low_price NUMERIC(25,8) NOT NULL,
    close_price NUMERIC(25,8) NOT NULL,
    volume NUMERIC(25,8) NOT NULL,
    quote_asset_volume NUMERIC(25,8) NOT NULL,
    number_of_trades INTEGER NOT NULL,
    taker_buy_base_asset_volume NUMERIC(25,8) NOT NULL,
    taker_buy_quote_asset_volume NUMERIC(25,8) NOT NULL,
    is_closed BOOLEAN NOT NULL,
    last_updated_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX idx_candles_unique 
ON candles(trading_pair_id, interval_id, open_time);

CREATE INDEX idx_candles_pair_interval_time 
ON candles(trading_pair_id, interval_id, open_time DESC);

CREATE INDEX idx_candles_not_closed 
ON candles(trading_pair_id, interval_id, open_time) 
WHERE is_closed = FALSE;


-- ========== 4. Таблица агрегатов Bybit (опционально) ==========
CREATE TABLE bybit_trade_aggregates_5m (
    trading_pair_id BIGINT NOT NULL,
    open_time BIGINT NOT NULL,
    number_of_trades INTEGER,
    taker_buy_base_volume NUMERIC(25,8),
    taker_buy_quote_volume NUMERIC(25,8)
);

CREATE INDEX idx_bybit_aggregates_pair_time 
ON bybit_trade_aggregates_5m(trading_pair_id, open_time);


-- ========== 5. Таблица checkpoint'ов ==========
CREATE TABLE IF NOT EXISTS collector_checkpoints (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(50) UNIQUE NOT NULL,
    checkpoint_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- ========== 6. Таблица сигналов (для обучения модели) ==========
CREATE TABLE signals_10min (
    id SERIAL PRIMARY KEY,
    token_symbol VARCHAR(20),
    exchange_id INTEGER,
    signal_time TIMESTAMP,
    signal_type VARCHAR(10),       -- 'buy' или 'sell'
    oi_change_pct NUMERIC(10,5),
    mark_price_now NUMERIC(25,8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========== 7. Таблица тикеров ==========
CREATE TABLE tickers (
    id SERIAL PRIMARY KEY,
    trading_pair_id INTEGER NOT NULL,
    price NUMERIC(25,8) NOT NULL,
    price_change NUMERIC(25,8) NOT NULL,
    volume NUMERIC(25,8) NOT NULL,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickers_pair_time 
ON tickers(trading_pair_id, timestamp DESC);

CREATE INDEX idx_tickers_timestamp 
ON tickers(timestamp DESC);


-- ========== 8. Таблица WebSocket данных ==========
CREATE TABLE websocket_data (
    id SERIAL PRIMARY KEY,
    exchange_id INTEGER NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    data_type VARCHAR(20) NOT NULL, -- 'ticker', 'candle', 'trade'
    raw_data JSONB NOT NULL,
    processed_data JSONB,
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_websocket_data_exchange_symbol 
ON websocket_data(exchange_id, symbol, timestamp DESC);

CREATE INDEX idx_websocket_data_type_time 
ON websocket_data(data_type, timestamp DESC);


-- ========== Вставка начальных данных ==========

-- Интервалы
INSERT INTO intervals (name) VALUES 
('1m'), ('5m'), ('15m'), ('1h'), ('4h'), ('24h');

-- Торговые пары для Binance (exchange_id=1, contract_type_id=1 для Futures)
INSERT INTO trading_pairs (token_id, exchange_id, pair_symbol, contract_type_id) VALUES
(1, 1, 'BTCUSDT', 1), (2, 1, 'ETHUSDT', 1), (3, 1, 'SOLUSDT', 1), (4, 1, 'ADAUSDT', 1), (5, 1, 'XRPUSDT', 1),
(6, 1, 'DOGEUSDT', 1), (7, 1, 'DOTUSDT', 1), (8, 1, 'AVAXUSDT', 1), (9, 1, 'MATICUSDT', 1), (10, 1, 'LTCUSDT', 1),
(11, 1, 'LINKUSDT', 1), (12, 1, 'BCHUSDT', 1), (13, 1, 'ETCUSDT', 1), (14, 1, 'UNIUSDT', 1), (15, 1, 'OPUSDT', 1),
(16, 1, 'ARBUSDT', 1), (17, 1, 'APTUSDT', 1), (18, 1, 'SUIUSDT', 1), (19, 1, 'SHIBUSDT', 1), (20, 1, 'FILUSDT', 1);

-- Торговые пары для Bybit (exchange_id=2, contract_type_id=1 для Futures)
INSERT INTO trading_pairs (token_id, exchange_id, pair_symbol, contract_type_id) VALUES
(1, 2, 'BTCUSDT', 1), (2, 2, 'ETHUSDT', 1), (3, 2, 'SOLUSDT', 1), (4, 2, 'ADAUSDT', 1), (5, 2, 'XRPUSDT', 1),
(6, 2, 'DOGEUSDT', 1), (7, 2, 'DOTUSDT', 1), (8, 2, 'AVAXUSDT', 1), (9, 2, 'MATICUSDT', 1), (10, 2, 'LTCUSDT', 1),
(11, 2, 'LINKUSDT', 1), (12, 2, 'BCHUSDT', 1), (13, 2, 'ETCUSDT', 1), (14, 2, 'UNIUSDT', 1), (15, 2, 'OPUSDT', 1),
(16, 2, 'ARBUSDT', 1), (17, 2, 'APTUSDT', 1), (18, 2, 'SUIUSDT', 1), (20, 2, 'FILUSDT', 1);

-- Торговые пары для Coinbase (exchange_id=3, contract_type_id=2 для Spot)
INSERT INTO trading_pairs (token_id, exchange_id, pair_symbol, contract_type_id) VALUES
(1, 3, 'BTC-USD', 2), (2, 3, 'ETH-USD', 2), (3, 3, 'SOL-USD', 2), (4, 3, 'ADA-USD', 2), (5, 3, 'XRP-USD', 2),
(6, 3, 'DOGE-USD', 2), (7, 3, 'DOT-USD', 2), (8, 3, 'AVAX-USD', 2), (9, 3, 'MATIC-USD', 2), (10, 3, 'LTC-USD', 2),
(11, 3, 'LINK-USD', 2), (12, 3, 'BCH-USD', 2), (13, 3, 'ETC-USD', 2), (14, 3, 'UNI-USD', 2), (15, 3, 'OP-USD', 2),
(16, 3, 'ARB-USD', 2), (17, 3, 'APT-USD', 2), (18, 3, 'SUI-USD', 2), (19, 3, 'SHIB-USD', 2), (20, 3, 'FIL-USD', 2); 