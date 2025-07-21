-- 🔧 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ТАБЛИЦЫ WEBSOCKET_DATA В RAILWAY POSTGRESQL
-- Выполните этот SQL в Railway PostgreSQL Dashboard

-- Проверяем текущую структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position;

-- Добавляем колонку symbol если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'websocket_data' AND column_name = 'symbol'
    ) THEN
        ALTER TABLE websocket_data ADD COLUMN symbol VARCHAR(20);
        RAISE NOTICE 'Колонка symbol добавлена в таблицу websocket_data';
    ELSE
        RAISE NOTICE 'Колонка symbol уже существует';
    END IF;
END $$;

-- Добавляем колонку data_type если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'websocket_data' AND column_name = 'data_type'
    ) THEN
        ALTER TABLE websocket_data ADD COLUMN data_type VARCHAR(50);
        RAISE NOTICE 'Колонка data_type добавлена в таблицу websocket_data';
    ELSE
        RAISE NOTICE 'Колонка data_type уже существует';
    END IF;
END $$;

-- Добавляем колонку raw_data если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'websocket_data' AND column_name = 'raw_data'
    ) THEN
        ALTER TABLE websocket_data ADD COLUMN raw_data TEXT;
        RAISE NOTICE 'Колонка raw_data добавлена в таблицу websocket_data';
    ELSE
        RAISE NOTICE 'Колонка raw_data уже существует';
    END IF;
END $$;

-- Добавляем колонку processed_data если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'websocket_data' AND column_name = 'processed_data'
    ) THEN
        ALTER TABLE websocket_data ADD COLUMN processed_data JSONB;
        RAISE NOTICE 'Колонка processed_data добавлена в таблицу websocket_data';
    ELSE
        RAISE NOTICE 'Колонка processed_data уже существует';
    END IF;
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id);
CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);

-- Проверяем обновленную структуру таблицы
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