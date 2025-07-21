# 🔧 Railway Variables Setup

## 🚨 ПРОБЛЕМА
Railway показывает ошибку подключения к базе данных:
```
❌ Ошибка подключения к БД: connect ECONNREFUSED ::1:5432
```

## ✅ РЕШЕНИЕ: Правильная настройка переменных

### 1. **Настройка DATABASE_URL**

**В Railway Dashboard:**

1. **Перейдите в ваш сервис `tradestatistic`**
2. **Перейдите в Variables**
3. **Добавьте переменную:**
   ```
   DATABASE_URL = ${{ Postgres.DATABASE_URL }}
   ```

### 2. **Добавьте остальные переменные:**

```
NODE_ENV = production
PORT = 8082
LOG_LEVEL = info
```

### 3. **Проверьте подключение PostgreSQL:**

**В Railway Dashboard → Services должно быть:**
- ✅ PostgreSQL сервис добавлен
- ✅ Статус: "Running"
- ✅ `DATABASE_URL` автоматически установлен

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

### 5. **Если DATABASE_URL не найден:**

**Ошибка в логах:**
```
❌ ERROR: DATABASE_URL not found in Railway
🔧 Please add DATABASE_URL = ${{ Postgres.DATABASE_URL }} in Railway Variables
```

**Решение:**
1. Убедитесь, что PostgreSQL сервис добавлен
2. Добавьте переменную `DATABASE_URL = ${{ Postgres.DATABASE_URL }}`
3. Перезапустите деплой

### 6. **Проверка API:**

После настройки проверьте:

```bash
# Проверка переменных окружения
curl https://tradestatistic-production.up.railway.app/api/env

# Проверка статистики
curl https://tradestatistic-production.up.railway.app/api/stats
```

### 7. **Инициализация базы данных:**

После успешного подключения запустите инициализацию:

```bash
# В Railway Terminal
npm run init-db
```

Или добавьте переменную:
```
INIT_DB = true
```

## 🎯 Ожидаемый результат

После правильной настройки:

1. **Логи приложения** - без ошибок подключения к БД
2. **API `/api/env`** - возвращает правильные данные
3. **API `/api/stats`** - показывает статистику
4. **PostgreSQL логи** - без ошибок "column does not exist"

---

**🔧 Настройте Railway Variables прямо сейчас!** 