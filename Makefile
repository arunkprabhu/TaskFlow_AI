.PHONY: help dev prod build push clean logs shell-backend shell-frontend test lint

REGISTRY        ?= ghcr.io
REPO            ?= $(shell basename $(CURDIR))
VERSION         ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BACKEND_IMAGE   ?= $(REGISTRY)/$(REPO)/backend
FRONTEND_IMAGE  ?= $(REGISTRY)/$(REPO)/frontend

help: ## Show this help
	@awk 'BEGIN{FS=":.*##"} /^[a-zA-Z_-]+:.*##/ {printf "  \033[36m%-20s\033[0m %s\n",$$1,$$2}' $(MAKEFILE_LIST)

# ── Development ──────────────────────────────────────────────────────────────
dev: ## Start full dev stack (hot-reload)
	docker compose up --build

dev-down: ## Stop dev stack
	docker compose down

# ── Production ───────────────────────────────────────────────────────────────
prod: ## Start production stack (from built images)
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production stack
	docker compose -f docker-compose.prod.yml down

# ── Build ─────────────────────────────────────────────────────────────────────
build: ## Build production images locally
	docker build -t $(BACKEND_IMAGE):$(VERSION) ./backend
	docker build -t $(FRONTEND_IMAGE):$(VERSION) \
		--build-arg VITE_API_BASE_URL=/api \
		./frontend

# ── Push to registry ──────────────────────────────────────────────────────────
push: build ## Build and push images to registry
	docker push $(BACKEND_IMAGE):$(VERSION)
	docker push $(FRONTEND_IMAGE):$(VERSION)
	docker tag $(BACKEND_IMAGE):$(VERSION) $(BACKEND_IMAGE):latest
	docker tag $(FRONTEND_IMAGE):$(VERSION) $(FRONTEND_IMAGE):latest
	docker push $(BACKEND_IMAGE):latest
	docker push $(FRONTEND_IMAGE):latest

# ── Logs ─────────────────────────────────────────────────────────────────────
logs: ## Tail logs from all services
	docker compose -f docker-compose.prod.yml logs -f

logs-backend: ## Tail backend logs
	docker compose -f docker-compose.prod.yml logs -f backend

logs-frontend: ## Tail frontend logs
	docker compose -f docker-compose.prod.yml logs -f frontend

# ── Shells ────────────────────────────────────────────────────────────────────
shell-backend: ## Open shell in running backend container
	docker compose -f docker-compose.prod.yml exec backend sh

shell-frontend: ## Open shell in running frontend container
	docker compose -f docker-compose.prod.yml exec frontend sh

# ── Tests & Lint ──────────────────────────────────────────────────────────────
test: ## Run backend tests
	cd backend && pytest tests/ -v --tb=short

lint: ## Run all linters
	cd backend && ruff check .
	cd frontend && npm run lint

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean: ## Remove stopped containers and dangling images
	docker compose down --remove-orphans
	docker image prune -f
