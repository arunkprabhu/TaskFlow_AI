# Deployment Guide

## Overview

The project ships two Docker images published to GitHub Container Registry (GHCR):

| Image | Source |
|-------|--------|
| `ghcr.io/<org>/<repo>/backend:latest` | FastAPI + Uvicorn (Python 3.11) |
| `ghcr.io/<org>/<repo>/frontend:latest` | React SPA served by Nginx |

---

## GitHub Actions — CI/CD

### Workflows

| File | Trigger | What it does |
|------|---------|-------------|
| `.github/workflows/ci.yml` | Every push / PR | Lint, type-check, build frontend, run backend tests |
| `.github/workflows/cd.yml` | Push to `main` / any `v*.*.*` tag | Build multi-arch images, push to GHCR, optional SSH deploy |

### Required GitHub Secrets (for SSH deploy)

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | IP or hostname of your server |
| `SERVER_USER` | SSH username (e.g. `ubuntu`) |
| `SERVER_SSH_KEY` | Private key matching the server's `authorized_keys` |

`GITHUB_TOKEN` is automatically available — no manual setup needed.

---

## Deploying to a Server

### 1 — First-time server setup

```bash
# Install Docker + Compose plugin
curl -fsSL https://get.docker.com | sh

# Create app directory
mkdir -p /opt/meetingtotask && cd /opt/meetingtotask

# Create .env from the example
curl -o .env https://raw.githubusercontent.com/<org>/<repo>/main/.env.example
nano .env   # fill in MONDAY_API_TOKEN, MONDAY_BOARD_ID, CORS_ORIGINS
```

### 2 — Pull and start

```bash
cd /opt/meetingtotask

# Authenticate with GHCR (one-time, using a PAT with read:packages scope)
echo "<YOUR_PAT>" | docker login ghcr.io -u <your-github-username> --password-stdin

# Download production compose file
curl -o docker-compose.prod.yml https://raw.githubusercontent.com/<org>/<repo>/main/docker-compose.prod.yml

# Start everything
docker compose -f docker-compose.prod.yml up -d
```

The frontend is available on **port 80**. The backend API lives at `/api/` (proxied by Nginx — no separate port needed externally).

### 3 — Updates (after CI pushes a new image)

```bash
cd /opt/meetingtotask
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
```

The CD workflow handles this automatically via SSH if you configure the three server secrets.

---

## Tagging a Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

CD will publish `backend:v1.0.0` and `frontend:v1.0.0` alongside `latest`.

---

## Local Production Test

```bash
cp .env.example .env   # edit values
make build
make prod
```

Open http://localhost — the full production stack runs locally with real images.

---

## Environment Variables Reference

See [.env.example](.env.example) for all available variables and defaults.
