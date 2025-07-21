const express = require('express');
const OIManager = require('./oi_manager');

class OIHttp {
    constructor(oiManager) {
        this.oiManager = oiManager;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Главная страница OI
        this.router.get('/', (req, res) => {
            res.render('oi_dashboard', {
                title: 'Open Interest Dashboard',
                exchanges: this.oiManager.getAvailableExchanges(),
                pairs: this.oiManager.getAvailablePairs()
            });
        });

        // API для получения всех OI данных
        this.router.get('/api/data', (req, res) => {
            try {
                const filter = {
                    exchange: req.query.exchange,
                    symbol: req.query.symbol,
                    sortBy: req.query.sortBy || 'openInterest',
                    sortOrder: req.query.sortOrder || 'desc'
                };
                
                const data = this.oiManager.getOIDataByFilter(filter);
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

        // API для получения статистики
        this.router.get('/api/statistics', (req, res) => {
            try {
                const stats = this.oiManager.getOIStatistics();
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

        // API для получения доступных пар
        this.router.get('/api/pairs', (req, res) => {
            try {
                const pairs = this.oiManager.getAvailablePairs();
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

        // API для получения доступных бирж
        this.router.get('/api/exchanges', (req, res) => {
            try {
                const exchanges = this.oiManager.getAvailableExchanges();
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

        // WebSocket endpoint для реального времени (будет добавлен позже)
        // this.router.ws('/ws', (ws, req) => {
        //     console.log('🔌 New WebSocket connection for OI data');
        //     
        //     // Отправляем начальные данные
        //     const data = this.oiManager.getAllOIData();
        //     ws.send(JSON.stringify({
        //         type: 'initial',
        //         data: data
        //     }));
        //
        //     // Подписываемся на обновления
        //     const unsubscribe = this.oiManager.subscribe((updatedData) => {
        //         ws.send(JSON.stringify({
        //             type: 'update',
        //             data: updatedData
        //         }));
        //     });
        //
        //     ws.on('close', () => {
        //         console.log('🔌 WebSocket connection closed');
        //         // В реальной реализации нужно отписаться
        //     });
        // });

        // API для симуляции данных (для демонстрации)
        this.router.post('/api/simulate', (req, res) => {
            try {
                this.oiManager.simulateOIData();
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
    }

    getRouter() {
        return this.router;
    }
}

module.exports = OIHttp; 