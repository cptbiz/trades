const compression = require('compression');
const express = require('express');
const twig = require('twig');
const auth = require('basic-auth');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const moment = require('moment');
const OrderUtil = require('../utils/order_util');
const OIManager = require('./oi/oi_manager');
const OIHttp = require('./oi/oi_http');

module.exports = class HttpOI {
  constructor(systemUtil, ta, signalHttp, backtest, exchangeManager, pairsHttp, logsHttp, candleExportHttp, 
candleImporter, ordersHttp, tickers, projectDir) {
    this.systemUtil = systemUtil;
    this.ta = ta;
    this.signalHttp = signalHttp;
    this.backtest = backtest;
    this.exchangeManager = exchangeManager;
    this.pairsHttp = pairsHttp;
    this.logsHttp = logsHttp;
    this.candleExportHttp = candleExportHttp;
    this.candleImporter = candleImporter;
    this.ordersHttp = ordersHttp;
    this.projectDir = projectDir;
    this.tickers = tickers;
    
    // Initialize OI Manager
    this.oiManager = new OIManager();
    this.oiHttp = new OIHttp(this.oiManager);
  }

  start() {
    twig.extendFilter('price_format', value => {
      if (parseFloat(value) < 1) {
        return Intl.NumberFormat('en-US', {
          useGrouping: false,
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        }).format(value);
      }

      return Intl.NumberFormat('en-US', {
        useGrouping: false,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    });

    const assetVersion = crypto
      .createHash('md5')
      .update(String(Math.floor(Date.now() / 1000)))
      .digest('hex')
      .substring(0, 8);
    twig.extendFunction('asset_version', () => assetVersion);

    const desks = this.systemUtil.getConfig('desks', []).map(desk => desk.name);

    const app = express();

    // Middleware
    app.use(compression());
    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Authentication
    const username = this.systemUtil.getConfig('webserver.username');
    const password = this.systemUtil.getConfig('webserver.password');

    if (username && password) {
      app.use((req, res, next) => {
        const user = auth(req);
        if (!user || user.name !== username || user.pass !== password) {
          res.set('WWW-Authenticate', 'Basic realm="Crypto Trading Bot"');
          return res.status(401).send('Authentication required');
        }
        next();
      });
    }

    // Static files
    app.use('/static', express.static(`${this.projectDir}/web/static`));

    // View engine
    app.set('view engine', 'twig');
    app.set('views', `${this.projectDir}/templates`);

    // Routes
    app.get('/', (req, res) => {
      res.render('base', {
        desks: desks,
        assetVersion: assetVersion
      });
    });

    // OI Dashboard route
    app.use('/oi', this.oiHttp.getRouter());

    // API routes
    app.use('/api/signal', this.signalHttp.getRouter());
    app.use('/api/backtest', this.backtest.getRouter());
    app.use('/api/pairs', this.pairsHttp.getRouter());
    app.use('/api/logs', this.logsHttp.getRouter());
    app.use('/api/candles', this.candleExportHttp.getRouter());
    app.use('/api/orders', this.ordersHttp.getRouter());

    // Additional routes
    app.get('/trades', (req, res) => {
      res.render('trades', {
        desks: desks,
        assetVersion: assetVersion
      });
    });

    app.get('/desks', (req, res) => {
      res.render('desks', {
        desks: desks,
        assetVersion: assetVersion
      });
    });

    app.get('/pairs', (req, res) => {
      res.render('pairs', {
        desks: desks,
        assetVersion: assetVersion
      });
    });

    app.get('/tradingview', (req, res) => {
      res.render('tradingview', {
        desks: desks,
        assetVersion: assetVersion
      });
    });

    // Initialize OI Manager
    this.oiManager.init();
    
    // Start simulation timer (for demo purposes)
    setInterval(() => {
      this.oiManager.simulateOIData();
    }, 10000); // Update every 10 seconds

    const port = this.systemUtil.getConfig('webserver.port', 8080);
    const ip = this.systemUtil.getConfig('webserver.ip', '0.0.0.0');

    app.listen(port, ip, () => {
      console.log(`🚀 Web server started on http://${ip}:${port}`);
      console.log(`📊 OI Dashboard available at http://${ip}:${port}/oi`);
    });
  }
}; 