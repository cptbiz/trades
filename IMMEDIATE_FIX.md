# 🚨 НЕМЕДЛЕННОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМЫ pair_symbol

## ✅ Что сделано:

1. **Временно отключено сохранение WebSocket данных** - ошибки больше не будут появляться
2. **Создан скрипт `fix_table_structure.js`** для исправления структуры таблицы
3. **Все изменения отправлены в GitHub**

## 🔧 Следующие шаги:

### Вариант 1: Через Railway PostgreSQL Dashboard

1. **Откройте Railway Dashboard**
2. **Перейдите в PostgreSQL сервис** (postage)
3. **Найдите SQL Editor**
4. **Выполните эти команды:**

```sql
-- Делаем pair_symbol nullable
ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL;

-- Добавляем колонку symbol
ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);
```

### Вариант 2: Через Railway CLI

```bash
# Подключитесь к PostgreSQL
railway connect

# Выполните команды
psql -d $DATABASE_URL -c "ALTER TABLE websocket_data ALTER COLUMN pair_symbol DROP NOT NULL;"
psql -d $DATABASE_URL -c "ALTER TABLE websocket_data ADD COLUMN IF NOT EXISTS symbol VARCHAR(20);"
```

## 🔄 После исправления:

1. **Перезапустите деплой в Railway**
2. **Раскомментируйте код** в `hybrid_collector.js` (удалите `return;` и `/* */`)
3. **Отправьте изменения в GitHub**

## 📊 Текущий статус:

- ✅ **Ошибки остановлены** - WebSocket данные временно не сохраняются
- ✅ **Тикеры и свечи работают** - основные данные собираются
- ⏳ **Ожидает исправления структуры таблицы**

---

**🎯 Цель:** Исправить структуру таблицы `websocket_data` и возобновить сохранение WebSocket данных 