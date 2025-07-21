# 🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ RAILWAY

## ⚠️ **Проблема:**
```
❌ Ошибка сохранения WebSocket данных: column "symbol" of relation "websocket_data" does not exist
```

## ✅ **Решение (3 варианта):**

### 🎯 **Вариант 1: Автоматическое исправление**

Добавьте в Railway Variables:
```
INIT_DB = "true"
```

### 🎯 **Вариант 2: Ручное выполнение SQL**

1. **Подключитесь к Railway PostgreSQL:**
   ```bash
   psql "postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway"
   ```

2. **Выполните SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS websocket_data (
       id SERIAL PRIMARY KEY,
       exchange_id INTEGER NOT NULL,
       symbol VARCHAR(20) NOT NULL,
       data_type VARCHAR(50) NOT NULL,
       raw_data TEXT,
       processed_data JSONB,
       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

### 🎯 **Вариант 3: Использование скрипта**

1. **Запустите скрипт исправления:**
   ```bash
   node fix_railway_db.js
   ```

## 📊 **Проверка исправления:**

После исправления в логах должно исчезнуть:
- ❌ `column "symbol" of relation "websocket_data" does not exist`

И появиться:
- ✅ **WebSocket данные сохраняются**
- ✅ **Нет ошибок с базой данных**

## 🚀 **Готово!**

После исправления все WebSocket данные будут сохраняться корректно.

---
**🔧 Выберите любой из вариантов выше для быстрого исправления!** 