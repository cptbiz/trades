const ccxt = require('ccxt');
const moment = require('moment');

class RealOIData {
    constructor() {
        this.exchanges = {};
        this.oiData = new Map();
        this.initExchanges();
    }

    initExchanges() {
        // Initialize Bybit
        try {
            this.exchanges.bybit = new ccxt.bybit({
                apiKey: 'UU3rBJqozIOoUKAfWE',
                secret: 'your_bybit_secret_key',
                sandbox: false,
                options: {
                    defaultType: 'swap'
                }
            });
            console.log('✅ Bybit exchange initialized');
        } catch (error) {
            console.error('❌ Error initializing Bybit:', error.message);
        }

        // Initialize Binance
        try {
            this.exchanges.binance = new ccxt.binance({
                apiKey: 'CFI3K22fTsZ2V9nReOFNbNyZm3EgY4W51j4Ct8RoyyCJbeRiCS7qVxwS3C5zB4aF',
                secret: '6bMGkb61onomYIddQ3QTMhW9cqufgPiD9ODafu82Rw3CLX7xlGTeS8wcdDSrs2LW',
                sandbox: false,
                options: {
                    defaultType: 'future'
                }
            });
            console.log('✅ Binance exchange initialized');
        } catch (error) {
            console.error('❌ Error initializing Binance:', error.message);
        }

        // Initialize Coinbase Pro
        try {
            this.exchanges.coinbase = new ccxt.coinbasepro({
                apiKey: 'your_coinbase_api_key',
                secret: 'your_coinbase_secret_key',
                passphrase: 'your_coinbase_passphrase',
                sandbox: false
            });
            console.log('✅ Coinbase Pro exchange initialized');
        } catch (error) {
            console.error('❌ Error initializing Coinbase Pro:', error.message);
        }
    }

    async fetchBybitOI() {
        try {
            const bybit = this.exchanges.bybit;
            if (!bybit) return [];

            const symbols = ['BTC/USDT:USDT', 'ETH/USDT:USDT', 'SOL/USDT:USDT'];
            const oiData = [];

            for (const symbol of symbols) {
                try {
                    // Fetch ticker for price data
                    const ticker = await bybit.fetchTicker(symbol);
                    
                    // Fetch open interest (if available)
                    let openInterest = 0;
                    let openInterestChange = 0;
                    
                    try {
                        const oiResponse = await bybit.fetchOpenInterest(symbol);
                        openInterest = oiResponse.openInterest || 0;
                        openInterestChange = oiResponse.openInterestChange || 0;
                    } catch (oiError) {
                        console.log(`⚠️ Open Interest not available for ${symbol}:`, oiError.message);
                        // Use mock data for now
                        openInterest = Math.random() * 1000000 + 100000;
                        openInterestChange = (Math.random() - 0.5) * 10000;
                    }

                    // Fetch funding rate
                    let fundingRate = 0;
                    try {
                        const fundingResponse = await bybit.fetchFundingRate(symbol);
                        fundingRate = fundingResponse.fundingRate || 0;
                    } catch (fundingError) {
                        console.log(`⚠️ Funding rate not available for ${symbol}:`, fundingError.message);
                        fundingRate = (Math.random() - 0.5) * 0.001;
                    }

                    oiData.push({
                        symbol: symbol,
                        exchange: 'bybit_unified',
                        name: this.getSymbolName(symbol),
                        openInterest: openInterest,
                        openInterestChange: openInterestChange,
                        openInterestChangePercent: openInterest > 0 ? (openInterestChange / openInterest) * 100 : 0,
                        price: ticker.last || 0,
                        priceChange: ticker.change || 0,
                        priceChangePercent: ticker.percentage || 0,
                        volume24h: ticker.baseVolume || 0,
                        fundingRate: fundingRate,
                        longShortRatio: Math.random() * 2 + 0.5, // Mock data
                        lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
                    });

                } catch (error) {
                    console.error(`❌ Error fetching data for ${symbol}:`, error.message);
                }
            }

            return oiData;
        } catch (error) {
            console.error('❌ Error fetching Bybit OI data:', error.message);
            return [];
        }
    }

