# ⚡ Quick Railway Setup

## 🚨 ПРОБЛЕМА
Railway показывает:
```
❌ ERROR: DATABASE_URL not found in Railway
🔧 Please add DATABASE_URL = ${{ Postgres.DATABASE_URL }} in Railway Variables
```

## ✅ БЫСТРОЕ РЕШЕНИЕ

### 1. **Добавьте переменные в Railway:**

**В Railway Dashboard → Variables добавьте:**

```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
NODE_ENV = production
PORT = 8082
LOG_LEVEL = info
```

### 2. **Проверьте PostgreSQL сервис:**

**В Railway Dashboard → Services:**
- ✅ PostgreSQL сервис должен быть добавлен
- ✅ Статус: "Running"

### 3. **Перезапустите деплой:**

**В Railway Dashboard → Deployments:**
- Найдите последний деплой
- Нажмите "Redeploy"

### 4. **Ожидаемые логи после настройки:**

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
```

### 5. **Проверка API:**

```bash
# Проверка переменных окружения
curl https://tradestatistic-production.up.railway.app/api/env

# Проверка статистики
curl https://tradestatistic-production.up.railway.app/api/stats
```

### 6. **Инициализация БД:**

После успешного подключения добавьте:
```
INIT_DB = true
```

---

**⚡ Выполните эти шаги прямо сейчас!** 