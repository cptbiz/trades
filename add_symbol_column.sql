-- Добавление колонки symbol в таблицу websocket_data
-- Выполните этот скрипт в Railway PostgreSQL

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

-- Создаем индекс для колонки symbol
CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);

-- Показываем обновленную структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position; 