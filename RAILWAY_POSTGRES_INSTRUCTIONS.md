# 🔧 ИСПРАВЛЕНИЕ POSTGRESQL В RAILWAY

## ✅ **ПРОБЛЕМА:**
```
ERROR: column "symbol" of relation "websocket_data" does not exist
```

## 🚀 **БЫСТРОЕ РЕШЕНИЕ:**

### **Шаг 1: Перейдите в Railway PostgreSQL**
1. **Откройте Railway Dashboard**
2. **Выберите PostgreSQL сервис** (не основной проект tradestatistic)
3. **Перейдите в раздел "Data"**

### **Шаг 2: Выполните SQL Query**
1. **Нажмите "Query"**
2. **Скопируйте и вставьте SQL из файла `RAILWAY_POSTGRES_FINAL.sql`**
3. **Нажмите "Run"**

### **Шаг 3: Проверка результата**
После выполнения SQL вы должны увидеть:
- ✅ **Колонка `symbol` добавлена**
- ✅ **Колонка `data_type` добавлена**
- ✅ **Колонка `raw_data` добавлена**
- ✅ **Колонка `processed_data` добавлена**
- ✅ **Индексы созданы**

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