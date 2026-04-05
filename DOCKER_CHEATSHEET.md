# Recallio Docker Quick Reference

## 🚀 Essential Commands

### First Time Setup
```bash
make install              # Complete setup: env files, build, start, migrate
```

### Daily Development
```bash
make up                   # Start all services
make down                 # Stop all services
make logs                 # View all logs
make logs SERVICE=api     # View specific service logs
make restart              # Restart everything
```

### Service Control
```bash
make api-up              # Start API only
make web-up              # Start web only
make db-up               # Start database only

make api-restart         # Restart API
make web-restart         # Restart web
```

### Testing
```bash
make test                # Run all tests
make api-test            # Run API tests
make web-test            # Run web tests
make api-test-coverage   # API tests with coverage
make web-test-coverage   # Web tests with coverage
```

### Database
```bash
make db-migrate                        # Run migrations
make db-migrate-create NAME="add_xyz" # Create migration
make db-reset                          # Reset database (⚠️  destroys data)
make db-backup                         # Backup database
make db-restore FILE=backup.sql       # Restore database
make db-shell                          # Open psql shell
```

### Shell Access
```bash
make api-shell           # Open shell in API container
make web-shell           # Open shell in web container
make db-shell            # Open PostgreSQL shell
```

### Code Quality
```bash
make api-lint            # Lint API code
make api-format          # Format API code
make web-lint            # Lint web code
```

### Production
```bash
make prod-build          # Build production images
make prod-up             # Start production
make prod-down           # Stop production
make prod-logs           # View production logs
make prod-scale-api N=3  # Scale API to 3 instances
```

### Utilities
```bash
make ps                  # List running services
make health              # Check service health
make stats               # Show resource usage
make urls                # Show service URLs
make version             # Show version info
```

### Cleanup
```bash
make clean               # Remove containers & volumes
make clean-all           # Remove everything including images
make clean-volumes       # Remove volumes only
```

## 🌐 Service URLs

- **Web**: http://localhost:3000
- **API**: http://localhost:8000/api
- **API Docs**: http://localhost:8000/docs
- **Database**: postgresql://postgres:postgres@localhost:5432/recallio

## 📁 Quick File Reference

### Environment Files
```
apps/api/.env           # API configuration
apps/web/.env.local     # Web configuration (create from .env.example)
.env                    # Production docker-compose config
```

### Docker Files
```
docker-compose.yml      # Development environment
docker-compose.prod.yml # Production environment
Makefile                # All docker commands
```

### Key Directories
```
apps/api/app/          # API source code
apps/api/tests/        # API tests
apps/web/app/          # Next.js pages
apps/web/components/   # React components
apps/web/__tests__/    # Web tests
nginx/                 # Nginx configuration
```

## 🔧 Troubleshooting

### Services Won't Start
```bash
make ps                 # Check what's running
make logs               # Check for errors
make clean && make up   # Clean restart
```

### Port Conflicts
Edit docker-compose.yml or .env to change ports:
```
3000 - Web
8000 - API  
5432 - Database
```

### Database Issues
```bash
make db-logs            # Check database logs
make db-reset           # Reset database
```

### Build Issues
```bash
docker builder prune    # Clear build cache
make clean-all          # Remove everything
make install            # Fresh install
```

## ⚡ Common Workflows

### Start Fresh Development Session
```bash
make up && make logs
```

### Run Specific Service Tests
```bash
make api-test          # Test API
make web-test          # Test web
```

### Create & Apply Database Migration
```bash
make db-migrate-create NAME="add_users_table"
make db-migrate
```

### Deploy to Production
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with production values

# 2. Build and start
make prod-build
make prod-up

# 3. Check health
make health
```

### Debug API Issue
```bash
make api-logs          # View logs
make api-shell         # Open shell
# Inside shell:
python                 # Open Python REPL
from app.main import app
```

### Debug Web Issue
```bash
make web-logs          # View logs
make web-shell         # Open shell
# Inside shell:
npm run build          # Test build
```

## 📊 Monitoring

```bash
# Real-time stats
make stats

# Service health
make health

# Follow logs
make logs

# Check specific service
docker-compose ps api
docker-compose exec api curl http://localhost:8000/health
```

## 🎯 Pro Tips

1. **View help anytime**: `make help`
2. **Multiple terminals**: Run `make logs` in one, `make api-shell` in another
3. **Quick iterations**: Services auto-reload on code changes
4. **Test before commit**: `make test` runs full test suite
5. **Keep backups**: `make db-backup` before migrations
6. **Check health**: `make health` verifies all services
7. **Clean periodically**: `make clean` removes unused containers/volumes

## 🔒 Production Checklist

Before deploying:
- [ ] Set `POSTGRES_PASSWORD` in `.env`
- [ ] Configure `ANTHROPIC_API_KEY` in `apps/api/.env`
- [ ] Update `NEXT_PUBLIC_API_BASE_URL`
- [ ] Set `ENV=production` in API
- [ ] Configure SSL (if using Nginx)
- [ ] Set up database backups
- [ ] Test health checks
- [ ] Review resource limits in docker-compose.prod.yml

## 📚 More Help

- Full guide: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- Test docs: [TEST_SUITE_DOCUMENTATION.md](TEST_SUITE_DOCUMENTATION.md)
- API docs: http://localhost:8000/docs
- All commands: `make help`
