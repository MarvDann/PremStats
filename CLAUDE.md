# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 CURRENT STATUS (Last Updated: 2025-01-06)

**PremStats is LIVE with error-free frontend, production Go API, and comprehensive testing!**

### Active Services
- ✅ **Frontend**: http://localhost:3000 (SolidJS + Tailwind CSS)
- ✅ **API**: http://localhost:8081 (Go with Gorilla Mux) - **FULLY FUNCTIONAL**
- ✅ **PostgreSQL**: localhost:5432 (Docker)
- ✅ **Redis**: localhost:6379 (Docker)
- ✅ **Data Agent**: Online and processing tasks

### What Works
1. **Complete project structure** with monorepo (pnpm workspaces)
2. **Multi-agent system** with Redis task queues
3. **Docker development environment** (PostgreSQL + Redis)
4. **Production Go API** with real historical data endpoints
5. **SolidJS frontend** with error-free routing, responsive design, Tailwind CSS
6. **Agent CLI** for task dispatch and monitoring
7. **Production-ready UI component library** (8 components, 122 tests, Storybook)
8. **Comprehensive E2E testing** with Playwright (95 tests)
9. **Modern SolidJS Router v0.10.x** with proper API implementation

### Development Environment Setup
- **Go**: Installed in ~/go/bin (add to PATH: `export PATH=$HOME/go/bin:$PATH`)
- **pnpm**: Working with workspaces (use `pnpm` not `npm`)
- **Docker Compose v2**: Use `docker compose` not `docker-compose`
- **ESLint**: Standard config (not neostandard due to version conflicts)

### Key Learnings
1. **WSL Compatibility**: No MCP needed - Redis task queues work perfectly
2. **Agent Architecture**: Base worker class + specific agent implementations
3. **Code Style**: 2 spaces, no semicolons, single quotes, no trailing commas
4. **Dependencies**: Some package conflicts resolved (neostandard → standard)
5. **GitHub**: Repository at https://github.com/MarvDann/PremStats
6. **Database Null Handling**: Always use sql.NullString and sql.NullInt32 for nullable fields
7. **Go API Architecture**: Services → Handlers → Models pattern works excellently
8. **PostgreSQL Integration**: Real-time calculations from historical match data
9. **SolidJS Components**: Use proper reactivity patterns, avoid React patterns
10. **Tailwind Variants**: Use `tailwind-variants` for component styling, not manual classes
11. **TypeScript JSX**: Configure `jsx: "preserve"` and `jsxImportSource: "solid-js"`
12. **Storybook + SolidJS**: Use `@storybook/html-vite` with `vite-plugin-solid`
13. **Component Testing**: SolidJS Testing Library works excellently with Vitest
14. **Color Scheme**: Deep purple theme with gradients (`from-primary to-purple-600`). Avoid green for UI components - only use for football context (Champions League positions). StatsCards should use `variant="default"` unless specifically indicating success/failure states.
15. **Accessibility**: Always include ARIA labels, proper semantic HTML, keyboard navigation
16. **VS Code Launch Config**: Use `"runtimeExecutable": "bash"` for shell scripts, not `"program": "script.sh"`
17. **E2E Testing**: Playwright works excellently with SolidJS, auto-starts dev server
18. **UI Build Dependencies**: Frontend depends on UI components being built first - add checks to all launchers
19. **Blank Page Debugging**: E2E tests catch UI import/build issues before manual testing
20. **Playwright Dependencies**: WSL environments require system dependencies (`sudo pnpm exec playwright install-deps`) for full browser testing
21. **Service Dependencies**: E2E tests require API + Database + UI components all working together
22. **SolidJS Router v0.10.x Breaking Changes**: Routes component removed - Router acts as Routes, Layout goes in root prop
23. **TypeScript Declaration Generation**: Use vite-plugin-dts for UI packages to generate proper .d.ts files
24. **DataTable Column Interface**: Must include accessor function - `{ header, key, align, accessor: (item) => item.field }`
25. **SolidJS Event Handlers**: Always type events explicitly - `(e: Event)` or `(e: KeyboardEvent)` to avoid implicit any errors
26. **Router Migration Pattern**: Move from `<Router><App /></Router>` to `<Router root={Layout}><Route.../></Router>` structure
27. **Front End Entry Point**: `index.tsx` rather than `App.tsx`
28. **Match Stats Data Dependencies**: Squad data must be imported first to properly map goal scorers to players - prevents orphaned records
29. **Premier League Data Sources**: OpenFootball Project (free historical JSON), API-Football (comprehensive), Football-Data.co.uk (CSV files)
30. **Player Name Normalization**: Critical for linking goal scorers across different data sources ("Mohamed Salah" vs "M. Salah")
31. **Transfer Window Tracking**: Players need team attribution by season/date to handle mid-season transfers properly
32. **API Development Process**: Always check what's running first (`ps aux | grep api`, `curl health check`). Use `./scripts/dev-restart.sh` for streamlined restarts. Kill processes with `pkill -9 -f "api"` and rebuild with `go build` before starting.
33. **Database Relationships**: Use IDs for filtering, not names (e.g., `team_id` instead of `team_name`) for better performance and accuracy.
34. **Duplicate Data Handling**: Use aggressive name cleaning with diacritic normalization. Prioritize records with completeness scores (team + nationality + position + DOB). Always preserve statistics when merging duplicates.
35. **Color Scheme Consistency**: Purple theme (`from-primary to-purple-600`). StatsCards use `variant="default"` unless specifically indicating success/failure. Avoid green except for football context (Champions League positions).
36. **Port Conflicts**: Always check for existing processes before starting services. Use consistent ports (8081 for API, 3000 for frontend). VS Code port forwarding can cause conflicts.
37. **Directory Management**: Always verify `pwd` before running scripts. API commands run from `packages/api/`. Project scripts run from root.
38. **Pagination Patterns**: 50 items per page, include total count in API responses, reset to page 1 when filters change, show "Showing X to Y of Z" format.
39. **Team Filter Implementation**: Use team dropdown with ID values but display names. Filter API by `current_team_id` for accurate results.

