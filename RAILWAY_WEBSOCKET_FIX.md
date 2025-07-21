# 🔧 ИСПРАВЛЕНИЕ ТАБЛИЦЫ WEBSOCKET_DATA

## ✅ **ПРОБЛЕМА:**
```
❌ Ошибка сохранения WebSocket данных: column "symbol" of relation "websocket_data" does not exist
```

## 🚀 **БЫСТРОЕ РЕШЕНИЕ:**

### **Вариант 1: Автоматическое исправление (РЕКОМЕНДУЕТСЯ)**

1. **Перейдите в Railway Dashboard**
2. **Выберите проект `tradestatistic`**
3. **Перейдите в Variables**
4. **Добавьте переменную:**
   ```
   INIT_DB = "true"
   ```
5. **Сохраните изменения**
6. **Перезапустите деплой**

### **Вариант 2: Ручное выполнение SQL**

1. **Подключитесь к Railway PostgreSQL через psql:**
   ```bash
   psql "postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway"
   ```

2. **Выполните SQL:**
   ```sql
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
   CREATE INDEX idx_websocket_data_exchange_id ON websocket_data(exchange_id);
   CREATE INDEX idx_websocket_data_timestamp ON websocket_data(timestamp);
   CREATE INDEX idx_websocket_data_symbol ON websocket_data(symbol);
   ```

### **Вариант 3: Локальный скрипт**

1. **Перейдите в директорию проекта:**
   ```bash
   cd /Users/bagrat/crypto-trading-bot
   ```

2. **Запустите скрипт исправления:**
   ```bash
   node fix_websocket_table_final.js
   ```

## 📊 **Проверка исправления:**

После исправления в логах должно исчезнуть:
- ❌ `column "symbol" of relation "websocket_data" does not exist`

И появиться:
- ✅ **WebSocket данные сохраняются**
- ✅ **Нет ошибок с базой данных**

## 🎯 **СТРУКТУРА ТАБЛИЦЫ:**

```sql
websocket_data:
- id (SERIAL PRIMARY KEY)
- exchange_id (INTEGER NOT NULL)
- symbol (VARCHAR(20) NOT NULL) ← ЭТА КОЛОНКА ОТСУТСТВУЕТ
- data_type (VARCHAR(50) NOT NULL)
- raw_data (TEXT)
- processed_data (JSONB)
- timestamp (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## 🚀 **Готово!**

После исправления все WebSocket данные будут сохраняться корректно.

---
**🔧 Рекомендую использовать Вариант 1 - добавить `INIT_DB = "true"` в Railway Variables!** 