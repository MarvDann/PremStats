# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📑 Documentation Index

### Core Documentation
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Complete schema with relationships and current data
- **[Schema Diagram](docs/SCHEMA_DIAGRAM.md)** - Visual database structure and relationships  
- **[Season Audit](SEASON-AUDIT-SUMMARY.md)** - Data quality report (33 seasons, 100% integrity)
- **[API Documentation](docs/API.md)** - REST endpoints and usage examples
- **[Development Workflow](docs/development-workflow.md)** - Best practices and conventions

### Component Documentation
- **[UI Components](packages/ui/README.md)** - Component library with props and examples *(Coming Soon)*
- **[Frontend Architecture](apps/web/README.md)** - SolidJS patterns and routing *(Coming Soon)*
- **[Testing Guide](docs/testing.md)** - E2E, unit, and integration testing *(Coming Soon)*

### Scripts Documentation  
- **[Data Import Scripts](scripts/README.md)** - Data import and management tools *(Coming Soon)*
- **[Development Scripts](scripts/dev/README.md)** - Development automation *(Coming Soon)*
- **[Maintenance Scripts](scripts/maintenance/README.md)** - Cleanup and monitoring *(Coming Soon)*

## 🚀 CURRENT STATUS (Last Updated: 2025-01-12)

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

## 💡 Key Development Guidelines

