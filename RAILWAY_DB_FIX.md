# 🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С БАЗОЙ ДАННЫХ RAILWAY

## ⚠️ **Проблема:**

В логах Railway видна ошибка:
```
❌ Ошибка сохранения WebSocket данных: column "symbol" of relation "websocket_data" does not exist
```

Это означает, что таблица `websocket_data` не была создана с правильной схемой.

## ✅ **Решение:**

### 🎯 **Вариант 1: Автоматическая инициализация**

Добавьте переменную в Railway Variables:
```
INIT_DB = "true"
```

### 🎯 **Вариант 2: Ручная инициализация**

1. **Подключитесь к Railway PostgreSQL через psql:**
   ```bash
   psql "postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway"
   ```

2. **Выполните SQL схему:**
   ```sql
   -- Создание таблицы WebSocket данных
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

1. **Добавьте в Railway Variables:**
   ```
   INIT_DB = "true"
   ```

2. **Перезапустите деплой**

## 📊 **Проверка исправления:**

После исправления в логах должно появиться:
- ✅ **Таблицы созданы успешно**
- ✅ **WebSocket данные сохраняются**
- ✅ **Нет ошибок "column does not exist"**

## 🚀 **Готово!**

После исправления база данных будет работать корректно и все WebSocket данные будут сохраняться.

---
**🔧 Выберите любой из вариантов выше для исправления проблемы!** 