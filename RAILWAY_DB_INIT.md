# 🗄️ Railway Database Initialization

## 🚨 ПРОБЛЕМА
Railway показывает ошибки в PostgreSQL логах:
```
ERROR: column "symbol" of relation "candles" does not exist
```

Это означает, что схема базы данных не соответствует коду.

## ✅ РЕШЕНИЕ

### 1. Инициализация базы данных

**В Railway Dashboard:**

1. **Перейдите в Variables**
2. **Добавьте переменную:**
   ```
   INIT_DB=true
   ```

3. **Или запустите инициализацию вручную:**
   ```bash
   # В Railway Terminal или через CLI
   npm run init-db
   ```

### 2. Проверка схемы

После инициализации должны быть созданы таблицы:
- ✅ `trading_pairs` - торговые пары
- ✅ `intervals` - временные интервалы
- ✅ `tickers` - тикеры
- ✅ `candles` - свечи (исправленная схема)
- ✅ `websocket_data` - WebSocket данные
- ✅ `signals` - сигналы

### 3. Ожидаемые логи после инициализации

```
🗄️ Инициализация базы данных Railway...
🔗 DATABASE_URL: SET
✅ Подключение к Railway PostgreSQL установлено
📝 Создание таблиц...
📊 Создано таблиц: 6
  - candles
  - intervals
  - signals
  - tickers
  - trading_pairs
  - websocket_data
📈 Торговых пар: 57
⏰ Интервалов: 6
✅ База данных успешно инициализирована!
```

### 4. Проверка API

После инициализации проверьте:

```bash
# Проверка переменных окружения
curl https://tradestatistic-production.up.railway.app/api/env

# Проверка статистики
curl https://tradestatistic-production.up.railway.app/api/stats
```

### 5. Если проблема остается

1. **Принудительная инициализация:**
   ```bash
   # В Railway Terminal
   node init_database.js
   ```

2. **Проверьте переменные:**
   ```
   DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
   NODE_ENV=production
   PORT=8082
   ```

3. **Перезапустите деплой:**
   - Railway Dashboard → Deployments
   - Найдите последний деплой
   - Нажмите "Redeploy"

## 🎯 Ожидаемый результат

После успешной инициализации:

1. **PostgreSQL логи** - без ошибок "column does not exist"
2. **API `/api/env`** - возвращает правильные данные
3. **API `/api/stats`** - показывает статистику
4. **WebSocket подключения** - работают без ошибок БД

---

**🔧 Запустите инициализацию базы данных в Railway!** 