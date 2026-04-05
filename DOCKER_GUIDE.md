# Recallio Docker Guide

Complete guide for managing the Recallio application using Docker and Make commands.

## Table of Contents

- [Quick Start](#quick-start)
- [Development](#development)
- [Testing](#testing)
- [Database Management](#database-management)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Initial Setup

```bash
# Complete setup with environment files and migrations
make install
```

This will:
1. Create environment files from templates
2. Build all Docker images
3. Start all services
4. Run database migrations
5. Display service URLs

### Check Status

```bash
# View all available commands
make help

# Check service health
make health

# View running services
make ps
```

## Development

### Starting Services

```bash
# Start all services
make up

# Or use the dev alias
make dev

# Start specific service
make api-up    # Start API only
make web-up    # Start web only
make db-up     # Start database only
```

### Viewing Logs

```bash
# All services
make logs

# Specific service
make logs SERVICE=api
make logs SERVICE=web
make logs SERVICE=db

# Or use service-specific commands
make api-logs
make web-logs
make db-logs
```

### Stopping Services

```bash
# Stop all services
make down

# Stop without removing containers
make stop

# Restart all services
make restart

# Restart specific service
make api-restart
make web-restart
```

### Shell Access

```bash
# API container
make api-shell

# Web container
make web-shell

# Database shell
make db-shell

# Execute custom command
make exec SERVICE=api CMD="python --version"
```

## Testing

### API Tests

```bash
# Run all API tests
make api-test

# Run with coverage report
make api-test-coverage

# Lint API code
make api-lint

# Format API code
make api-format
```

### Web Tests

```bash
# Run all web tests
make web-test

# Run with UI
make web-test-ui

# Run with coverage
make web-test-coverage

# Lint web code
make web-lint
```

### All Tests

```bash
# Run all tests (API + Web)
make test-all

# Or simply
make test

# CI mode (non-interactive)
make ci-test
```

## Database Management

### Migrations

```bash
# Run migrations
make db-migrate

# Create new migration
make db-migrate-create NAME="add_user_table"

# Rollback one migration
make db-migrate-downgrade

# View migration history
make db-migrate-history
```

### Database Operations

```bash
# Reset database (WARNING: destroys all data)
make db-reset

# Backup database
make db-backup                           # Auto-named backup
make db-backup FILE=my_backup.sql       # Named backup

# Restore database
make db-restore FILE=my_backup.sql

# Access PostgreSQL shell
make db-shell
```

## Production Deployment

### Building for Production

```bash
# Build all production images
make prod-build

# Build specific service
make web-build    # Build production web image
make api-build    # Build API image
```

### Running Production

```bash
# Start production environment
make prod-up

# View production logs
make prod-logs

# Restart production services
make prod-restart

# Stop production
make prod-down
```

### Scaling (Production)

```bash
# Scale API service to 3 instances
make prod-scale-api N=3
```

### Production with Nginx

```bash
# Start with Nginx reverse proxy
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d

# View nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Environment Setup for Production

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with production values:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=recallio
API_PORT=8000
WEB_PORT=3000
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

3. Update API environment:
```bash
# Edit apps/api/.env
ENV=production
ANTHROPIC_API_KEY=your_production_key
```

4. Start production:
```bash
make prod-up
```

## Cleanup

### Remove Containers and Volumes

```bash
# Stop and remove containers/volumes
make clean

# Remove everything including images
make clean-all

# Remove only volumes
make clean-volumes
```

## Utility Commands

### System Information

```bash
# Show version information
make version

# Show service URLs
make urls

# Show resource usage
make stats
```

### Web Dependencies

```bash
# Install/update Node packages
make web-install
```

## Service URLs (Development)

After running `make up`, access:

- **Web Application**: http://localhost:3000
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc
- **Database**: postgresql://postgres:postgres@localhost:5432/recallio

## Troubleshooting

### Services won't start

```bash
# Check what's running
make ps

# Check logs for errors
make logs

# Clean and rebuild
make clean
make build
make up
```

### Database connection issues

```bash
# Ensure database is running
make db-up

# Check database logs
make db-logs

# Reset database
make db-reset
```

### Port conflicts

If ports 3000, 8000, or 5432 are already in use, you can either:

1. Stop the conflicting service
2. Or modify ports in docker-compose.yml or .env

### Build issues

```bash
# Clean build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache

# Or for production
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Permission issues

```bash
# Fix ownership (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Clear everything and start fresh

```bash
make clean-all
make install
```

## Production Checklist

Before deploying to production:

- [ ] Set strong `POSTGRES_PASSWORD` in `.env`
- [ ] Configure `ANTHROPIC_API_KEY` in `apps/api/.env`
- [ ] Update `NEXT_PUBLIC_API_BASE_URL` to production domain
- [ ] Set `ENV=production` in API environment
- [ ] Configure SSL certificates for Nginx (if using)
- [ ] Set up backup schedule for database
- [ ] Configure monitoring and logging
- [ ] Test health endpoints
- [ ] Set up firewall rules
- [ ] Configure CORS origins appropriately

## Health Checks

Production docker-compose includes health checks for all services:

```bash
# Check health status
docker-compose -f docker-compose.prod.yml ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost:3000
```

## Monitoring

### View Resource Usage

```bash
# Real-time stats
make stats

# Or detailed view
docker stats
```

### View Logs

```bash
# Follow all logs
make prod-logs

# Specific service in production
docker-compose -f docker-compose.prod.yml logs -f web
```

## Support

For more information:
- Check the main README.md
- View Makefile for all available commands: `make help`
- Check docker-compose.yml for service configuration
- Check docker-compose.prod.yml for production settings
