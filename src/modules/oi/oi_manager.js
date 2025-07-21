const _ = require('lodash');
const moment = require('moment');

class OIManager {
    constructor() {
        this.oiData = new Map();
        this.subscribers = [];
        this.exchanges = ['bybit_unified', 'binance_futures', 'coinbase_pro'];
        this.pairs = [
            // Bybit pairs
            { symbol: 'BTC/USDT:USDT', exchange: 'bybit_unified', name: 'Bitcoin' },
            { symbol: 'ETH/USDT:USDT', exchange: 'bybit_unified', name: 'Ethereum' },
            { symbol: 'SOL/USDT:USDT', exchange: 'bybit_unified', name: 'Solana' },
            { symbol: 'XRP/USDT:USDT', exchange: 'bybit_unified', name: 'Ripple' },
            { symbol: 'ADA/USDT:USDT', exchange: 'bybit_unified', name: 'Cardano' },
            
            // Binance Futures pairs
            { symbol: 'BTCUSDT', exchange: 'binance_futures', name: 'Bitcoin' },
            { symbol: 'ETHUSDT', exchange: 'binance_futures', name: 'Ethereum' },
            { symbol: 'SOLUSDT', exchange: 'binance_futures', name: 'Solana' },
            { symbol: 'XRPUSDT', exchange: 'binance_futures', name: 'Ripple' },
            { symbol: 'ADAUSDT', exchange: 'binance_futures', name: 'Cardano' },
            
            // Coinbase pairs
            { symbol: 'BTC-USD', exchange: 'coinbase_pro', name: 'Bitcoin' },
            { symbol: 'ETH-USD', exchange: 'coinbase_pro', name: 'Ethereum' },
            { symbol: 'SOL-USD', exchange: 'coinbase_pro', name: 'Solana' },
            { symbol: 'XRP-USD', exchange: 'coinbase_pro', name: 'Ripple' },
            { symbol: 'ADA-USD', exchange: 'coinbase_pro', name: 'Cardano' }
        ];
    }

    // Инициализация OI данных
    init() {
        console.log('🔍 Initializing OI Manager...');
        this.pairs.forEach(pair => {
            const key = `${pair.exchange}:${pair.symbol}`;
            this.oiData.set(key, {
                symbol: pair.symbol,
                exchange: pair.exchange,
                name: pair.name,
                openInterest: 0,
                openInterestChange: 0,
                openInterestChangePercent: 0,
                volume24h: 0,
                price: 0,
                priceChange: 0,
                priceChangePercent: 0,
                lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'),
                fundingRate: 0,
                longShortRatio: 0,
                topLongShortRatio: 0,
                topLongShortAccountRatio: 0
            });
        });
    }

    // Обновление OI данных
    updateOIData(exchange, symbol, data) {
        const key = `${exchange}:${symbol}`;
        const currentData = this.oiData.get(key);
        
        if (currentData) {
            const updatedData = {
                ...currentData,
                ...data,
                lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
            };
            
            this.oiData.set(key, updatedData);
            this.notifySubscribers(updatedData);
        }
    }

    // Получение OI данных для всех пар
    getAllOIData() {
        return Array.from(this.oiData.values());
    }

    // Получение OI данных по фильтру
    getOIDataByFilter(filter = {}) {
        let data = this.getAllOIData();
        
        if (filter.exchange) {
            data = data.filter(item => item.exchange === filter.exchange);
        }
        
        if (filter.symbol) {
            data = data.filter(item => item.symbol.includes(filter.symbol.toUpperCase()));
        }
        
        if (filter.sortBy) {
            data = _.orderBy(data, [filter.sortBy], [filter.sortOrder || 'desc']);
        }
        
        return data;
    }

    // Подписка на обновления OI
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    // Уведомление подписчиков
    notifySubscribers(data) {
        this.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in OI subscriber callback:', error);
            }
        });
    }

    // Симуляция OI данных (для демонстрации)
    simulateOIData() {
        this.pairs.forEach(pair => {
            const key = `${pair.exchange}:${pair.symbol}`;
            const currentData = this.oiData.get(key);
            
            if (currentData) {
                const simulatedData = {
                    openInterest: Math.random() * 1000000 + 100000,
                    openInterestChange: (Math.random() - 0.5) * 100000,
                    openInterestChangePercent: (Math.random() - 0.5) * 20,
                    volume24h: Math.random() * 5000000 + 1000000,
                    price: Math.random() * 50000 + 1000,
                    priceChange: (Math.random() - 0.5) * 1000,
                    priceChangePercent: (Math.random() - 0.5) * 10,
                    fundingRate: (Math.random() - 0.5) * 0.01,
                    longShortRatio: Math.random() * 2 + 0.5,
                    topLongShortRatio: Math.random() * 2 + 0.5,
                    topLongShortAccountRatio: Math.random() * 2 + 0.5
                };
                
                this.updateOIData(pair.exchange, pair.symbol, simulatedData);
            }
        });
    }

    // Получение статистики OI
    getOIStatistics() {
        const data = this.getAllOIData();
        
        return {
            totalPairs: data.length,
            exchanges: _.uniq(data.map(item => item.exchange)),
            totalOpenInterest: _.sumBy(data, 'openInterest'),
            averageOpenInterestChange: _.meanBy(data, 'openInterestChangePercent'),
            topGainers: _.orderBy(data, ['openInterestChangePercent'], ['desc']).slice(0, 5),
            topLosers: _.orderBy(data, ['openInterestChangePercent'], ['asc']).slice(0, 5),
            highestOI: _.orderBy(data, ['openInterest'], ['desc']).slice(0, 5),
            lowestOI: _.orderBy(data, ['openInterest'], ['asc']).slice(0, 5)
        };
    }

    // Получение доступных пар
    getAvailablePairs() {
        return this.pairs;
    }

    // Получение доступных бирж
    getAvailableExchanges() {
        return this.exchanges;
    }
}

module.exports = OIManager; 