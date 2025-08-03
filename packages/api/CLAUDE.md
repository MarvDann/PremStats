# Backend API - Claude Development Guide

This file provides backend-specific guidance for the PremStats Go API.

## 🔧 Backend (Go API) Guidelines

### Architecture Patterns
- **Architecture Pattern**: Services → Handlers → Models pattern works excellently (#7)
- **Database Null Handling**: Always use sql.NullString and sql.NullInt32 for nullable fields (#6)
- **Database Relationships**: Use IDs for filtering, not names (e.g., `team_id` vs `team_name`) (#33)

### Process Management
- **API Process Management**: Check running processes first, use `./scripts/dev-restart.sh` (#32)
- **Port Management**: 8081 for API, 3000 for frontend. Check for conflicts (#36)
- **Directory Context**: API commands run from `packages/api/`, project scripts from root (#37)
- **Go Path**: Add ~/go/bin to PATH: `export PATH=$HOME/go/bin:$PATH` if it doesn't already exist on the path, check first.

### ⚠️ Critical API Management Best Practices

#### 🚀 API Process Management (Critical Issue #42)
- **NEVER** create multiple API binaries (`api`, `api-new`, etc.)
- **NEVER** change API port from 8081 without coordinated frontend update
- **Use**: `./scripts/dev/restart-api-robust.sh` for all API management
- **Check processes**: Always verify running processes before starting new ones
- **Best Practice**: Single source of truth for API binary and consistent port usage

#### User Guidance: "Don't forget about the robust API restart script"
- **Technical Fix**: Used `scripts/dev/restart-api-robust.sh` for all API management
- **Best Practice**: Single source of truth for API binary, consistent port usage (8081)
- **Reliability**: Eliminated manual restart issues and port conflicts

### Development Environment
- **Go**: Installed in ~/go/bin (add to PATH: `export PATH=$HOME/go/bin:$PATH` if not already there.)
- **Production Go API** with real historical data endpoints
- **Docker**: Use `docker compose` not `docker-compose` (v2)

### API Endpoints & Architecture
- **Live Quality Monitoring Infrastructure** - ✅ **PRODUCTION READY**
- **API Handler**: `packages/api/internal/handlers/reports.go` with comprehensive season analysis
- **Database Queries**: Complex SQL aggregations providing real-time quality metrics across 33 seasons
- **Performance**: Sub-second response times with cached results and efficient data structures
- **Real-Time API Endpoints**: `/api/v1/reports/data-completeness` serving live metrics (33 seasons, 12,824 matches, 8,587 goals)

### Development Commands
```bash
# Start API (from packages/api directory)
export go run cmd/api/main.go

# OR use built binary
PORT=8081 ./bin/api

# Build API
go build -o bin/api cmd/api/main.go

# Run API tests
go test ./...

# Use robust restart script (from project root)
./scripts/dev/restart-api-robust.sh
```

### Quick Start Commands
```bash
# Start services
docker compose up -d postgres redis

# Start API (in packages/api)
export PATH=$HOME/go/bin:$PATH && go run cmd/api/main.go
# OR use built binary: PORT=8081 ./bin/api
```

### Code Style
- **Code Style**: Go standard formatting with gofmt
- **Architecture**: Clean separation of handlers, services, and models

## Backend Status
- ✅ **PRODUCTION READY**: Frontend, API, and testing all complete
- **Production Go API** with real historical data endpoints
- **Complete API + Frontend + Database integration operational**