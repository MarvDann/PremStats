# CLAUDE.md

This file provides high-level guidance to Claude Code when working with the PremStats repository.

## 📑 Documentation Structure

### Component-Specific Guidelines
- **[UI Components](packages/ui/CLAUDE.md)** - Component library development guidelines
- **[Frontend Web App](apps/web/CLAUDE.md)** - SolidJS frontend development guidelines  
- **[Backend API](packages/api/CLAUDE.md)** - Go API development guidelines
- **[Data Import/Scraping](scripts/data-import/CLAUDE.md)** - Data processing guidelines

### Core Documentation
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - Complete schema with relationships and current data
- **[API Documentation](docs/API.md)** - REST endpoints and usage examples
- **[Development Workflow](docs/development-workflow.md)** - Best practices and conventions
- **[Testing Guide](docs/testing.md)** - Comprehensive testing documentation

## 🎯 Feature & Task Management

### Features
All major features are documented in the `features/` directory:
- **[Theme System](features/theme-system.md)** - Dark/light theme implementation
- **[6 Sigma Data Quality](features/6-sigma-data-quality.md)** - Data quality framework
- **[Goals Import System](features/goals-import-system.md)** - Match events import system

### Tasks
All feature-related tasks are tracked in the `tasks/` directory with checkboxes:
- **[Theme System Tasks](tasks/theme-system.md)** - Theme improvements and refinements
- **[Goals Import Phase 2](tasks/goals-import-phase-2.md)** - Full dataset processing
- **[CSS Variable Cleanup](tasks/css-variable-cleanup.md)** - Consolidation and simplification

## 🚀 High-Level Development Rules

### Code Quality & Validation
- **Every feature task must create a separate commit** that can be rolled back to a good state
- **Validate each feature meets expectations** before moving to next task
- **Run all tests** (`pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e`) before committing
- **No feature is complete** until all validation criteria in task files are met

### Architecture Standards
- **Monorepo structure** with pnpm workspaces
- **Component separation**: UI components in `packages/ui`, frontend in `apps/web`, backend in `packages/api`
- **Feature documentation**: All features documented in `features/` with corresponding `tasks/`
- **Single source of truth**: Avoid duplication, consolidate shared resources

### Development Environment
- **Go**: Add ~/go/bin to PATH: `export PATH=$HOME/go/bin:$PATH` unless it already exists on the path
- **Package Manager**: Use `pnpm` not `npm` with workspaces
- **Docker**: Use `docker compose` not `docker-compose` (v2)
- **Code Style**: 2 spaces, no semicolons, single quotes, no trailing commas

### Testing Requirements
- **Comprehensive Testing**: 122 unit tests, 99 E2E tests must all pass
- **E2E Testing**: Playwright with auto-start dev server
- **UI Build Dependencies**: Frontend depends on UI components being built first
- **WSL Compatibility**: Use `sudo pnpm exec playwright install-deps` for system dependencies

## 🎯 Current Project Status

### Production Ready ✅
- **Frontend**: SolidJS with error-free routing, responsive design
- **Backend**: Go API with real historical data endpoints  
- **Database**: 33 seasons, 12,824 matches, comprehensive data
- **Testing**: Full E2E and unit test coverage
- **Theme System**: Base implementation with improvements pending

### Active Development 🔄
- **Theme System Refinements**: Light theme improvements, CSS variable cleanup
- **Goals Import Scale-Up**: Full dataset processing (Phase 2)
- **Data Quality**: 6 Sigma framework operational, continuous improvements

## Quick Start Commands
```bash
# Start services
docker compose up -d postgres redis

# Start API (from packages/api)
export PATH=$HOME/go/bin:$PATH && go run cmd/api/main.go

# Start frontend (from apps/web)  
pnpm dev

# Run all tests
pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e
```

## 🤖 AI Agent System

### Orchestrator-Driven Development
The project uses an orchestrator agent that coordinates specialized sub-agents for optimal task completion:

- **orchestrator**: Master coordinator ensuring simplicity, quality, and 100% task completion
- **data-scraper**: Database operations and web scraping
- **frontend-developer**: SolidJS UI development
- **backend-developer**: Go API development
- **devops-engineer**: Infrastructure and deployment
- **qa-tester**: Comprehensive testing
- **github-issue-resolver**: Automated issue fixes

### Agent Workflow
1. **Orchestrator analyzes** task requirements
2. **Delegates to specialized agents** with clear, minimal requirements
3. **Monitors progress** and provides corrective guidance
4. **Validates completion** through qa-tester
5. **Iterates until 100% complete** - no partial solutions accepted

### Key Principles
- **Simplicity First**: Always choose the simplest solution
- **No Over-Engineering**: Avoid unnecessary complexity
- **Complete Validation**: Tasks aren't done until fully tested
- **Clear Communication**: Agents report progress and issues

## 📋 Task Workflow

1. **Select Feature**: Choose from `features/` directory
2. **Check Tasks**: Review corresponding file in `tasks/` directory
3. **Implement**: Work on individual tasks with separate commits
4. **Validate**: Ensure all criteria met before marking task complete
5. **Document**: Update task file with progress and outcomes

## Success Metrics
- **All tests passing**: No regressions introduced
- **Feature complete**: All task criteria validated
- **Documentation updated**: Features and tasks reflect current state
- **Rollback ready**: Each commit represents stable state