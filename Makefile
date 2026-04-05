.PHONY: help build up down restart logs shell test clean db-migrate db-reset db-shell \
        api-build api-up api-logs api-shell api-test api-restart \
        web-build web-up web-logs web-shell web-test web-restart \
        db-up db-down prod-build prod-up prod-down prod-logs

# Default target
help: ## Show this help message
	@echo "Recallio Docker Management Commands"
	@echo "====================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ====================
# Development Commands
# ====================

build: ## Build all services
	docker-compose build

up: ## Start all services in detached mode
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

stop: ## Stop all services without removing containers
	docker-compose stop

start: ## Start existing containers
	docker-compose start

logs: ## Show logs for all services (use SERVICE=api|web|db for specific service)
	@if [ -z "$(SERVICE)" ]; then \
		docker-compose logs -f; \
	else \
		docker-compose logs -f $(SERVICE); \
	fi

ps: ## List running services
	docker-compose ps

# ====================
# API Commands
# ====================

api-build: ## Build API service
	docker-compose build api

api-up: ## Start API service
	docker-compose up -d api

api-down: ## Stop API service
	docker-compose stop api

api-restart: ## Restart API service
	docker-compose restart api

api-logs: ## Show API logs
	docker-compose logs -f api

api-shell: ## Open shell in API container
	docker-compose exec api sh

api-test: ## Run API tests
	docker-compose run --rm -v $(PWD)/apps/api/tests:/app/tests api sh -c "pip install --no-cache-dir -q pytest pytest-asyncio pytest-cov && python -m pytest /app/tests -v"

api-test-coverage: ## Run API tests with coverage report
	docker-compose run --rm -v $(PWD)/apps/api/tests:/app/tests api sh -c "pip install --no-cache-dir -q pytest pytest-asyncio pytest-cov && python -m pytest /app/tests -v --cov=app --cov-report=html --cov-report=term"

api-lint: ## Lint API code
	docker-compose run --rm api sh -c "pip install --no-cache-dir -q ruff && ruff check app/"

api-format: ## Format API code
	docker-compose run --rm api sh -c "pip install --no-cache-dir -q black && black app/"

# ====================
# Web Commands
# ====================

web-build: ## Build web service (not needed for dev but useful for prod)
	@echo "Building web production image..."
	docker build -t recallio-web:latest -f apps/web/Dockerfile.prod apps/web

web-up: ## Start web service
	docker-compose up -d web

web-down: ## Stop web service
	docker-compose stop web

web-restart: ## Restart web service
	docker-compose restart web

web-logs: ## Show web logs
	docker-compose logs -f web

web-shell: ## Open shell in web container
	docker-compose exec web sh

web-test: ## Run web tests
	docker-compose run --rm web sh -c "npm install && npm run test"

web-test-ui: ## Run web tests with UI
	docker-compose run --rm -p 51204:51204 web sh -c "npm install && npm run test:ui"

web-test-coverage: ## Run web tests with coverage
	docker-compose run --rm web sh -c "npm install && npm run test:coverage"

web-lint: ## Lint web code
	docker-compose run --rm web sh -c "npm install && npm run lint"

web-install: ## Install web dependencies
	docker-compose run --rm web npm install

# ====================
# Database Commands
# ====================

db-up: ## Start database service only
	docker-compose up -d db

db-down: ## Stop database service
	docker-compose stop db

db-logs: ## Show database logs
	docker-compose logs -f db

db-shell: ## Open PostgreSQL shell
	docker-compose exec db psql -U postgres -d recallio

db-migrate: ## Run database migrations
	docker-compose exec api alembic upgrade head

db-migrate-create: ## Create new migration (use NAME=migration_name)
	@if [ -z "$(NAME)" ]; then \
		echo "Error: Please provide NAME=migration_name"; \
		exit 1; \
	fi
	docker-compose exec api alembic revision --autogenerate -m "$(NAME)"

db-migrate-downgrade: ## Downgrade database by 1 migration
	docker-compose exec api alembic downgrade -1

db-migrate-history: ## Show migration history
	docker-compose exec api alembic history

db-reset: ## Reset database (drop and recreate)
	docker-compose down -v
	docker-compose up -d db
	@echo "Waiting for database to be ready..."
	@sleep 5
	docker-compose up -d api
	@sleep 3
	$(MAKE) db-migrate