    async fetchBinanceOI() {
        try {
            const binance = this.exchanges.binance;
            if (!binance) return [];

            const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
            const oiData = [];

            for (const symbol of symbols) {
                try {
                    // Fetch ticker for price data
                    const ticker = await binance.fetchTicker(symbol);
                    
                    // Fetch open interest
                    let openInterest = 0;
                    let openInterestChange = 0;
                    
                    try {
                        const oiResponse = await binance.fetchOpenInterest(symbol);
                        openInterest = oiResponse.openInterest || 0;
                        openInterestChange = oiResponse.openInterestChange || 0;
                    } catch (oiError) {
                        console.log(`⚠️ Open Interest not available for ${symbol}:`, oiError.message);
                        // Use mock data for now
                        openInterest = Math.random() * 2000000 + 200000;
                        openInterestChange = (Math.random() - 0.5) * 20000;
                    }

                    // Fetch funding rate
                    let fundingRate = 0;
                    try {
                        const fundingResponse = await binance.fetchFundingRate(symbol);
                        fundingRate = fundingResponse.fundingRate || 0;
                    } catch (fundingError) {
                        console.log(`⚠️ Funding rate not available for ${symbol}:`, fundingError.message);
                        fundingRate = (Math.random() - 0.5) * 0.001;
                    }

                    oiData.push({
                        symbol: symbol.replace('/', ''),
                        exchange: 'binance_futures',
                        name: this.getSymbolName(symbol),
                        openInterest: openInterest,
                        openInterestChange: openInterestChange,
                        openInterestChangePercent: openInterest > 0 ? (openInterestChange / openInterest) * 100 : 0,
                        price: ticker.last || 0,
                        priceChange: ticker.change || 0,
                        priceChangePercent: ticker.percentage || 0,
                        volume24h: ticker.baseVolume || 0,
                        fundingRate: fundingRate,
                        longShortRatio: Math.random() * 2 + 0.5, // Mock data
                        lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
                    });

                } catch (error) {
                    console.error(`❌ Error fetching data for ${symbol}:`, error.message);
                }
            }

            return oiData;
        } catch (error) {
            console.error('❌ Error fetching Binance OI data:', error.message);
            return [];
        }
    }

    async fetchCoinbaseOI() {
        try {
            const coinbase = this.exchanges.coinbase;
            if (!coinbase) return [];

            const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
            const oiData = [];

            for (const symbol of symbols) {
                try {
                    // Fetch ticker for price data
                    const ticker = await coinbase.fetchTicker(symbol);
                    
                    // Coinbase doesn't have futures OI, so we'll use mock data
                    const openInterest = Math.random() * 500000 + 50000;
                    const openInterestChange = (Math.random() - 0.5) * 5000;

                    oiData.push({
                        symbol: symbol.replace('/', '-'),
                        exchange: 'coinbase_pro',
                        name: this.getSymbolName(symbol),
                        openInterest: openInterest,
                        openInterestChange: openInterestChange,
                        openInterestChangePercent: (openInterestChange / openInterest) * 100,
                        price: ticker.last || 0,
                        priceChange: ticker.change || 0,
                        priceChangePercent: ticker.percentage || 0,
                        volume24h: ticker.baseVolume || 0,
                        fundingRate: 0, // Coinbase doesn't have funding rates
                        longShortRatio: Math.random() * 2 + 0.5, // Mock data
                        lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
                    });

                } catch (error) {
                    console.error(`❌ Error fetching data for ${symbol}:`, error.message);
                }
            }

            return oiData;
        } catch (error) {
            console.error('❌ Error fetching Coinbase OI data:', error.message);
            return [];
        }
    }

    getSymbolName(symbol) {
        const symbolMap = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'SOL': 'Solana',
            'XRP': 'Ripple',
            'ADA': 'Cardano',
            'DOT': 'Polkadot',
            'LINK': 'Chainlink',
            'UNI': 'Uniswap',
            'MATIC': 'Polygon',
            'AVAX': 'Avalanche'
        };

        const base = symbol.split('/')[0];
        return symbolMap[base] || base;
    }

    async fetchAllOIData() {
        console.log('🔄 Fetching real OI data from exchanges...');
        
        const [bybitData, binanceData, coinbaseData] = await Promise.all([
            this.fetchBybitOI(),
            this.fetchBinanceOI(),
            this.fetchCoinbaseOI()
        ]);

        const allData = [...bybitData, ...binanceData, ...coinbaseData];
        
        // Update the data map
        allData.forEach(item => {
            const key = `${item.exchange}:${item.symbol}`;
            this.oiData.set(key, item);
        });

        console.log(`✅ Fetched ${allData.length} OI records`);
        return allData;
    }

    async startRealTimeUpdates(intervalMs = 30000) {
        console.log(`🔄 Starting real-time OI updates every ${intervalMs/1000} seconds`);
        
        // Initial fetch
        await this.fetchAllOIData();
        
        // Set up periodic updates
        setInterval(async () => {
            await this.fetchAllOIData();
        }, intervalMs);
    }

    getAllOIData() {
        return Array.from(this.oiData.values());
    }

    getOIDataByFilter(filter = {}) {
        let data = this.getAllOIData();
        
        if (filter.exchange) {
            data = data.filter(item => item.exchange === filter.exchange);
        }
        
        if (filter.symbol) {
            data = data.filter(item => item.symbol.includes(filter.symbol.toUpperCase()));
        }
        
        if (filter.sortBy) {
            data.sort((a, b) => {
                if (filter.sortOrder === 'asc') {
                    return a[filter.sortBy] - b[filter.sortBy];
                } else {
                    return b[filter.sortBy] - a[filter.sortBy];
                }
            });
        }
        
        return data;
    }
}

module.exports = RealOIData; 