-- Удаление старых таблиц
DROP TABLE IF EXISTS candles CASCADE;
DROP TABLE IF EXISTS open_interest CASCADE;
DROP TABLE IF EXISTS funding CASCADE;
DROP TABLE IF EXISTS orderbook_snapshots CASCADE;
DROP TABLE IF EXISTS signals_raw CASCADE;
DROP TABLE IF EXISTS market_context CASCADE;
DROP TABLE IF EXISTS news_events CASCADE;
DROP TABLE IF EXISTS market_data_view CASCADE;

-- Удаление новых таблиц если они существуют
DROP TABLE IF EXISTS websocket_data CASCADE;
DROP TABLE IF EXISTS trading_pairs CASCADE;
DROP TABLE IF EXISTS intervals CASCADE;
DROP TABLE IF EXISTS bybit_trade_aggregates_5m CASCADE;
DROP TABLE IF EXISTS collector_checkpoints CASCADE;
DROP TABLE IF EXISTS signals_10min CASCADE;
DROP TABLE IF EXISTS funding_rates CASCADE;
DROP TABLE IF EXISTS order_book_snapshots CASCADE;

-- Удаление индексов
DROP INDEX IF EXISTS idx_candles_exchange_timeframe CASCADE;
DROP INDEX IF EXISTS idx_candles_symbol_timestamp CASCADE;
DROP INDEX IF EXISTS idx_funding_symbol_timestamp CASCADE;
DROP INDEX IF EXISTS idx_market_context_timestamp CASCADE;
DROP INDEX IF EXISTS idx_oi_symbol_timestamp CASCADE;
DROP INDEX IF EXISTS idx_orderbook_symbol_timestamp CASCADE;
DROP INDEX IF EXISTS idx_signals_symbol_timestamp CASCADE; 