### 🎨 Frontend (SolidJS + Tailwind)
- **SolidJS Patterns**: Use proper reactivity patterns, avoid React patterns (#9)
- **Router v0.10.x**: `<Router root={Layout}><Route.../></Router>` structure (#22, #26)
- **Event Handlers**: Type events explicitly - `(e: Event)` or `(e: KeyboardEvent)` (#25)
- **Entry Point**: Use `index.tsx` rather than `App.tsx` (#27)
- **TypeScript JSX**: Configure `jsx: "preserve"` and `jsxImportSource: "solid-js"` (#11)
- **Component Testing**: SolidJS Testing Library + Vitest works excellently (#13)

### 🎨 UI Components & Styling
- **Color Scheme**: Deep purple theme `from-primary to-purple-600`. Avoid green except for football context (#14, #35)
- **StatsCards**: Use `variant="default"` unless indicating success/failure states (#14, #35)
- **Tailwind Variants**: Use `tailwind-variants` for component styling, not manual classes (#10)
- **DataTable Columns**: Must include accessor function - `{ header, key, align, accessor: (item) => item.field }` (#24)
- **Accessibility**: Always include ARIA labels, proper semantic HTML, keyboard navigation (#15)
- **TypeScript Declarations**: Use vite-plugin-dts for UI packages to generate .d.ts files (#23)

### 🔧 Backend (Go API)
- **Architecture Pattern**: Services → Handlers → Models pattern works excellently (#7)
- **Database Null Handling**: Always use sql.NullString and sql.NullInt32 for nullable fields (#6)
- **Database Relationships**: Use IDs for filtering, not names (e.g., `team_id` vs `team_name`) (#33)
- **API Process Management**: Check running processes first, use `./scripts/dev-restart.sh` (#32)
- **Port Management**: 8081 for API, 3000 for frontend. Check for conflicts (#36)
- **Directory Context**: API commands run from `packages/api/`, project scripts from root (#37)

### 📊 Data Management
- **Import Dependencies**: Squad data must be imported first before goal scorers (#28)
- **Name Normalization**: Critical for linking across data sources ("Mohamed Salah" vs "M. Salah") (#30)
- **Transfer Tracking**: Players need team attribution by season/date for transfers (#31)
- **Duplicate Handling**: Use aggressive name cleaning with diacritic normalization (#34)
- **Data Sources**: OpenFootball Project, API-Football, Football-Data.co.uk (#29)

### 🧪 Testing & Development
- **E2E Testing**: Playwright works excellently with SolidJS, auto-starts dev server (#17)
- **Test Dependencies**: E2E tests require API + Database + UI components all working (#21)
- **UI Build Dependencies**: Frontend depends on UI components being built first (#18)
- **WSL Playwright**: Requires system dependencies `sudo pnpm exec playwright install-deps` (#20)
- **VS Code Launch**: Use `"runtimeExecutable": "bash"` for shell scripts (#16)

### 🛠️ Development Environment
- **Code Style**: 2 spaces, no semicolons, single quotes, no trailing commas (#3)
- **Package Manager**: Use `pnpm` not `npm` with workspaces
- **Docker**: Use `docker compose` not `docker-compose` (v2)
- **ESLint**: Standard config (not neostandard due to version conflicts) (#4)
- **Go Path**: Add ~/go/bin to PATH: `export PATH=$HOME/go/bin:$PATH`
- **WSL Compatibility**: Redis task queues work perfectly, no MCP needed (#1)

### ⚠️ Critical Lessons Learned & Best Practices

#### 🕒 Date/Time Handling (Critical Issue #40)
- **NEVER** manipulate timezone offsets manually in date parsing
- **Use UTC date parsing**: `new Date(dateString + ' UTC')` to avoid timezone conversion
- **Example Bug**: `new Date(tempDate.getTime() + tempDate.getTimezoneOffset() * 60000)` converted "August 18" to "August 17"
- **Match Linking**: Date inconsistencies caused 0% match rate, fixed to 85.8% match rate
- **Best Practice**: Always validate date parsing with known test cases before production use

#### 🔧 Regex Patterns in JavaScript Strings (Critical Issue #41)
- **NEVER** use double-escaped regex in JavaScript: `\\d+` becomes literal `\d+` string, not regex
- **Correct**: `/(\d+)/` or `new RegExp('(\\d+)')`
- **Bug Impact**: Caused 100% parsing failure in goal minute extraction
- **Best Practice**: Test regex patterns immediately with simple examples

#### 🚀 API Process Management (Critical Issue #42)
- **NEVER** create multiple API binaries (`api`, `api-new`, etc.) 
- **NEVER** change API port from 8081 without coordinated frontend update
- **Use**: `./scripts/dev/restart-api-robust.sh` for all API management
- **Check processes**: Always verify running processes before starting new ones
- **Best Practice**: Single source of truth for API binary and consistent port usage

#### 📊 Data Import & Validation (Critical Issue #43)
- **Always validate CSV parsing** with known data samples before bulk processing
- **Test player/team linking** on small datasets before production runs
- **Implement progressive debugging**: Start with 1 match, then 10, then 50, then production
- **Match Linking Strategy**: Use teams + date, not CSV IDs for cross-source linking
- **Data Quality**: Verify 80%+ success rates before considering import successful

### 🎯 UI Patterns
- **Pagination**: 50 items per page, include total count, reset to page 1 on filter change (#38)
- **Team Filters**: Use team dropdown with ID values but display names, filter by `current_team_id` (#39)
- **Storybook**: Use `@storybook/html-vite` with `vite-plugin-solid` (#12)

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
- **Kaggle Premier League Dataset**: Complete historical squad data (1992-2024) - FREE ✅ **IMPLEMENTED**
- **Fantasy Premier League API**: Current season player data - FREE ✅ **IMPLEMENTED**
- **API-Football**: Comprehensive match events and player stats - FREE tier + paid plans  
- **Football-Data.co.uk**: Historical CSV files with match statistics - FREE

**Implementation Priority Order**:
1. **Squad Data Import** - All players + team affiliations by season (1992-2025) ✅ **COMPLETE**
2. **Player Name Normalization** - Handle name variations across data sources ✅ **COMPLETE**
3. **Goal Scorer Import Phase 1** - Match events with proper player/team references ⚡ **IN PROGRESS**
4. **Database Schema Enhancement** - Extended match_events and goals tables ✅ **COMPLETE**

**🔄 GOALS IMPORT STATUS (Phase 1: 2001-2022)** - ✅ **MAJOR BREAKTHROUGH**:
- **Production Script**: `scripts/data/import-goals-to-existing-matches.js` ✅ **WORKING**
- **Data Source**: Kaggle Premier League Match Events (21 seasons) ✅ Downloaded
- **Critical Fixes Applied**: Timezone handling, regex patterns, API management ✅ **RESOLVED**
- **Test Results**: 986 goals successfully imported from 500 matches ✅ **VERIFIED**
- **Match Rate**: 85.8% (429/500 matches found) ✅ **EXCELLENT**
- **Player Linking**: 89.5% success rate (986 goals, 115 linking issues) ✅ **STRONG**
- **Database Status**: 59,368 total goals in database ✅ **MASSIVE IMPROVEMENT**
- **API Integration**: Goal events serving correctly via REST API ✅ **WORKING**
- **Frontend Display**: Timeline shows goal scorer information ✅ **WORKING**

**Next Steps for Complete Data Integrity**:
1. **Scale to Full Dataset**: Process all 7,979 matches (currently 500/7,979 = 6.3% complete)
2. **Address 14.2% Missing Matches**: Investigate and resolve 71 unmatched fixtures
3. **Improve Player Linking**: Target 95%+ success rate (currently 89.5%)
4. **Add Data Validation**: Implement cross-referencing with actual match scores
5. **Expand Event Types**: Include assists, cards, substitutions beyond just goals

**Target Features**:
- Goals per player per season
- 5-year goal breakdowns  
- Goal timing and type analysis
- Assist tracking
- Transfer window considerations

## 🎯 Data Integrity & Completeness Roadmap

### Phase 2: Complete Historical Goals Import (HIGH PRIORITY)
- **Goal**: Process all 7,979 matches from Kaggle dataset (2001-2022)
- **Current**: 500 matches processed (6.3% complete)
- **Target**: 95%+ match rate, 95%+ player linking success
- **Expected Output**: ~20,000+ goals for 21 seasons of data
- **Script**: `scripts/data/import-goals-to-existing-matches.js`

### Phase 3: Data Quality & Validation (HIGH PRIORITY)
- **Match Score Validation**: Cross-reference imported goals with actual match scores
- **Duplicate Detection**: Identify and resolve duplicate goal entries
- **Missing Player Resolution**: Manual review of 115 failed player linkings
- **Date Accuracy**: Verify match dates align with official Premier League records
- **Performance Metrics**: Track import success rates and data quality over time

### Phase 4: Comprehensive Event Data (MEDIUM PRIORITY)
- **Assists Import**: Link assist data to goal events
- **Cards & Bookings**: Yellow/red card events with player attribution
- **Substitutions**: Player substitution events with timing
- **Match Officials**: Referee assignment and performance tracking
- **Venue Information**: Stadium capacity, attendance accuracy

### Phase 5: Data Pipeline Automation (MEDIUM PRIORITY)
- **Scheduled Imports**: Automated weekly/monthly data refreshes
- **Error Monitoring**: Alert system for import failures or data inconsistencies
- **Data Lineage**: Track data source provenance and transformation history
- **Backup & Recovery**: Automated database backups with point-in-time recovery
- **API Rate Limiting**: Implement proper throttling for external data sources

### Phase 6: Advanced Analytics Support (LOW PRIORITY)
- **Player Performance Metrics**: Goals per 90 minutes, conversion rates
- **Team Formation Analysis**: Starting lineups and tactical formations
- **Weather & Pitch Conditions**: Match environment data
- **Transfer Window Impact**: Performance correlation with squad changes
- **Historical Trends**: Multi-season trend analysis and prediction models

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
