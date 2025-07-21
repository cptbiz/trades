#!/bin/bash

# Crypto Trading Statistics Deployment Script
# For Railway deployment

echo "🚀 Starting deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Initialize database if needed
echo "🗄️ Initializing database..."
psql $DATABASE_URL -f new_database_schema.sql

# Start the application
echo "🚀 Starting the application..."
npm start 