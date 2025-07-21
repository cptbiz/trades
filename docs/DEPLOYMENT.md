# Deployment Guide

## Railway Deployment

### Prerequisites
- GitHub account
- Railway account
- PostgreSQL database

### Step 1: Prepare Repository

1. **Fork or clone the repository**
```bash
git clone https://github.com/cptbiz/tradestatistic.git
cd tradestatistic
```

2. **Push to your GitHub repository**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Railway Setup

1. **Create Railway account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add PostgreSQL database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will automatically set the `DATABASE_URL` environment variable

### Step 3: Configure Environment Variables

In your Railway project dashboard:

1. **Go to Variables tab**
2. **Add/verify these variables:**
   ```
   DATABASE_URL=postgresql://... (auto-set by Railway)
   PORT=8082
   NODE_ENV=production
   ```

### Step 4: Deploy

1. **Railway will automatically deploy** when you push to main branch
2. **Monitor deployment** in the Railway dashboard
3. **Check logs** for any errors

### Step 5: Verify Deployment

1. **Check health endpoint:**
```bash
curl https://your-app-name.railway.app/api/stats
```

2. **Check database initialization:**
```bash
# Connect to your Railway PostgreSQL database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM trading_pairs;"
```

## Local Development

### Using Docker Compose

1. **Clone repository**
```bash
git clone https://github.com/cptbiz/tradestatistic.git
cd tradestatistic
```

2. **Set environment variables**
```bash
export DATABASE_URL="postgresql://postgres:password@localhost:5432/crypto_trading"
```

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Check application**
```bash
curl http://localhost:8082/api/stats
```

### Manual Setup

1. **Install dependencies**
```bash
npm install
```

2. **Set up PostgreSQL**
```bash
# Install PostgreSQL locally or use Railway
export DATABASE_URL="your_postgresql_connection_string"
```

3. **Initialize database**
```bash
psql $DATABASE_URL -f new_database_schema.sql
```

4. **Start application**
```bash
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | API server port | 8082 |
| `NODE_ENV` | Environment mode | production |
| `LOG_LEVEL` | Logging level | info |

## Monitoring

### Railway Dashboard
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Deployments**: Track deployment history

### Application Health
```bash
# Check if application is running
curl https://your-app.railway.app/api/stats

# Check database connectivity
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

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Verify `DATABASE_URL` is set correctly
   - Check if PostgreSQL service is running

2. **WebSocket connections failing**
   - Check if exchanges are accessible
   - Verify trading pairs are supported

3. **High memory usage**
   - Monitor memory usage in Railway dashboard
   - Consider upgrading Railway plan

### Logs
```bash
# View Railway logs
railway logs

# View specific service logs
railway logs --service app
```

### Restart Application
```bash
# Restart via Railway dashboard
# Or use Railway CLI
railway service restart
```

## Scaling

### Railway Plans
- **Hobby**: Free tier, suitable for development
- **Pro**: $5/month, better performance
- **Team**: $20/month, production ready

### Performance Optimization
- Use Pro plan for production
- Monitor resource usage
- Set up alerts for high usage

## Security

### Environment Variables
- Never commit sensitive data to Git
- Use Railway's encrypted environment variables
- Rotate database passwords regularly

### Network Security
- Railway provides HTTPS by default
- No additional firewall configuration needed
- API endpoints are publicly accessible

## Backup

### Database Backup
```bash
# Backup PostgreSQL data
pg_dump $DATABASE_URL > backup.sql

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Railway Automatic Backups
- Railway provides automatic PostgreSQL backups
- Configure backup retention in Railway dashboard
- Test restore procedures regularly 