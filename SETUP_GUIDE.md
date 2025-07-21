# 🚀 Crypto Trading Bot Setup Guide

## 📋 Установка и настройка

### 1. ✅ Установка завершена
- Репозиторий склонирован
- Зависимости установлены
- Node.js v22.17.1 готов к работе

### 2. 🔑 Настройка API ключей

#### Bybit API
1. Зарегистрируйтесь на [Bybit](https://www.bybit.com/)
2. Перейдите в API Management
3. Создайте новый API ключ с правами:
   - Read (для получения данных)
   - Trade (для торговли)
4. Скопируйте API Key и Secret Key

#### Binance API
1. Зарегистрируйтесь на [Binance](https://www.binance.com/)
2. Перейдите в API Management
3. Создайте новый API ключ
4. Включите торговлю (если планируете торговать)
5. Скопируйте API Key и Secret Key

#### Coinbase Pro API
1. Зарегистрируйтесь на [Coinbase Pro](https://pro.coinbase.com/)
2. Перейдите в API Settings
3. Создайте новый API ключ
4. Скопируйте API Key, Secret Key и Passphrase

### 3. ⚙️ Конфигурация

#### Шаг 1: Настройка конфигурации
```bash
# Скопируйте пример конфигурации
cp conf_example.json conf.json

# Отредактируйте conf.json и добавьте ваши API ключи
nano conf.json
```

#### Шаг 2: Настройка инстанса
```bash
# Используйте тестовый инстанс для начала
cp instance_test.js instance.js

# Или создайте свой собственный инстанс
nano instance.js
```

### 4. 🎯 Доступные стратегии

Бот поддерживает следующие стратегии:
- `dip_catcher` - Ловля дипов
- `macd` - MACD стратегия
- `cci` - CCI индикатор
- `awesome_oscillator_cross_zero` - Awesome Oscillator
- `obv_pump_dump` - OBV Pump & Dump
- `parabolicsar` - Parabolic SAR
- `pivot_reversal_strategy` - Pivot Reversal

### 5. 🚀 Запуск бота

#### Тестовый режим (только мониторинг)
```bash
node index.js trade
```

#### С веб-интерфейсом
```bash
node index.js server
```
Затем откройте http://localhost:8080

#### С торговлей (требует API ключи)
```bash
# Настройте instance.js с торговыми стратегиями
node index.js trade
```

### 6. 📊 Поддерживаемые пары

#### Bybit
- BTC/USDT:USDT
- ETH/USDT:USDT
- SOL/USDT:USDT
- И другие USDT пары

#### Binance
- BTCUSDT, ETHUSDT
- Все спотовые и фьючерсные пары

#### Coinbase Pro
- BTC-USD, ETH-USD
- Все доступные торговые пары

### 7. 🔧 Полезные команды

```bash
# Просмотр помощи
node index.js --help

# Запуск сервера
node index.js server

# Запуск торговли
node index.js trade

# Заполнение исторических данных
node index.js backfill
```

### 8. 📱 Уведомления

Настройте уведомления в conf.json:
- **Telegram**: Добавьте bot token и chat ID
- **Email**: Настройте SMTP сервер
- **Slack**: Добавьте webhook URL

### 9. 🛡️ Безопасность

⚠️ **ВАЖНО**: 
- Никогда не делитесь API ключами
- Используйте только API ключи с необходимыми правами
- Начните с тестового режима
- Используйте небольшие суммы для начала

### 10. 📈 Мониторинг

- Веб-интерфейс: http://localhost:8080
- Логи: Проверяйте консольный вывод
- База данных: SQLite файл создается автоматически

## 🎉 Готово!

Теперь у вас есть полнофункциональный криптотрейдинг бот с поддержкой Bybit, Binance и Coinbase API! 