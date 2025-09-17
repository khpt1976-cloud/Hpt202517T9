#!/bin/bash

# =====================================================
# ONLYOFFICE Document Server Startup Script
# =====================================================

echo "🚀 Starting ONLYOFFICE Document Server..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p onlyoffice_data onlyoffice_logs onlyoffice_fonts uploads templates

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 onlyoffice_data onlyoffice_logs onlyoffice_fonts uploads templates

# Start services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check ONLYOFFICE health
echo "🔍 Checking ONLYOFFICE health..."
for i in {1..30}; do
    if curl -s http://localhost:8080/healthcheck > /dev/null; then
        echo "✅ ONLYOFFICE Document Server is ready!"
        break
    else
        echo "⏳ Waiting for ONLYOFFICE... ($i/30)"
        sleep 5
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ ONLYOFFICE failed to start after 150 seconds"
        echo "📋 Checking logs..."
        docker-compose logs onlyoffice
        exit 1
    fi
done

echo ""
echo "🎉 ONLYOFFICE Document Server is ready!"
echo ""
echo "📋 Service URLs:"
echo "   ONLYOFFICE Document Server: http://localhost:8080"
echo "   PostgreSQL Database: localhost:5432"
echo "   Redis Cache: localhost:6379"
echo ""
echo "🧪 Test integration:"
echo "   curl http://localhost:3000/api/documents/test"