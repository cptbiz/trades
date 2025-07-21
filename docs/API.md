# API Documentation

## Base URL
```
https://your-railway-app.railway.app
```

## Authentication
Currently, no authentication is required for API endpoints.

## Endpoints

### 1. Statistics
Get overall system statistics.

**GET** `/api/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTickers": 76283,
    "totalCandles": 378,
    "totalWebSocketData": 152170,
    "uptime": "2h 15m 30s",
    "connections": {
      "binance": "connected",
      "bybit": "connected", 
      "coinbase": "connected"
    }
  }
}
```

### 2. Cache Data
Get current cached data from all exchanges.

**GET** `/api/cache`

**Response:**
```json
{
  "success": true,
  "data": {
    "tickers": [
      {
        "symbol": "BTCUSDT",
        "price": 117292.19,
        "priceChange": 164.25,
        "volume": 2898243.95,
        "timestamp": 1753060287928,
        "source": "binance_ws"
      }
    ],
    "candles": []
  }
}
```

### 3. Exchange-specific Tickers

#### Binance Tickers
**GET** `/api/tickers/binance`

#### Bybit Tickers  
**GET** `/api/tickers/bybit`

#### Coinbase Tickers
**GET** `/api/tickers/coinbase`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTCUSDT",
      "price": 117292.19,
      "priceChange": 164.25,
      "volume": 2898243.95,
      "timestamp": 1753060287928
    }
  ]
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Data Format

### Timestamps
All timestamps are in milliseconds since Unix epoch.

### Prices
All prices are in USD and stored as decimal numbers.

### Volumes
All volumes are in the base currency of the trading pair.

## Examples

### cURL Examples

```bash
# Get statistics
curl https://your-railway-app.railway.app/api/stats

# Get cached data
curl https://your-railway-app.railway.app/api/cache

# Get Binance tickers
curl https://your-railway-app.railway.app/api/tickers/binance
```

### JavaScript Examples

```javascript
// Get statistics
const response = await fetch('https://your-railway-app.railway.app/api/stats');
const data = await response.json();

// Get cached data
const cacheResponse = await fetch('https://your-railway-app.railway.app/api/cache');
const cacheData = await cacheResponse.json();
```

## Health Check
The application provides a health check endpoint at `/api/stats` that returns a 200 status code when the system is running properly.

## Monitoring
Monitor the application health by checking the `/api/stats` endpoint regularly. The response includes uptime and connection status information. 