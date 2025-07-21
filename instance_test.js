const c = (module.exports = {});

c.symbols = [
  // Bybit USDT Perpetual Futures
  {
    symbol: 'BTC/USDT',
    exchange: 'bybit_unified',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  {
    symbol: 'ETH/USDT',
    exchange: 'bybit_unified',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  {
    symbol: 'SOL/USDT',
    exchange: 'bybit_unified',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  
  // Binance Spot
  {
    symbol: 'BTCUSDT',
    exchange: 'binance',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  {
    symbol: 'ETHUSDT',
    exchange: 'binance',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  
  // Binance Futures
  {
    symbol: 'BTCUSDT',
    exchange: 'binance_futures',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  {
    symbol: 'ETHUSDT',
    exchange: 'binance_futures',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  
  // Coinbase Pro
  {
    symbol: 'BTC-USD',
    exchange: 'coinbase_pro',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  },
  {
    symbol: 'ETH-USD',
    exchange: 'coinbase_pro',
    periods: ['1m', '15m', '1h'],
    state: 'watch'
  }
];

c.init = async () => {
  console.log('🚀 Crypto Trading Bot Test Instance Loaded');
  console.log('📊 Monitoring pairs on Bybit, Binance, and Coinbase');
  console.log('🔍 Available pairs:');
  c.symbols.forEach(symbol => {
    console.log(`   - ${symbol.symbol} (${symbol.exchange})`);
  });
}; 