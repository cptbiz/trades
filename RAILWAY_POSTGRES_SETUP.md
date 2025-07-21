# 🗄️ Railway PostgreSQL Setup

## 📊 **ВАШИ ДАННЫЕ POSTGRESQL:**

- **Domain:** `postgres-production-8227.up.railway.app`
- **Port:** `8080`
- **TCP Proxy:** `turntable.proxy.rlwy.net:37516`
- **Internal Port:** `5432`

## ✅ **НАСТРОЙКА В RAILWAY DASHBOARD:**

### 1. **Добавьте переменные в сервис `tradestatistic`:**

**Railway Dashboard → Variables:**

```
DATABASE_URL = ${{ Postgres.DATABASE_URL }}
NODE_ENV = production
PORT = 8082
LOG_LEVEL = info
```

### 2. **Проверьте подключение PostgreSQL:**

**В Railway Terminal запустите:**
```bash
npm run test-db
```

**Ожидаемый результат:**
```
🔍 Testing Railway PostgreSQL Connection
=====================================
📋 Environment Variables:
  DATABASE_URL: SET
  NODE_ENV: production
  PORT: 8082

🔗 Testing PostgreSQL connection...
✅ PostgreSQL connection successful
   Test query result: 1
📊 PostgreSQL version:
   PostgreSQL 15.4 on x86_64-pc-linux-gnu
📋 Found 0 tables:
💾 Database size: 8.0 MB

🎉 Railway PostgreSQL connection test PASSED!
```

### 3. **Инициализация базы данных:**

После успешного подключения запустите:
```bash
npm run init-db
```

### 4. **Проверка API:**

```bash
# Проверка переменных окружения
curl https://tradestatistic-production.up.railway.app/api/env

# Проверка статистики
curl https://tradestatistic-production.up.railway.app/api/stats
```

## 🚨 **ЕСЛИ ПРОБЛЕМЫ:**

### **Ошибка подключения:**
```
❌ ERROR connecting to PostgreSQL:
   connect ECONNREFUSED ::1:5432
```

**Решение:**
1. Убедитесь, что PostgreSQL сервис добавлен
2. Проверьте переменную `DATABASE_URL = ${{ Postgres.DATABASE_URL }}`
3. Перезапустите деплой

### **Ошибка SSL:**
```
❌ ERROR connecting to PostgreSQL:
   self signed certificate in certificate chain
```

**Решение:**
- SSL уже настроен в коде с `rejectUnauthorized: false`

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
```

---

**🔧 Настройте Railway Variables с вашими данными PostgreSQL!** 