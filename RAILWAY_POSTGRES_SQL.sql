-- 🔧 ИСПРАВЛЕНИЕ КОЛОНКИ SYMBOL В RAILWAY POSTGRESQL
-- Скопируйте этот SQL и выполните в Railway PostgreSQL Dashboard

-- Проверяем текущую структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position;

-- Добавляем колонку symbol
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);

-- Создаем индекс для колонки symbol
CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);

-- Проверяем обновленную структуру
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position;

-- Проверяем индексы
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'websocket_data'; 