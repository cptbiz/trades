const express = require('express');
const twig = require('twig');
const path = require('path');
const RealOIData = require('./src/modules/oi/real_oi_data');

console.log('🚀 Starting Real OI Dashboard...');

// Initialize real OI data
const realOIData = new RealOIData();

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
        title: 'Real Open Interest Dashboard',
        exchanges: ['bybit_unified', 'binance_futures', 'coinbase_pro'],
        pairs: []
    });
});

// API routes
app.get('/api/oi/data', async (req, res) => {
    try {
        const filter = {
            exchange: req.query.exchange,
            symbol: req.query.symbol,
            sortBy: req.query.sortBy || 'openInterest',
            sortOrder: req.query.sortOrder || 'desc'
        };
        
        const data = realOIData.getOIDataByFilter(filter);
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

app.get('/api/oi/statistics', async (req, res) => {
    try {
        const data = realOIData.getAllOIData();
        const stats = {
            totalPairs: data.length,
            exchanges: [...new Set(data.map(item => item.exchange))],
            totalOpenInterest: data.reduce((sum, item) => sum + item.openInterest, 0),
            averageOpenInterestChange: data.length > 0 ? data.reduce((sum, item) => sum + item.openInterestChangePercent, 0) / data.length : 0,
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

app.get('/api/oi/pairs', async (req, res) => {
    try {
        const data = realOIData.getAllOIData();
        const pairs = data.map(item => ({
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

app.get('/api/oi/exchanges', async (req, res) => {
    try {
        const data = realOIData.getAllOIData();
        const exchanges = [...new Set(data.map(item => item.exchange))];
        
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

app.post('/api/oi/refresh', async (req, res) => {
    try {
        await realOIData.fetchAllOIData();
        res.json({
            success: true,
            message: 'OI data refreshed successfully'
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

app.listen(port, ip, async () => {
    console.log(`🚀 Real OI Dashboard started on http://${ip}:${port}`);
    console.log(`📊 Dashboard available at http://${ip}:${port}/oi`);
    console.log(`📈 API available at http://${ip}:${port}/api/oi`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   GET  /oi                    - OI Dashboard');
    console.log('   GET  /api/oi/data           - Get OI data');
    console.log('   GET  /api/oi/statistics     - Get statistics');
    console.log('   GET  /api/oi/pairs          - Get available pairs');
    console.log('   GET  /api/oi/exchanges      - Get available exchanges');
    console.log('   POST /api/oi/refresh        - Refresh data from exchanges');
    console.log('');
    console.log('🔄 Starting real-time data updates...');
    
    // Start real-time updates
    await realOIData.startRealTimeUpdates(30000); // Update every 30 seconds
    
    console.log('🎯 Press Ctrl+C to stop the server');
}); 