#!/usr/bin/env node

const express = require('express');
const twig = require('twig');
const path = require('path');
const OIManager = require('./src/modules/oi/oi_manager');
const OIHttp = require('./src/modules/oi/oi_http');

console.log('🚀 Starting OI Dashboard...');

// Initialize OI Manager
const oiManager = new OIManager();
const oiHttp = new OIHttp(oiManager);

// Initialize OI data
oiManager.init();

// Start simulation timer
setInterval(() => {
    oiManager.simulateOIData();
}, 10000); // Update every 10 seconds

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

// OI Dashboard routes
app.use('/oi', oiHttp.getRouter());

// API routes
app.use('/api/oi', oiHttp.getRouter());

// Start server
const port = process.env.PORT || 8080;
const ip = process.env.IP || '0.0.0.0';

app.listen(port, ip, () => {
    console.log(`🚀 OI Dashboard started on http://${ip}:${port}`);
    console.log(`📊 Dashboard available at http://${ip}:${port}/oi`);
    console.log(`🔌 WebSocket available at ws://${ip}:${port}/oi/ws`);
    console.log(`📈 API available at http://${ip}:${port}/api/oi`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log('   GET  /oi                    - OI Dashboard');
    console.log('   GET  /api/oi/data           - Get OI data');
    console.log('   GET  /api/oi/statistics     - Get statistics');
    console.log('   GET  /api/oi/pairs          - Get available pairs');
    console.log('   GET  /api/oi/exchanges      - Get available exchanges');
    console.log('   POST /api/oi/simulate       - Simulate data');
    console.log('   WS   /oi/ws                 - WebSocket for real-time data');
    console.log('');
    console.log('🎯 Press Ctrl+C to stop the server');
}); 