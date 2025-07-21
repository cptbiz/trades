-- Добавление необходимых колонок в таблицу websocket_data
-- Выполните этот скрипт в Railway PostgreSQL

-- Проверяем существование таблицы
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'websocket_data') THEN
        -- Создаем таблицу если она не существует
        CREATE TABLE websocket_data (
            id SERIAL PRIMARY KEY,
            exchange_id INTEGER NOT NULL,
            symbol VARCHAR(20) NOT NULL,
            data_type VARCHAR(50) NOT NULL,
            raw_data TEXT,
            processed_data JSONB,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Создаем индексы
        CREATE INDEX idx_websocket_data_exchange_id ON websocket_data(exchange_id);
        CREATE INDEX idx_websocket_data_timestamp ON websocket_data(timestamp);
        CREATE INDEX idx_websocket_data_symbol ON websocket_data(symbol);
        
        RAISE NOTICE 'Таблица websocket_data создана с полной структурой';
    ELSE
        -- Добавляем колонки если таблица существует
        BEGIN
            ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);
            RAISE NOTICE 'Колонка symbol добавлена';
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Колонка symbol уже существует';
        END;
        
        BEGIN
            ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS data_type VARCHAR(50);
            RAISE NOTICE 'Колонка data_type добавлена';
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Колонка data_type уже существует';
        END;
        
        BEGIN
            ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS raw_data TEXT;
            RAISE NOTICE 'Колонка raw_data добавлена';
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Колонка raw_data уже существует';
        END;
        
        BEGIN
            ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS processed_data JSONB;
            RAISE NOTICE 'Колонка processed_data добавлена';
        EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Колонка processed_data уже существует';
        END;
        
        -- Создаем индексы если их нет
        CREATE INDEX IF NOT EXISTS idx_websocket_data_exchange_id ON websocket_data(exchange_id);
        CREATE INDEX IF NOT EXISTS idx_websocket_data_timestamp ON websocket_data(timestamp);
        CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);
        
        RAISE NOTICE 'Все необходимые колонки добавлены в таблицу websocket_data';
    END IF;
END $$;

-- Показываем структуру таблицы
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position; 