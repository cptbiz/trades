# WebSocket API: Полное руководство по доступным потокам данных

## 🚀 Обзор

Биржа Binance предоставляет разработчикам и трейдерам мощный инструмент для получения рыночных данных и информации о счетах в режиме реального времени — WebSocket API. Это позволяет создавать высокопроизводительные торговые приложения, ботов, аналитические инструменты и многое другое.

## 📡 Основные адреса для подключения (Base Endpoints)

Binance предлагает несколько WebSocket-экосистем в зависимости от рынка:

### 🔗 **Спотовый рынок**
- **URL**: `wss://stream.binance.com:9443` или `wss://stream.binance.com:443`
- **Описание**: Данные спотовой торговли

### 🔗 **Фьючерсы USDⓈ-M**
- **URL**: `wss://fstream.binance.com`
- **Описание**: Данные фьючерсов с USD-маржой

### 🔗 **Фьючерсы COIN-M**
- **URL**: `wss://dstream.binance.com`
- **Описание**: Данные фьючерсов с криптовалютной маржой

### 🔗 **Опционы**
- **URL**: `wss://ws-option.binance.com`
- **Описание**: Данные опционной торговли

## 🔌 Подключение к потокам

### Одиночный поток
```
/ws/<streamName>
```

### Комбинированный поток
```
/stream?streams=<streamName1>/<streamName2>/<streamName3>
```

## 📊 Доступные потоки данных

### 1. **Ticker Streams (24hr Ticker)**
```
<symbol>@ticker
```

**Примеры:**
- `btcusdt@ticker` - BTC/USDT тикер
- `ethusdt@ticker` - ETH/USDT тикер
- `solusdt@ticker` - SOL/USDT тикер

**Данные включают:**
- Текущую цену
- Изменение цены за 24 часа
- Объем торгов
- Максимальную/минимальную цену
- Количество сделок

### 2. **Trade Streams (Сделки)**
```
<symbol>@trade
```

**Примеры:**
- `btcusdt@trade` - Сделки BTC/USDT
- `ethusdt@trade` - Сделки ETH/USDT

**Данные включают:**
- Цену сделки
- Количество
- Время сделки
- Направление (buy/sell)

### 3. **Kline/Candlestick Streams (Свечи)**
```
<symbol>@kline_<interval>
```

**Интервалы:**
- `1m`, `3m`, `5m`, `15m`, `30m`
- `1h`, `2h`, `4h`, `6h`, `8h`, `12h`
- `1d`, `3d`, `1w`, `1M`

**Примеры:**
- `btcusdt@kline_1m` - 1-минутные свечи BTC/USDT
- `ethusdt@kline_1h` - 1-часовые свечи ETH/USDT

### 4. **Depth Streams (Глубина рынка)**
```
<symbol>@depth
```

**Примеры:**
- `btcusdt@depth` - Глубина рынка BTC/USDT
- `ethusdt@depth` - Глубина рынка ETH/USDT

**Данные включают:**
- Ордера на покупку (bids)
- Ордера на продажу (asks)

### 5. **Depth Snapshot Streams (Снимок глубины)**
```
<symbol>@depth@100ms
```

**Примеры:**
- `btcusdt@depth@100ms` - Снимок глубины BTC/USDT каждые 100мс

### 6. **Mark Price Streams (Маркировочная цена)**
```
<symbol>@markPrice
```

**Примеры:**
- `btcusdt@markPrice` - Маркировочная цена BTC/USDT
- `ethusdt@markPrice` - Маркировочная цена ETH/USDT

### 7. **Funding Rate Streams (Ставка финансирования)**
```
<symbol>@fundingRate
```

**Примеры:**
- `btcusdt@fundingRate` - Ставка финансирования BTC/USDT
- `ethusdt@fundingRate` - Ставка финансирования ETH/USDT

### 8. **Open Interest Streams (Открытый интерес)**
```
<symbol>@openInterest
```

**Примеры:**
- `btcusdt@openInterest` - Открытый интерес BTC/USDT
- `ethusdt@openInterest` - Открытый интерес ETH/USDT

## 🔧 Реализация в нашем проекте

### WebSocket клиент для Binance

```javascript
const WebSocket = require('ws');

// Подключение к Binance Futures WebSocket
const binanceWS = new WebSocket('wss://fstream.binance.com/ws');

binanceWS.on('open', () => {
    console.log('✅ Binance WebSocket connected');
    
    // Подписка на несколько потоков
    const subscribeMsg = {
        method: 'SUBSCRIBE',
        params: [
            'btcusdt@ticker',
            'ethusdt@ticker',
            'solusdt@ticker',
            'xrpusdt@ticker'
        ],
        id: 1
    };
    
    binanceWS.send(JSON.stringify(subscribeMsg));
});

binanceWS.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        handleBinanceMessage(message);
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

binanceWS.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

binanceWS.on('close', () => {
    console.log('🔌 WebSocket disconnected, reconnecting...');
    setTimeout(() => initializeWebSocket(), 5000);
});
```

### Обработка сообщений

