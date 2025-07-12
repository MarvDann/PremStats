# Development Scripts

Scripts for local development, testing, and environment management.

## 📋 Scripts Overview

### `setup.sh`
Initial development environment setup and configuration.

**Usage:**
```bash
./scripts/dev/setup.sh
```

**What it does:**
- Installs dependencies
- Sets up environment variables
- Initializes database
- Configures development tools

### `start-api.sh`
Start the Go API server with proper configuration.

**Usage:**
```bash
./scripts/dev/start-api.sh
```

**Configuration:**
- Port: 8081 (default)
- Environment: development
- Auto-reloads on changes

**Prerequisites:**
- Go installed and in PATH
- Database running
- Environment variables set

### `start-frontend.sh`
Start the SolidJS frontend development server.

**Usage:**
```bash
./scripts/dev/start-frontend.sh
```

**Configuration:**
- Port: 3000 (default)
- Hot module replacement enabled
- Proxy API requests to localhost:8081

### `dev-restart.sh`
Streamlined API restart process for development.

**Usage:**
```bash
./scripts/dev/dev-restart.sh
```

**What it does:**
1. Kills existing API processes
2. Rebuilds the API binary
3. Starts the API server
4. Performs health check

**Environment Variables:**
- `API_PORT` - API server port (default: 8081)

### `restart-api.sh`
Simple API server restart script.

**Usage:**
```bash
./scripts/dev/restart-api.sh
```

**Process:**
- Finds and kills API processes
- Restarts API with current configuration

### `run-e2e-tests.sh`
Execute end-to-end tests with all dependencies.

**Usage:**
```bash
# Run all E2E tests
./scripts/dev/run-e2e-tests.sh

# Run with UI mode
./scripts/dev/run-e2e-tests.sh ui

# Run in headed mode
./scripts/dev/run-e2e-tests.sh headed
```

**Dependencies Managed:**
- API server health check
- Docker services (PostgreSQL, Redis)
- UI component builds
- Playwright browser installation

**Test Modes:**
- `headless` (default) - Run tests without browser UI
- `ui` - Visual test runner interface
- `headed` - Run tests with visible browser

### `test-historical-api.js`
Test historical data API endpoints and functionality.

**Usage:**
```bash
node scripts/dev/test-historical-api.js
```

**Tests:**
- API connectivity
- Historical data endpoints
- Data integrity
- Response formats

## 🔧 Configuration

### Environment Variables
```bash
# API Configuration
API_PORT=8081
API_HOST=localhost

# Database
DATABASE_URL=postgres://premstats:premstats@localhost:5432/premstats

# Frontend
FRONTEND_PORT=3000

# Development
NODE_ENV=development
LOG_LEVEL=debug
```

### Go Configuration
Ensure Go is properly configured:
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH=$HOME/go/bin:$PATH
export GOPATH=$HOME/go
```

## 🚀 Development Workflow

### Starting Fresh
```bash
# 1. Initial setup
./scripts/dev/setup.sh

# 2. Start services
docker compose up -d postgres redis

# 3. Start API and frontend
./scripts/dev/start-api.sh &
./scripts/dev/start-frontend.sh &

# 4. Run tests to verify
./scripts/dev/run-e2e-tests.sh
```

### Daily Development
```bash
# Quick restart API during development
./scripts/dev/dev-restart.sh

# Run tests after changes
./scripts/dev/run-e2e-tests.sh

# Test API functionality
node scripts/dev/test-historical-api.js
```

## 🔍 Troubleshooting

### API Won't Start
```bash
# Check for port conflicts
lsof -i :8081

# Kill conflicting processes
pkill -9 -f "api"

# Check Go installation
go version
which go

# Rebuild and restart
cd packages/api && go build cmd/api/main.go
./scripts/dev/start-api.sh
```

### Frontend Issues
```bash
# Check Node version
node --version
pnpm --version

# Clear cache and reinstall
rm -rf node_modules
pnpm install

# Check for port conflicts
lsof -i :3000
```

### E2E Test Failures
```bash
# Install browser dependencies (WSL)
sudo pnpm exec playwright install-deps

# Check UI component builds
cd packages/ui && pnpm build

# Verify API health
curl http://localhost:8081/health
```

### Database Connection Issues
```bash
# Check Docker services
docker compose ps

# Restart database
docker compose restart postgres

# Test connection
docker compose exec postgres psql -U premstats -d premstats -c "SELECT 1"
```

## 📊 Monitoring

### Health Checks
All development scripts include health checks for:
- API server responsiveness
- Database connectivity
- Frontend build status
- Service dependencies

### Logs
Development logs are available:
- API logs: Console output during development
- Frontend logs: Browser console and terminal
- Test logs: Playwright reports and traces

### Performance
Monitor development performance:
- API response times
- Frontend build times
- Test execution duration
- Memory usage

## 🔗 Related Documentation

- [Main Scripts README](../README.md)
- [API Development Guide](../../packages/api/README.md)
- [Frontend Development Guide](../../apps/web/README.md)
- [Testing Guide](../../docs/testing.md)