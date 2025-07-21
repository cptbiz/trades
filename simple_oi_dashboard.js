const express = require('express');
const twig = require('twig');
const path = require('path');

console.log('🚀 Starting Simple OI Dashboard...');

// Mock OI data for testing
const mockOIData = [
    {
        symbol: 'BTC/USDT:USDT',
        exchange: 'bybit_unified',
        name: 'Bitcoin',
        openInterest: 1234567,
        openInterestChange: 12345,
        openInterestChangePercent: 1.23,
        price: 45000,
        priceChange: 500,
        priceChangePercent: 2.5,
        volume24h: 5000000,
        fundingRate: 0.0001,
        longShortRatio: 1.5,
        lastUpdate: new Date().toISOString()
    },
    {
        symbol: 'ETH/USDT:USDT',
        exchange: 'bybit_unified',
        name: 'Ethereum',
        openInterest: 987654,
        openInterestChange: -5432,
        openInterestChangePercent: -0.55,
        price: 3200,
        priceChange: -50,
        priceChangePercent: -1.54,
        volume24h: 3000000,
        fundingRate: 0.0002,
        longShortRatio: 1.2,
        lastUpdate: new Date().toISOString()
    },
    {
        symbol: 'BTCUSDT',
        exchange: 'binance_futures',
        name: 'Bitcoin',
        openInterest: 2345678,
        openInterestChange: 23456,
        openInterestChangePercent: 1.01,
        price: 45100,
        priceChange: 600,
        priceChangePercent: 1.35,
        volume24h: 8000000,
        fundingRate: 0.0003,
        longShortRatio: 1.8,
        lastUpdate: new Date().toISOString()
    },
    {
        symbol: 'ETHUSDT',
        exchange: 'binance_futures',
        name: 'Ethereum',
        openInterest: 876543,
        openInterestChange: 1234,
        openInterestChangePercent: 0.14,
        price: 3180,
        priceChange: 30,
        priceChangePercent: 0.95,
        volume24h: 4000000,
        fundingRate: 0.0001,
        longShortRatio: 1.3,
        lastUpdate: new Date().toISOString()
    },
    {
        symbol: 'SOL/USDT:USDT',
        exchange: 'bybit_unified',
        name: 'Solana',
        openInterest: 345678,
        openInterestChange: 5678,
        openInterestChangePercent: 1.67,
        price: 95,
        priceChange: 5,
        priceChangePercent: 5.56,
        volume24h: 1500000,
        fundingRate: 0.0005,
        longShortRatio: 2.1,
        lastUpdate: new Date().toISOString()
    }
];

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/static', express.static(path.join(__dirname, 'web/static')));

// View engine
app.set('view engine', 'twig');
app.set('views', path.join(__dirname, 'templates'));

// Routes
app.get('/', (req, res) => {
    res.redirect('/oi');
});

// OI Dashboard route
app.get('/oi', (req, res) => {
    res.render('oi_dashboard', {
        title: 'Open Interest Dashboard',
        exchanges: ['bybit_unified', 'binance_futures', 'coinbase_pro'],
        pairs: mockOIData.map(item => ({ symbol: item.symbol, exchange: item.exchange, name: item.name }))
    });
});

// API routes
app.get('/api/oi/data', (req, res) => {
    try {
        let data = [...mockOIData];
        
        // Filter by exchange
        if (req.query.exchange) {
            data = data.filter(item => item.exchange === req.query.exchange);
        }
        
        // Filter by symbol
        if (req.query.symbol) {
            data = data.filter(item => item.symbol.includes(req.query.symbol.toUpperCase()));
        }
        
        // Sort data
        const sortBy = req.query.sortBy || 'openInterest';
        const sortOrder = req.query.sortOrder || 'desc';
        
        data.sort((a, b) => {
            if (sortOrder === 'asc') {
                return a[sortBy] - b[sortBy];
            } else {
                return b[sortBy] - a[sortBy];
            }
        });
        
        res.json({
            success: true,
            data: data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/oi/statistics', (req, res) => {
    try {
        const data = mockOIData;
        const stats = {
            totalPairs: data.length,
            exchanges: [...new Set(data.map(item => item.exchange))],
            totalOpenInterest: data.reduce((sum, item) => sum + item.openInterest, 0),
            averageOpenInterestChange: data.reduce((sum, item) => sum + item.openInterestChangePercent, 0) / data.length,
            topGainers: data.filter(item => item.openInterestChangePercent > 0)
                .sort((a, b) => b.openInterestChangePercent - a.openInterestChangePercent)
                .slice(0, 5),
            topLosers: data.filter(item => item.openInterestChangePercent < 0)
                .sort((a, b) => a.openInterestChangePercent - b.openInterestChangePercent)
                .slice(0, 5),
            highestOI: data.sort((a, b) => b.openInterest - a.openInterest).slice(0, 5),
            lowestOI: data.sort((a, b) => a.openInterest - b.openInterest).slice(0, 5)
        };
        
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/oi/pairs', (req, res) => {
    try {
        const pairs = mockOIData.map(item => ({
            symbol: item.symbol,
            exchange: item.exchange,
            name: item.name
        }));
        
        res.json({
            success: true,
            data: pairs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/oi/exchanges', (req, res) => {
    try {
        const exchanges = [...new Set(mockOIData.map(item => item.exchange))];
        
        res.json({
            success: true,
            data: exchanges
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/oi/simulate', (req, res) => {
    try {
        // Simulate data updates
        mockOIData.forEach(item => {
            item.openInterest += Math.floor((Math.random() - 0.5) * 10000);
            item.openInterestChange = Math.floor((Math.random() - 0.5) * 5000);
            item.openInterestChangePercent = (Math.random() - 0.5) * 2;
            item.price += (Math.random() - 0.5) * 100;
            item.priceChange = (Math.random() - 0.5) * 50;
            item.priceChangePercent = (Math.random() - 0.5) * 3;
            item.volume24h += Math.floor((Math.random() - 0.5) * 100000);
            item.fundingRate = (Math.random() - 0.5) * 0.001;
            item.longShortRatio = Math.random() * 2 + 0.5;
            item.lastUpdate = new Date().toISOString();
        });
        
        res.json({
            success: true,
            message: 'OI data simulation triggered'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const port = process.env.PORT || 8080;
const ip = process.env.IP || '0.0.0.0';

app.listen(port, ip, () => {
    console.log(`🚀 Simple OI Dashboard started on http://${ip}:${port}`);
    console.log(`📊 Dashboard available at http://${ip}:${port}/oi`);
    console.log(`📈 API available at http://${ip}:${port}/api/oi`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   GET  /oi                    - OI Dashboard');
    console.log('   GET  /api/oi/data           - Get OI data');
    console.log('   GET  /api/oi/statistics     - Get statistics');
    console.log('   GET  /api/oi/pairs          - Get available pairs');
    console.log('   GET  /api/oi/exchanges      - Get available exchanges');
    console.log('   POST /api/oi/simulate       - Simulate data');
    console.log('');
    console.log('🎯 Press Ctrl+C to stop the server');
}); 