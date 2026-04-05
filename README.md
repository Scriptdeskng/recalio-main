# Recallio Next.js + FastAPI Scaffold

This scaffold preserves the original Recallio design system, assets, and component tree while replacing Vite + Supabase with Next.js App Router + FastAPI.

## Included
- Original visual assets and Tailwind theme
- Migrated landing page, quiz app page, and challenge route
- FastAPI AI quiz generation service
- Session completion and challenge endpoints
- PostgreSQL-ready SQLAlchemy models and Alembic config
- Complete Docker setup with Makefile
- Production-ready docker-compose configuration
- Comprehensive test suite (115 tests: 51 backend + 64 frontend)

## Quick Start (Recommended - Docker)

### One Command Setup
```bash
make install
```

This will:
- Create environment files from templates
- Build all Docker images
- Start all services (web, api, database)
- Run database migrations
- Display service URLs

### Access your application
- **Web**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Common Commands
```bash
# Start services
make up

# Stop services
make down

# View logs
make logs

# Run tests
make test

# View all available commands
make help
```

For complete Docker documentation, see [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

## Manual Setup (Without Docker)

### Web
```bash
cd apps/web
npm install
npm run dev
```

### API
```bash
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --port 8000
```

## Testing

### Run All Tests (Docker)
```bash
make test
```

### Run Specific Tests
```bash
# API tests only
make api-test

# Web tests only
make web-test

# With coverage
make api-test-coverage
make web-test-coverage
```

### Manual Testing
```bash
# API tests
cd apps/api
pytest tests/ -v

# Web tests
cd apps/web  
npm run test
```

## Database Management

```bash
# Run migrations
make db-migrate

# Create new migration
make db-migrate-create NAME="add_new_table"

# Reset database
make db-reset

# Backup database
make db-backup

# Restore database
make db-restore FILE=backup.sql
```

## Production Deployment

### Build Production Images
```bash
make prod-build
```

### Start Production Environment
```bash
# Configure environment variables first
cp .env.example .env
# Edit .env with production values

# Start production
make prod-up
```

### Production with Nginx Reverse Proxy
```bash
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

See [DOCKER_GUIDE.md](DOCKER_GUIDE.md) for detailed production deployment guide.

## Project Structure

```
recallio/
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/      # API routes
│   │   │   ├── core/     # Configuration & database
│   │   │   ├── db/       # Models
│   │   │   ├── services/ # Business logic
│   │   │   └── schemas/  # Pydantic schemas
│   │   ├── tests/        # Backend tests (51 tests)
│   │   └── alembic/      # Database migrations
│   └── web/              # Next.js frontend
│       ├── app/          # Next.js App Router pages
│       ├── components/   # React components
│       ├── lib/          # Utilities & API client
│       ├── hooks/        # React hooks
│       └── __tests__/    # Frontend tests (64 tests)
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── Makefile                    # Docker command shortcuts
└── nginx/                      # Nginx reverse proxy config
```

## Available Make Commands

Run `make help` to see all available commands. Key commands include:

**Development:**
- `make up` - Start all services
- `make down` - Stop all services
- `make logs` - View logs
- `make restart` - Restart services

**Testing:**
- `make test` - Run all tests
- `make api-test` - Run API tests
- `make web-test` - Run web tests

**Database:**
- `make db-migrate` - Run migrations
- `make db-reset` - Reset database
- `make db-backup` - Backup database

**Production:**
- `make prod-build` - Build production images
- `make prod-up` - Start production
- `make prod-down` - Stop production

## Environment Variables

### API (.env)
```bash
ENV=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/recallio
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
CORS_ORIGINS=http://localhost:3000
```

### Web (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Production (.env)
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=recallio
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

## Features

### Backend (FastAPI)
- ✅ AI-powered quiz generation (Claude)
- ✅ Challenge creation and completion
- ✅ Session tracking
- ✅ PostgreSQL with SQLAlchemy ORM
- ✅ Alembic migrations
- ✅ Comprehensive test suite (51 tests)
- ✅ API documentation (Swagger/ReDoc)

### Frontend (Next.js)
- ✅ App Router with TypeScript
- ✅ Tailwind CSS styling
- ✅ Framer Motion animations
- ✅ React Query for data fetching
- ✅ Quiz flow with timer
- ✅ Challenge system
- ✅ History tracking
- ✅ Comprehensive test suite (64 tests)

## Documentation

- [DOCKER_GUIDE.md](DOCKER_GUIDE.md) - Complete Docker usage guide
- [TEST_SUITE_DOCUMENTATION.md](TEST_SUITE_DOCUMENTATION.md) - Testing guide
- API docs available at http://localhost:8000/docs

## Important Note

This is a scaffold meant to preserve styling and speed up the rebuild. It includes production-ready endpoints and migration-safe structure. The complete test suite ensures code quality and reliability.
