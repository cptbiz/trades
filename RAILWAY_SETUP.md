# Railway Setup Instructions

## 🚀 Quick Setup for Railway

### 1. Fork Repository
1. Go to https://github.com/cptbiz/tradestatistic
2. Click "Fork" to create your own copy

### 2. Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project

### 3. Connect Repository
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your forked repository

### 4. Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL`

### 5. Configure Environment Variables
In Railway project dashboard → Variables tab:

```
DATABASE_URL=postgresql://... (auto-set by Railway)
PORT=8082
NODE_ENV=production
```

### 6. Deploy
1. Railway will automatically deploy when you push to main
2. Monitor deployment in Railway dashboard
3. Check logs for any errors

### 7. Verify Deployment
```bash
# Check health endpoint
curl https://your-app-name.railway.app/api/stats

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM trading_pairs;"
```

## 📊 What You Get

- **Real-time data collection** from 3 exchanges
- **PostgreSQL database** with 150,000+ messages/hour
- **REST API** for data access
- **Automatic scaling** on Railway
- **99.9% uptime** with health checks

## 🔧 Customization

### Add More Trading Pairs
Edit `hybrid_collector.js`:
```javascript
// Add to trading pairs arrays
const binancePairs = [...existingPairs, 'NEWPAIRUSDT'];
```

### Change Data Collection
Modify WebSocket handlers in `hybrid_collector.js`:
```javascript
// Add new data types
handleBinanceMessage(data) {
  // Your custom logic
}
```

### API Endpoints
Add new endpoints in `hybrid_collector.js`:
```javascript
app.get('/api/custom', (req, res) => {
  // Your custom endpoint
});
```

## 📈 Monitoring

### Railway Dashboard
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Deployments**: Automatic deployment history

### Application Health
```bash
# Health check
curl https://your-app.railway.app/api/stats

# Cache data
curl https://your-app.railway.app/api/cache
```

### Database Monitoring
```bash
# Connect to Railway PostgreSQL
psql $DATABASE_URL

# Check data collection
SELECT COUNT(*) FROM tickers;
SELECT COUNT(*) FROM candles;
SELECT COUNT(*) FROM websocket_data;
```

## 🛠️ Troubleshooting

### Common Issues

1. **Database connection failed**
   - Verify `DATABASE_URL` is set in Railway
   - Check if PostgreSQL service is running

2. **WebSocket connections failing**
   - Check Railway logs for connection errors
   - Verify trading pairs are supported

3. **High memory usage**
   - Monitor memory in Railway dashboard
   - Consider upgrading Railway plan

### Logs
```bash
# View Railway logs
railway logs

# View specific service logs
railway logs --service app
```

## 💰 Railway Plans

- **Hobby**: Free tier, suitable for development
- **Pro**: $5/month, better performance
- **Team**: $20/month, production ready

## 🔒 Security

- Railway provides HTTPS by default
- Environment variables are encrypted
- No additional firewall configuration needed

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Railway Documentation](https://docs.railway.app)

## 🆘 Support

- [Railway Support](https://railway.app/support)
- [GitHub Issues](https://github.com/cptbiz/tradestatistic/issues)
- [Discord Community](https://discord.gg/railway)

---

**Ready to deploy?** Follow the steps above and your crypto trading statistics collector will be live on Railway! 🚀 