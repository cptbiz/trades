# 📊 Open Interest Dashboard

## 🚀 Быстрый запуск

```bash
# Запуск OI дашборда
node start_oi_dashboard.js

# Или через npm
npm run oi-dashboard
```

## 🌐 Доступные URL

- **Дашборд**: http://localhost:8080/oi
- **API**: http://localhost:8080/api/oi
- **WebSocket**: ws://localhost:8080/oi/ws

## 📋 Возможности

### 🔍 Фильтрация и поиск
- **По бирже**: Bybit, Binance Futures, Coinbase Pro
- **По символу**: Поиск по названию криптовалюты
- **Сортировка**: По Open Interest, изменению OI, цене, объему

### 📊 Статистика
- **Общее количество пар**: Отслеживаемых активов
- **Общий Open Interest**: Сумма всех OI
- **Среднее изменение OI**: Процентное изменение
- **Время последнего обновления**: Актуальность данных

### 📈 Визуализация
- **Таблица данных**: Детальная информация по каждой паре
- **Графики**: Top Gainers и Top Losers
- **Цветовая индикация**: Зеленый/красный для изменений

### 🔌 Реальное время
- **WebSocket**: Автоматические обновления
- **Статус соединения**: Индикатор подключения
- **Автопереподключение**: При разрыве соединения

## 📊 Поддерживаемые данные

### Bybit
- BTC/USDT:USDT
- ETH/USDT:USDT
- SOL/USDT:USDT
- XRP/USDT:USDT
- ADA/USDT:USDT

### Binance Futures
- BTCUSDT
- ETHUSDT
- SOLUSDT
- XRPUSDT
- ADAUSDT

### Coinbase Pro
- BTC-USD
- ETH-USD
- SOL-USD
- XRP-USD
- ADA-USD

## 🔧 API Endpoints

### GET /api/oi/data
Получение данных Open Interest с фильтрацией

**Параметры:**
- `exchange` - биржа (bybit_unified, binance_futures, coinbase_pro)
- `symbol` - символ для поиска
- `sortBy` - поле для сортировки
- `sortOrder` - порядок сортировки (asc/desc)

**Пример:**
```bash
curl "http://localhost:8080/api/oi/data?exchange=bybit_unified&sortBy=openInterest&sortOrder=desc"
```

### GET /api/oi/statistics
Получение статистики

**Пример:**
```bash
curl "http://localhost:8080/api/oi/statistics"
```

### GET /api/oi/pairs
Получение списка доступных пар

**Пример:**
```bash
curl "http://localhost:8080/api/oi/pairs"
```

### POST /api/oi/simulate
Симуляция новых данных (для демонстрации)

**Пример:**
```bash
curl -X POST "http://localhost:8080/api/oi/simulate"
```

## 🔌 WebSocket API

### Подключение
```javascript
const ws = new WebSocket('ws://localhost:8080/oi/ws');

ws.onopen = function() {
    console.log('Connected to OI WebSocket');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};
```

### Формат сообщений

**Начальные данные:**
```json
{
    "type": "initial",
    "data": [
        {
            "symbol": "BTC/USDT:USDT",
            "exchange": "bybit_unified",
            "name": "Bitcoin",
            "openInterest": 1234567,
            "openInterestChange": 12345,
            "openInterestChangePercent": 1.23,
            "price": 45000,
            "priceChangePercent": 2.5,
            "volume24h": 5000000,
            "fundingRate": 0.0001,
            "longShortRatio": 1.5,
            "lastUpdate": "2024-01-01 12:00:00"
        }
    ]
}
```

**Обновления:**
```json
{
    "type": "update",
    "data": {
        "symbol": "BTC/USDT:USDT",
        "openInterest": 1234568,
        "openInterestChange": 1,
        "openInterestChangePercent": 0.0001
    }
}
```

## 🎨 Интерфейс

### Фильтры
- **Exchange**: Выбор биржи
- **Symbol**: Поиск по символу
- **Sort By**: Поле для сортировки
- **Order**: Порядок сортировки

### Статистические карточки
- **Total Pairs**: Количество пар
- **Total Open Interest**: Общий OI
- **Avg OI Change**: Среднее изменение
- **Last Update**: Время обновления

### Таблица данных
- **Symbol**: Символ и название
- **Exchange**: Биржа
- **Price**: Текущая цена
- **Price Change %**: Изменение цены
- **Open Interest**: Открытый интерес
- **OI Change**: Изменение OI
- **OI Change %**: Процентное изменение OI
- **24h Volume**: Объем за 24 часа
- **Funding Rate**: Ставка финансирования
- **Long/Short Ratio**: Соотношение лонг/шорт
- **Last Update**: Время последнего обновления

### Графики
- **Top Gainers**: Пары с наибольшим ростом OI
- **Top Losers**: Пары с наибольшим падением OI

## 🛠️ Разработка

### Структура файлов
```
src/modules/oi/
├── oi_manager.js      # Управление OI данными
└── oi_http.js         # HTTP API

templates/
└── oi_dashboard.html.twig  # HTML шаблон

start_oi_dashboard.js   # Скрипт запуска
```

### Добавление новых пар
Отредактируйте `src/modules/oi/oi_manager.js`:

```javascript
this.pairs = [
    // Добавьте новую пару
    { symbol: 'NEW/USDT:USDT', exchange: 'bybit_unified', name: 'New Token' }
];
```

### Добавление новых бирж
Отредактируйте `src/modules/oi/oi_manager.js`:

```javascript
this.exchanges = ['bybit_unified', 'binance_futures', 'coinbase_pro', 'new_exchange'];
```

## 🚀 Запуск в продакшене

### С PM2
```bash
# Установка PM2
npm install -g pm2

# Запуск
pm2 start start_oi_dashboard.js --name "oi-dashboard"

# Мониторинг
pm2 monit

# Логи
pm2 logs oi-dashboard
```

### С Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["node", "start_oi_dashboard.js"]
```

## 📝 Логи

Логи выводятся в консоль:
```
🚀 Starting OI Dashboard...
🚀 OI Dashboard started on http://0.0.0.0:8080
📊 Dashboard available at http://0.0.0.0:8080/oi
🔌 WebSocket available at ws://0.0.0.0:8080/oi/ws
📈 API available at http://0.0.0.0:8080/api/oi
🔍 Initializing OI Manager...
```

## 🎯 Следующие шаги

1. **Интеграция с реальными API**: Подключение к Bybit, Binance, Coinbase API
2. **Исторические данные**: Сохранение и анализ исторических OI
3. **Алерты**: Уведомления при значительных изменениях OI
4. **Торговые сигналы**: Автоматическая генерация сигналов на основе OI
5. **Мобильное приложение**: React Native или PWA версия 