```javascript
function handleBinanceMessage(message) {
    if (message.e === '24hrTicker') {
        const symbol = message.s;
        const price = parseFloat(message.c);
        const priceChange = parseFloat(message.P);
        const volume = parseFloat(message.v);
        
        console.log(`📊 ${symbol}: $${price} (${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%)`);
        
        // Обновление данных в реальном времени
        updatePriceData(symbol, price, priceChange, volume);
    }
}
```

## 📈 Структура данных

### Ticker Stream (24hr Ticker)

```json
{
  "e": "24hrTicker",     // Тип события
  "E": 123456789,        // Время события
  "s": "BTCUSDT",        // Символ
  "p": "0.0015",         // Изменение цены за 24ч
  "P": "250.17",         // Изменение цены за 24ч (%)
  "w": "0.0018",         // Средневзвешенная цена
  "x": "0.0009",         // Цена открытия
  "c": "0.0025",         // Текущая цена
  "Q": "10",             // Объем последней сделки
  "b": "0.0024",         // Лучшая цена покупки
  "B": "10",             // Лучший объем покупки
  "a": "0.0026",         // Лучшая цена продажи
  "A": "100",            // Лучший объем продажи
  "o": "0.0010",         // Цена открытия
  "h": "0.0025",         // Максимальная цена
  "l": "0.0010",         // Минимальная цена
  "v": "10000",          // Объем торгов
  "q": "18",             // Объем котировок
  "O": 0,                // Время открытия
  "C": 86400000,         // Время закрытия
  "F": 0,                // ID первой сделки
  "L": 18150,            // ID последней сделки
  "n": 18151             // Количество сделок
}
```

### Trade Stream

```json
{
  "e": "trade",          // Тип события
  "E": 123456785,        // Время события
  "s": "BTCUSDT",        // Символ
  "t": 12345,            // ID сделки
  "p": "0.001",          // Цена
  "q": "100",            // Количество
  "b": 88,               // ID покупателя
  "a": 50,               // ID продавца
  "T": 123456785,        // Время сделки
  "m": true,             // Покупатель является маркет-мейкером
  "M": true              // Игнорировать
}
```

## 🛠️ Практические примеры

### 1. Подписка на тикеры нескольких пар

```javascript
const streams = [
    'btcusdt@ticker',
    'ethusdt@ticker', 
    'solusdt@ticker',
    'xrpusdt@ticker'
].join('/');

const wsUrl = `wss://fstream.binance.com/stream?streams=${streams}`;
const ws = new WebSocket(wsUrl);
```

### 2. Подписка на свечи и тикеры

```javascript
const streams = [
    'btcusdt@ticker',
    'btcusdt@kline_1m',
    'ethusdt@ticker',
    'ethusdt@kline_1h'
].join('/');

const wsUrl = `wss://fstream.binance.com/stream?streams=${streams}`;
const ws = new WebSocket(wsUrl);
```

### 3. Обработка ошибок и переподключение

```javascript
function initializeWebSocket() {
    const ws = new WebSocket('wss://fstream.binance.com/ws');
    
    ws.on('open', () => {
        console.log('✅ Connected to Binance WebSocket');
        subscribeToStreams(ws);
    });
    
    ws.on('message', (data) => {
        handleMessage(JSON.parse(data));
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
    });
    
    ws.on('close', () => {
        console.log('🔌 WebSocket closed, reconnecting...');
        setTimeout(initializeWebSocket, 5000);
    });
    
    return ws;
}
```

## 🔒 Безопасность и ограничения

### Rate Limits
- **Подписки**: 5 подписок в секунду
- **Отписки**: 5 отписок в секунду
- **Потоки**: Максимум 1024 потока на соединение

### Рекомендации
1. **Обработка ошибок**: Всегда обрабатывайте ошибки соединения
2. **Переподключение**: Реализуйте автоматическое переподключение
3. **Heartbeat**: Используйте ping/pong для проверки соединения
4. **Множественные соединения**: Для больших объемов данных используйте несколько соединений

## 📊 Мониторинг и логирование

```javascript
// Логирование статистики
setInterval(() => {
    console.log(`📊 Stats: ${messagesReceived} messages, ${errors} errors`);
}, 60000);

// Мониторинг соединения
ws.on('ping', () => {
    console.log('🏓 Received ping');
    ws.pong();
});

ws.on('pong', () => {
    console.log('🏓 Received pong');
});
```

## 🎯 Заключение

WebSocket API Binance предоставляет мощные возможности для получения данных в реальном времени. Правильная реализация позволяет создавать высокопроизводительные торговые системы с минимальной задержкой.

### Ключевые преимущества:
- ✅ **Реальное время**: Данные обновляются мгновенно
- ✅ **Низкая задержка**: Минимальная задержка передачи данных
- ✅ **Эффективность**: Одно соединение для множества потоков
- ✅ **Надежность**: Автоматическое переподключение и обработка ошибок

### Следующие шаги:
1. Реализуйте обработку всех типов потоков
2. Добавьте фильтрацию и агрегацию данных
3. Создайте систему алертов на основе WebSocket данных
4. Интегрируйте с торговыми алгоритмами 