### Quick Start Commands
```bash
# Start services
docker compose up -d postgres redis

# Start API (in packages/api)
export PATH=$HOME/go/bin:$PATH && go run cmd/api/main.go
# OR use built binary: PORT=8081 ./bin/api

# Start frontend (in apps/web)
pnpm dev

# Start data agent (in root)
node agents/data/index.js

# Dispatch tasks
node scripts/agent-cli.js task data "Your task here"
node scripts/agent-cli.js status
```

## Current Project Status

**IMPORTANT**: For detailed project status and priorities, see **TODO.md** which contains:

### Production Status
- ✅ **PRODUCTION READY**: Frontend, API, and testing all complete
- ✅ **33 seasons GOOD** (100%) - Reliable data 1992/93 - 2024/25

### Critical Priority (Phase 1) - DISCOVERY COMPLETE
**Status**: Research complete - Ready to implement comprehensive match statistics import

**Key Discovery**: Squad data must be imported first to properly map goal scorers to players

**Data Sources Identified**:
- **OpenFootball Project**: Complete historical JSON data (1992-2025) - FREE
- **API-Football**: Comprehensive match events and player stats - FREE tier + paid plans  
- **Football-Data.co.uk**: Historical CSV files with match statistics - FREE
- **Fantasy Premier League API**: Current season player data - FREE

**Implementation Priority Order**:
1. **Squad Data Import** - All players + team affiliations by season (1992-2025)
2. **Player Name Normalization** - Handle name variations across data sources
3. **Goal Scorer Import** - Match events with proper player/team references
4. **Database Schema Enhancement** - Extended match_events and goals tables

**Target Features**:
- Goals per player per season
- 5-year goal breakdowns  
- Goal timing and type analysis
- Assist tracking
- Transfer window considerations

## Project Overview

PremStats is a comprehensive Premier League statistics web application featuring:
- Historical data from 1992 to present
- Automated data scraping and updates
- Beautiful visualizations and responsive design
- AI-powered GitHub issue management
- Multi-agent architecture for parallel development

## Tech Stack

- **Frontend**: SolidJS, TypeScript, Tailwind CSS
- **Backend**: Go
- **Database**: PostgreSQL
- **Cache**: Redis
- **Development**: Docker Compose, pnpm workspaces
- **Testing**: Vitest (frontend), Go testing, Playwright (E2E)
- **CI/CD**: GitHub Actions

