# 🔧 ИСПРАВЛЕНИЕ POSTGRESQL В RAILWAY DASHBOARD

## ✅ **ПРОБЛЕМА:**
```
ERROR: column "symbol" of relation "websocket_data" does not exist at character 59
```

## 🚀 **БЫСТРОЕ РЕШЕНИЕ ЧЕРЕЗ RAILWAY DASHBOARD:**

### **Шаг 1: Перейдите в PostgreSQL сервис**
1. **Откройте Railway Dashboard**
2. **Выберите PostgreSQL сервис** (не основной проект)
3. **Перейдите в раздел "Data"**

### **Шаг 2: Выполните SQL Query**
1. **Нажмите "Query"**
2. **Вставьте следующий SQL:**

```sql
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
```

### **Шаг 3: Проверка результата**
После выполнения SQL вы должны увидеть:
- ✅ **Колонка `symbol` добавлена**
- ✅ **Индекс создан**
- ✅ **Структура таблицы обновлена**

## 📊 **Альтернативный SQL (если первый не работает):**

```sql
-- Удаляем таблицу и создаем заново
DROP TABLE IF EXISTS websocket_data;

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
```

## 🎯 **Проверка исправления:**

После исправления в логах должно исчезнуть:
- ❌ `column "symbol" of relation "websocket_data" does not exist`

И появиться:
- ✅ **WebSocket данные сохраняются**
- ✅ **Нет ошибок с базой данных**

## 🚀 **Готово!**

После выполнения SQL в Railway PostgreSQL все WebSocket данные будут сохраняться корректно.

---
**🔧 Выполните SQL в Railway PostgreSQL Dashboard!** 