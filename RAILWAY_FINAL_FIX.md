# 🚨 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ pair_symbol

## ❌ Проблема:
```
❌ Ошибка сохранения WebSocket данных: null value in column "pair_symbol" of relation "websocket_data" violates not-null constraint
```

## ✅ Решение:

### Вариант 1: Через Railway PostgreSQL Dashboard

1. **Откройте Railway Dashboard**
2. **Перейдите в PostgreSQL сервис** (postage)
3. **Найдите SQL Editor** или **Query Tool**
4. **Выполните SQL скрипт** из файла `FIX_WEBSOCKET_TABLE.sql`:

```sql
-- Делаем колонку pair_symbol nullable
ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL;

-- Добавляем колонку symbol если её нет
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);
```

### Вариант 2: Через Railway CLI

```bash
# Подключитесь к PostgreSQL
railway connect

# Выполните SQL команды
psql -d $DATABASE_URL -c "ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL;"
psql -d $DATABASE_URL -c "ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);"
```

### Вариант 3: Автоматическое исправление

Код уже обновлен для автоматического определения структуры таблицы:

```javascript
// Проверяет структуру таблицы и адаптируется:
- Если есть колонка 'symbol' → использует её
- Если есть колонка 'pair_symbol' → использует её  
- Если нет ни одной → использует только exchange_id и data_type
```

## 🔄 Перезапуск:

После исправления структуры таблицы:

1. **Перезапустите деплой в Railway**
2. **Проверьте логи** - ошибки должны исчезнуть
3. **WebSocket данные будут сохраняться корректно**

## 📋 Проверка:

Выполните в PostgreSQL:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'websocket_data' 
ORDER BY ordinal_position;
```

**Результат должен показать:**
- `pair_symbol` с `is_nullable = YES`
- `symbol` с `is_nullable = YES` (если добавлена)

---

**🎯 Цель:** Устранить ошибку `not-null constraint` для колонки `pair_symbol` 