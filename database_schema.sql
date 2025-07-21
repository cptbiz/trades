-- ==================== CRYPTO TRADING STATISTICS DATABASE SCHEMA ====================

-- Создание таблицы торговых пар
CREATE TABLE IF NOT EXISTS trading_pairs (
    id SERIAL PRIMARY KEY,
    pair_symbol VARCHAR(20) NOT NULL,
    exchange_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pair_symbol, exchange_id)
);

-- Создание таблицы интервалов для свечей
CREATE TABLE IF NOT EXISTS intervals (
    id SERIAL PRIMARY KEY,
    interval_name VARCHAR(10) NOT NULL UNIQUE,
    seconds INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы тикеров
CREATE TABLE IF NOT EXISTS tickers (
    id SERIAL PRIMARY KEY,
    trading_pair_id INTEGER NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    price_change DECIMAL(20, 8),
    volume DECIMAL(20, 8),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id)
);

-- Создание таблицы свечей (исправленная схема)
CREATE TABLE IF NOT EXISTS candles (
    id SERIAL PRIMARY KEY,
    trading_pair_id INTEGER NOT NULL,
    interval_id INTEGER NOT NULL,
    open_price DECIMAL(20, 8) NOT NULL,
    high_price DECIMAL(20, 8) NOT NULL,
    low_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id),
    FOREIGN KEY (interval_id) REFERENCES intervals(id),
    UNIQUE(trading_pair_id, interval_id, timestamp)
);

-- Создание таблицы WebSocket данных
CREATE TABLE IF NOT EXISTS websocket_data (
    id SERIAL PRIMARY KEY,
    exchange_id INTEGER NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    raw_data TEXT,
    processed_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы сигналов
CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    trading_pair_id INTEGER NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    strength DECIMAL(5, 2),
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id)
);

-- Вставка базовых интервалов
INSERT INTO intervals (interval_name, seconds) VALUES 
    ('1m', 60),
    ('5m', 300),
    ('15m', 900),
    ('1h', 3600),
    ('4h', 14400),
    ('1d', 86400)
ON CONFLICT (interval_name) DO NOTHING;

-- Вставка базовых торговых пар
INSERT INTO trading_pairs (pair_symbol, exchange_id) VALUES 
    ('BTCUSDT', 1), ('ETHUSDT', 1), ('SOLUSDT', 1), ('ADAUSDT', 1), ('XRPUSDT', 1),
    ('DOGEUSDT', 1), ('DOTUSDT', 1), ('AVAXUSDT', 1), ('LTCUSDT', 1), ('LINKUSDT', 1),
    ('BCHUSDT', 1), ('ETCUSDT', 1), ('UNIUSDT', 1), ('OPUSDT', 1), ('ARBUSDT', 1),
    ('APTUSDT', 1), ('SUIUSDT', 1), ('FILUSDT', 1),
    
    ('BTCUSDT', 2), ('ETHUSDT', 2), ('SOLUSDT', 2), ('ADAUSDT', 2), ('XRPUSDT', 2),
    ('DOGEUSDT', 2), ('DOTUSDT', 2), ('AVAXUSDT', 2), ('LTCUSDT', 2), ('LINKUSDT', 2),
    ('BCHUSDT', 2), ('ETCUSDT', 2), ('UNIUSDT', 2), ('OPUSDT', 2), ('ARBUSDT', 2),
    ('APTUSDT', 2), ('SUIUSDT', 2), ('FILUSDT', 2),
    
    ('BTCUSDT', 3), ('ETHUSDT', 3), ('SOLUSDT', 3), ('ADAUSDT', 3), ('XRPUSDT', 3),
    ('DOGEUSDT', 3), ('DOTUSDT', 3), ('AVAXUSDT', 3), ('MATICUSDT', 3), ('LTCUSDT', 3),
    ('LINKUSDT', 3), ('BCHUSDT', 3), ('ETCUSDT', 3), ('UNIUSDT', 3), ('OPUSDT', 3),
    ('ARBUSDT', 3), ('APTUSDT', 3), ('SUIUSDT', 3), ('SHIBUSDT', 3), ('FILUSDT', 3)
ON CONFLICT (pair_symbol, exchange_id) DO NOTHING;

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_tickers_trading_pair_id ON tickers(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_tickers_timestamp ON tickers(timestamp);
CREATE INDEX IF NOT EXISTS idx_candles_trading_pair_id ON candles(trading_pair_id);
CREATE INDEX IF NOT EXISTS idx_candles_timestamp ON candles(timestamp);
CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id);
CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp);

-- Комментарии к таблицам
COMMENT ON TABLE trading_pairs IS 'Торговые пары по биржам';
COMMENT ON TABLE intervals IS 'Временные интервалы для свечей';
COMMENT ON TABLE tickers IS 'Тикеры (текущие цены)';
COMMENT ON TABLE candles IS 'Свечи (OHLCV данные)';
COMMENT ON TABLE websocket_data IS 'Сырые данные WebSocket';
COMMENT ON TABLE signals IS 'Торговые сигналы';

-- Статистика
SELECT 'Database schema created successfully!' as status;
SELECT COUNT(*) as trading_pairs_count FROM trading_pairs;
SELECT COUNT(*) as intervals_count FROM intervals; 