db-backup: ## Backup database to file (use FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		FILE="backup_$$(date +%Y%m%d_%H%M%S).sql"; \
	fi
	docker-compose exec -T db pg_dump -U postgres recallio > $(FILE)
	@echo "Database backed up to $(FILE)"

db-restore: ## Restore database from file (use FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "Error: Please provide FILE=backup.sql"; \
		exit 1; \
	fi
	docker-compose exec -T db psql -U postgres recallio < $(FILE)
	@echo "Database restored from $(FILE)"

# ====================
# Production Commands
# ====================

prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-up: ## Start production environment
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production environment
	docker compose -f docker-compose.prod.yml down

prod-restart: ## Restart production environment
	docker compose -f docker-compose.prod.yml restart

prod-logs: ## Show production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-scale-api: ## Scale API service (use N=3 for 3 instances)
	@if [ -z "$(N)" ]; then \
		echo "Error: Please provide N=number"; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml up -d --scale api=$(N)

# ====================
# Cleanup Commands
# ====================

clean: ## Remove all containers, volumes, and images
	docker-compose down -v
	docker system prune -f

clean-all: ## Remove everything including images
	docker-compose down -v --rmi all
	docker system prune -af --volumes

clean-volumes: ## Remove all volumes
	docker-compose down -v

# ====================
# Utility Commands
# ====================

install: ## Initial setup - build and start everything
	@echo "Setting up Recallio..."
	@if [ ! -f apps/api/.env ]; then \
		echo "Creating API .env file from example..."; \
		cp apps/api/.env.example apps/api/.env; \
	fi
	@if [ ! -f apps/web/.env.local ]; then \
		echo "Creating Web .env.local file from example..."; \
		cp apps/web/.env.example apps/web/.env.local; \
	fi
	docker-compose build
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 5
	$(MAKE) db-migrate
	@echo ""
	@echo "✅ Recallio is ready!"
	@echo "🌐 Web: http://localhost:3000"
	@echo "🔧 API: http://localhost:8000"
	@echo "📚 API Docs: http://localhost:8000/docs"

dev: up ## Alias for 'up' - start development environment

health: ## Check health status of all services
	@echo "Checking service health..."
	@docker-compose ps
	@echo ""
	@echo "API Health:"
	@curl -s http://localhost:8000/health || echo "❌ API not responding"
	@echo ""
	@echo "Web Health:"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Web is running" || echo "❌ Web not responding"

stats: ## Show resource usage statistics
	docker stats --no-stream

exec: ## Execute command in service (use SERVICE=api|web|db CMD="your command")
	@if [ -z "$(SERVICE)" ] || [ -z "$(CMD)" ]; then \
		echo "Error: Please provide SERVICE and CMD"; \
		echo "Example: make exec SERVICE=api CMD='ls -la'"; \
		exit 1; \
	fi
	docker-compose exec $(SERVICE) $(CMD)

# ====================
# Quick Test Commands
# ====================

test-all: api-test web-test ## Run all tests

test: test-all ## Alias for test-all

ci-test: ## Run tests in CI mode (no interactive)
	docker-compose run --rm api sh -c "pip install --no-cache-dir -q pytest pytest-asyncio pytest-cov && python -m pytest /app/tests -v --tb=short"
	docker-compose run --rm web sh -c "npm install && npm run test:coverage"

# ====================
# Info Commands
# ====================

version: ## Show version information
	@echo "Recallio Version Information"
	@echo "============================"
	@echo "Docker Compose:"
	@docker-compose version
	@echo ""
	@echo "Docker:"
	@docker version --format '{{.Server.Version}}'
	@echo ""
	@echo "Node (web container):"
	@docker-compose run --rm web node --version
	@echo ""
	@echo "Python (api container):"
	@docker-compose run --rm api python --version

urls: ## Show service URLs
	@echo "🌐 Service URLs"
	@echo "==============="
	@echo "Web:          http://localhost:3000"
	@echo "API:          http://localhost:8000"
	@echo "API Docs:     http://localhost:8000/docs"
	@echo "API Redoc:    http://localhost:8000/redoc"
	@echo "Database:     postgresql://postgres:postgres@localhost:5432/recallio"
