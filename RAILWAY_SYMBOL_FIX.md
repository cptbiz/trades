# 🔧 ИСПРАВЛЕНИЕ КОЛОНКИ SYMBOL В RAILWAY

## ✅ **ПРОБЛЕМА:**
```
ERROR: column "symbol" of relation "websocket_data" does not exist at character 59
```

## 🚀 **БЫСТРОЕ РЕШЕНИЕ:**

### **Вариант 1: Через Railway Dashboard (РЕКОМЕНДУЕТСЯ)**

1. **Перейдите в Railway Dashboard**
2. **Выберите проект `tradestatistic`**
3. **Перейдите в Variables**
4. **Добавьте переменную:**
   ```
   INIT_DB = "true"
   ```
5. **Сохраните изменения**
6. **Перезапустите деплой**

### **Вариант 2: Прямое выполнение SQL**

1. **Перейдите в Railway Dashboard**
2. **Выберите PostgreSQL сервис**
3. **Перейдите в Data → Query**
4. **Выполните SQL:**

```sql
-- Добавляем колонку symbol
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_websocket_data_symbol ON websocket_data(symbol);

-- Проверяем структуру
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position;
```

### **Вариант 3: Через psql (если доступен)**

```bash
psql "postgresql://postgres:pvVDFCUgBFcCTtkuCIgyeqcFlbUvXNtt@postgres.railway.internal:5432/railway"
```

Затем выполните SQL из Варианта 2.

## 📊 **Проверка исправления:**

После исправления в логах должно исчезнуть:
- ❌ `column "symbol" of relation "websocket_data" does not exist`

И появиться:
- ✅ **WebSocket данные сохраняются**
- ✅ **Нет ошибок с базой данных**

## 🎯 **СТРУКТУРА ТАБЛИЦЫ ПОСЛЕ ИСПРАВЛЕНИЯ:**

```sql
websocket_data:
- id (SERIAL PRIMARY KEY)
- exchange_id (INTEGER NOT NULL)
- symbol (VARCHAR(20)) ← ЭТА КОЛОНКА БУДЕТ ДОБАВЛЕНА
- data_type (VARCHAR(50) NOT NULL)
- raw_data (TEXT)
- processed_data (JSONB)
- timestamp (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## 🚀 **Готово!**

После исправления все WebSocket данные будут сохраняться корректно.

---
**🔧 Рекомендую использовать Вариант 1 - добавить `INIT_DB = "true"` в Railway Variables!** 