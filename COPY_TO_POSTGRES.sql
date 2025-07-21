-- 🔧 КОПИРУЙТЕ ЭТОТ SQL В RAILWAY POSTGRESQL DASHBOARD
-- Перейдите в Railway Dashboard → PostgreSQL → Data → Query

-- Добавляем колонку symbol
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);

-- Добавляем колонку data_type
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS data_type VARCHAR(50);

-- Добавляем колонку raw_data
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS raw_data TEXT;

-- Добавляем колонку processed_data
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS processed_data JSONB;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id);
CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);

-- Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position; 