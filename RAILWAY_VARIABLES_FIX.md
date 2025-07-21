# 🔧 Railway Variables Fix

## 🚨 ПРОБЛЕМА
Railway показывает в логах:
```
❌ Ошибка подключения к БД: connect ECONNREFUSED ::1:5432
```

Это означает, что приложение пытается подключиться к локальной базе данных вместо Railway PostgreSQL.

## ✅ РЕШЕНИЕ

### 1. Проверьте Railway Variables

Зайдите в Railway Dashboard → Variables и убедитесь, что установлены:

**ОБЯЗАТЕЛЬНЫЕ:**
```
NODE_ENV=production
PORT=8082
```

**ПРОВЕРЬТЕ:**
- `DATABASE_URL` должен автоматически установлен Railway
- Убедитесь, что PostgreSQL добавлен как сервис

### 2. Проверьте PostgreSQL Service

В Railway Dashboard → Services должно быть:
- ✅ PostgreSQL сервис добавлен
- ✅ Статус: "Running"
- ✅ `DATABASE_URL` автоматически установлен

### 3. Ожидаемые логи после исправления

```
🚂 Railway Environment Detected!
✅ Railway PostgreSQL detected
📋 Environment Configuration:
  - NODE_ENV: production
  - PORT: 8082
  - DATABASE_URL: SET
  - RAILWAY_DOMAIN: tradestatistic-production.up.railway.app
🚂 Подключение к Railway PostgreSQL...
✅ Подключение к базе данных установлено
📊 Найдено таблиц: 4
```

### 4. Если проблема остается

1. **Принудительный перезапуск:**
   - Railway Dashboard → Deployments
   - Найдите последний деплой
   - Нажмите "Redeploy"

2. **Проверьте PostgreSQL:**
   - Railway Dashboard → Services
   - Убедитесь, что PostgreSQL работает
   - Проверьте логи PostgreSQL

3. **Проверьте переменные:**
   ```bash
   # В Railway Dashboard → Variables должно быть:
   NODE_ENV=production
   PORT=8082
   DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway
   ```

### 5. Тестирование

После исправления проверьте API:

```bash
# Проверка переменных окружения
curl https://tradestatistic-production.up.railway.app/api/env

# Проверка статистики
curl https://tradestatistic-production.up.railway.app/api/stats
```

## 🎯 Ожидаемый результат

API `/api/env` должен вернуть:
```json
{
  "success": true,
  "data": {
    "nodeEnv": "production",
    "port": 8082,
    "databaseUrl": "SET",
    "railwayDomain": "tradestatistic-production.up.railway.app",
    "railwayProject": "tradestatistic",
    "uptime": 123.45
  }
}
```

---

**🔧 Проверьте Railway Variables прямо сейчас!** 