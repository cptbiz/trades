# 🔧 Railway Variables - Полный список

## 📋 **СКОПИРУЙТЕ ВСЕ ПЕРЕМЕННЫЕ ОДНИМ СООБЩЕНИЕМ:**

```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
NODE_ENV = production
PORT = 8082
LOG_LEVEL = info
INIT_DB = true
WS_RECONNECT_INTERVAL = 5000
WS_PING_INTERVAL = 20000
API_RATE_LIMIT = 100
API_TIMEOUT = 30000
```

## ✅ **КАК ДОБАВИТЬ В RAILWAY:**

1. **Перейдите в Railway Dashboard**
2. **Выберите сервис `tradestatistic`**
3. **Перейдите в Variables**
4. **Скопируйте весь блок выше и вставьте**

## 📊 **ОБЪЯСНЕНИЕ ПЕРЕМЕННЫХ:**

- `DATABASE_URL` - подключение к PostgreSQL (автоматически от Railway)
- `NODE_ENV` - окружение (production для Railway)
- `PORT` - порт приложения (8082 для Railway)
- `LOG_LEVEL` - уровень логирования (info)
- `INIT_DB` - инициализация базы данных при запуске
- `WS_RECONNECT_INTERVAL` - интервал переподключения WebSocket (5 сек)
- `WS_PING_INTERVAL` - интервал ping для WebSocket (20 сек)
- `API_RATE_LIMIT` - лимит запросов к API (100)
- `API_TIMEOUT` - таймаут для API запросов (30 сек)

## 🎯 **ОЖИДАЕМЫЕ ЛОГИ ПОСЛЕ НАСТРОЙКИ:**

```
🚂 Railway Environment Detected!
✅ Railway PostgreSQL URL detected
🔗 DATABASE_URL: postgresql://postgres:...@postgres.railway.internal:5432/railway...
✅ Railway internal PostgreSQL URL confirmed
📋 Environment Configuration:
  - NODE_ENV: production
  - PORT: 8082
  - DATABASE_URL: SET
  - RAILWAY_DOMAIN: tradestatistic-production.up.railway.app
✅ Подключение к базе данных установлено
📊 Найдено таблиц: 6
🗄️ Инициализация базы данных Railway...
✅ База данных успешно инициализирована!
```

---

**📋 Скопируйте весь блок переменных выше и вставьте в Railway Variables!** 