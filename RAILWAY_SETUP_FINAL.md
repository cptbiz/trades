# 🚀 ФИНАЛЬНАЯ НАСТРОЙКА RAILWAY

## 📋 **ВАРИАНТ 1: Использование ${{ Postgres.DATABASE_URL }}**

Скопируйте эти переменные в Railway Variables:

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

## 📋 **ВАРИАНТ 2: Использование Railway переменных**

Скопируйте эти переменные в Railway Variables:

```
DATABASE_URL = postgresql://${{POSTGRES_USER}}:${{POSTGRES_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:5432/${{POSTGRES_DB}}
NODE_ENV = production
PORT = 8082
LOG_LEVEL = info
INIT_DB = true
WS_RECONNECT_INTERVAL = 5000
WS_PING_INTERVAL = 20000
API_RATE_LIMIT = 100
API_TIMEOUT = 30000
```

## 🔧 **Шаги настройки:**

1. **Перейдите в Railway Dashboard**
2. **Выберите ваш проект**
3. **Перейдите в Variables**
4. **Добавьте переменные выше**
5. **Сохраните изменения**
6. **Перезапустите деплой**

## ✅ **Проверка:**

После добавления переменных проверьте:

- Логи деплоя показывают "✅ Railway PostgreSQL URL confirmed"
- Нет ошибок "DATABASE_URL not found"
- API доступен по адресу: `https://your-app.railway.app/api/env`

## 🎯 **Готово!**

Проект будет автоматически:
- Подключиться к PostgreSQL
- Инициализировать базу данных
- Запустить WebSocket коллекторы
- Открыть REST API

---
**🚀 Выберите любой из вариантов выше и добавьте переменные в Railway!** 