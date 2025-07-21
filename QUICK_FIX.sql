-- БЫСТРОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ pair_symbol
-- Выполните этот скрипт в Railway PostgreSQL Dashboard

-- 1. Делаем pair_symbol nullable
ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL;

-- 2. Добавляем колонку symbol если её нет
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);

-- 3. Проверяем результат
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position; 