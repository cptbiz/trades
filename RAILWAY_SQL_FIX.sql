-- Исправление таблицы websocket_data на Railway
-- Выполните этот SQL в Railway PostgreSQL

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

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id);
CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);

-- Проверка создания таблицы
SELECT 'websocket_data table created successfully' as status;

-- Показать структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position; 