## Common Commands

### Development
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up frontend
docker-compose up api

# Install dependencies
pnpm install

# Run development servers (without Docker)
pnpm dev

# Run specific workspace
pnpm --filter @premstats/web dev
pnpm --filter @premstats/ui storybook
```

### Testing
```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Run tests in watch mode
pnpm --filter @premstats/web test:watch

# Go backend tests
cd packages/api && go test ./...
```

### Linting & Type Checking
```bash
# Lint all code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Type check
pnpm typecheck
```

### Building
```bash
# Build all packages
pnpm build

# Build Docker images
docker-compose build

# Build specific package
pnpm --filter @premstats/ui build
```

### Database
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U premstats

# Run migrations
docker-compose exec api go run ./cmd/migrate up

# Access pgAdmin
# Open http://localhost:5050
# Email: admin@premstats.com
# Password: admin
```

### Agent Commands
```bash
# Dispatch task to agent
pnpm agent task "scrape latest results"

# Check agent status
pnpm agent status

# View agent logs
docker-compose logs scraper -f
```

## Architecture

### Monorepo Structure
```
/
   apps/
      web/                 # Main SolidJS application
   packages/
      ui/                  # Shared component library
      api/                 # Go backend API
      scraper/            # Go web scraping service
   agents/                  # Agent definitions
   docker/                  # Docker configurations
   scripts/                 # Utility scripts
```

### Agent System
The project uses a multi-agent architecture where each agent has specific responsibilities:

1. **Data Agent** (`agents/data/`)
   - Web scraping from Premier League/BBC
   - Data validation and transformation
   - Database updates

2. **Frontend Agent** (`agents/frontend/`)
   - UI component development
   - Visual testing
   - Storybook management

3. **Backend Agent** (`agents/backend/`)
   - API endpoint development
   - Business logic implementation
   - Performance optimization

4. **DevOps Agent** (`agents/devops/`)
   - CI/CD pipeline management
   - Docker configuration
   - Deployment automation

5. **QA Agent** (`agents/qa/`)
   - Test creation and maintenance
   - Quality assurance
   - Performance monitoring

### Database Schema
Key tables:
- `teams` - Premier League teams
- `players` - Player information
- `seasons` - Season metadata
- `matches` - Match results and details
- `goals` - Goal events
- `standings` - League table snapshots

### API Endpoints
Base URL: `http://localhost:8080/api/v1`

- `GET /teams` - List all teams
- `GET /players` - Search players
- `GET /matches` - Get matches with filters
- `GET /standings/:season` - Get league table
- `GET /stats/top-scorers` - Top scorers
- `POST /query` - Natural language queries

### Component Library
The UI package (`@premstats/ui`) provides themable components:
- DataTable - Sortable, filterable tables
- Chart - Line, bar, pie charts
- Card - Content containers
- Modal - Dialogs and overlays
- Form controls - Inputs, selects, etc.

## Code Style
- 2 space indentation
- No semicolons
- Single quotes
- No trailing commas
- ESLint with neostandard rules (NO Prettier)

## Development Workflow

1. **Feature Development**
   ```bash
   # Create feature branch
   git checkout -b feature/player-comparison

   # Start development environment
   docker-compose up

   # Make changes and test
   pnpm test:watch

   # Lint and fix
   pnpm lint:fix
   ```

2. **Data Updates**
   ```bash
   # Manual scrape
   docker-compose run scraper scrape --date today

   # Schedule automated updates
   # Configured in scraper service
   ```

3. **Component Development**
   ```bash
   # Start Storybook
   pnpm storybook

   # Create new component
   # Add to packages/ui/src/components/
   ```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### Backend
```
DATABASE_URL=postgres://premstats:premstats@localhost:5432/premstats
REDIS_URL=redis://localhost:6379
PORT=8080
ENV=development
```

### Scraper
```
RATE_LIMIT=10
CACHE_DIR=/tmp/scraper-cache
USER_AGENT=PremStats/1.0
```

## Troubleshooting

### Port Conflicts
If ports are already in use:
```bash
# Change ports in docker-compose.yml
# Or stop conflicting services
lsof -i :3000
kill -9 <PID>
```

### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up postgres -d
docker-compose exec api go run ./cmd/migrate up
```

### Build Failures
```bash
# Clear caches
pnpm store prune
docker-compose build --no-cache
```

## Quick Tasks

### Add New API Endpoint
1. Define handler in `packages/api/internal/handlers/`
2. Add route in `packages/api/internal/routes/`
3. Update OpenAPI spec
4. Write tests

### Create New Component
1. Add component in `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Add Storybook story
4. Write component tests

### Deploy Changes
1. Ensure all tests pass
2. Build production images
3. Push to registry
4. GitHub Actions handles deployment

## 🎭 E2E Testing Framework - FULLY IMPLEMENTED

### Comprehensive Test Coverage
PremStats has a complete Playwright E2E testing suite with **95 tests** covering:

#### Page Tests (`pages.spec.ts`)
- ✅ **Home page loads correctly** - Hero section, search, stats cards, navigation
- ✅ **Navigation works correctly** - All routes and page transitions
- ✅ **Mobile navigation works** - Responsive mobile menu functionality
- ✅ **Teams page loads and functions** - Team list, search, filtering
- ✅ **Players page loads with content** - Player stats and data tables
- ✅ **Matches page loads with filters** - Season/limit filters and results
- ✅ **Statistics page loads with league table** - Standings and position legends
- ✅ **Error handling** - Graceful degradation for API failures
- ✅ **Responsive design** - Multiple screen sizes and viewports
- ✅ **Loading states** - Progress indicators during API calls

#### Team Detail Tests (`team-detail.spec.ts`)
- ✅ **Team detail navigation** - From teams list to individual team pages
- ✅ **Back button functionality** - Proper navigation history
- ✅ **Invalid team ID handling** - 404 error states and recovery

#### API Integration Tests (`api-integration.spec.ts`)
- ✅ **API health checks** - Backend connectivity verification
- ✅ **Teams API integration** - Frontend ↔ Backend communication
- ✅ **Seasons API integration** - Dropdown population and filtering
- ✅ **Error handling** - API failure graceful degradation
- ✅ **Timeout handling** - Network timeout scenarios
- ✅ **CORS configuration** - Cross-origin request compatibility

### Browser Coverage
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome on Android, Safari on iOS
- **Responsive**: 320px to 1920px viewport testing

### Running E2E Tests

#### Command Line
```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run with visual UI test runner
pnpm test:e2e:ui

# Run with visible browser (headed mode)
pnpm test:e2e:headed

# View HTML test report
pnpm test:e2e:report
```

#### VS Code Tasks
Use `Ctrl+Shift+P` → "Tasks: Run Task":
- **🎭 Run E2E Tests** - All tests headless
- **🎭 Run E2E Tests (UI Mode)** - Visual test runner
- **🎭 Run E2E Tests (Headed)** - Visible browser mode
- **📊 View E2E Test Report** - HTML report viewer

### Test Environment Requirements
1. **API Server**: localhost:8081 (auto-started by test runner)
2. **Database**: PostgreSQL + Redis (Docker)
3. **UI Components**: Built in packages/ui/dist
4. **System Dependencies**: `sudo pnpm exec playwright install-deps` (WSL)

### Automated Test Runner
The `scripts/run-e2e-tests.sh` script automatically:
- ✅ Checks API health (starts if needed)
- ✅ Verifies Docker services (starts if needed)
- ✅ Ensures UI components are built
- ✅ Installs Playwright browsers
- ✅ Runs tests in specified mode
- ✅ Generates HTML reports

### Test Configuration
- **Base URL**: http://localhost:3000
- **Auto-start**: Development server launches automatically
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Available on retry
- **Retry**: 2 attempts for flaky tests

### WSL Environment Notes
WSL users need to install system dependencies:
```bash
sudo pnpm exec playwright install-deps
```

Alternative manual install:
```bash
sudo apt-get install libnspr4 libnss3 libasound2
```

### Test Reliability
- **Service Dependencies**: Tests wait for API + Database readiness
- **UI Dependencies**: Verifies component builds before testing
- **Network Resilience**: Handles API timeouts and failures
- **Data Consistency**: Tests work with varying data states
- **Browser Compatibility**: Cross-browser testing prevents regressions

The E2E testing framework ensures PremStats works reliably across all supported browsers and devices!
