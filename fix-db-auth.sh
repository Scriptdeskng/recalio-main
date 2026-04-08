#!/bin/bash
# Script to fix database authentication on remote server
# This removes the old database volume and starts fresh

set -e  # Exit on error

echo "🔧 Fixing database authentication..."
echo ""
echo "⚠️  WARNING: This will delete all data in the database!"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Stop all containers
echo ""
echo "1. Stopping all containers..."
docker compose -f docker-compose.prod.yml down

# Remove the database volume to clear old password
echo ""
echo "2. Removing old database volume..."
docker volume rm recalio_postgres_data_prod || echo "   (Volume already removed)"

# Start database first
echo ""
echo "3. Starting fresh database with new password..."
docker compose -f docker-compose.prod.yml up -d db

# Wait for database to be ready
echo ""
echo "4. Waiting for database to initialize (20 seconds)..."
sleep 20

# Check database is ready
echo ""
echo "5. Checking database connection..."
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres || {
    echo "❌ Database not ready yet, waiting 10 more seconds..."
    sleep 10
}

# Start API
echo ""
echo "6. Starting API..."
docker compose -f docker-compose.prod.yml up -d api

# Wait for API to be ready
echo ""
echo "7. Waiting for API to be ready (15 seconds)..."
sleep 15

# Check API logs for connection errors
echo ""
echo "8. Checking API startup logs..."
docker compose -f docker-compose.prod.yml logs api | tail -20

# Run migrations
echo ""
echo "9. Running migrations..."
docker compose -f docker-compose.prod.yml exec api alembic upgrade head || {
    echo "❌ Migration failed!"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check DATABASE_URL in apps/api/.env matches POSTGRES_PASSWORD in .env"
    echo "2. View API logs: docker compose -f docker-compose.prod.yml logs api"
    exit 1
}

# Start web
echo ""
echo "10. Starting web..."
docker compose -f docker-compose.prod.yml up -d web

# Show status
echo ""
echo "✅ Done! Container status:"
docker ps --filter "name=recallio" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Test the deployment:"
echo "  curl http://localhost:8000/health"
echo ""
echo "📋 View logs if there are issues:"
echo "  docker compose -f docker-compose.prod.yml logs -f api"
