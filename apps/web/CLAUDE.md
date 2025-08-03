# Frontend Web App - Claude Development Guide

This file provides frontend-specific guidance for the PremStats SolidJS web application.

## <¨ Frontend (SolidJS + Tailwind) Guidelines

### SolidJS Development Patterns
- **SolidJS Patterns**: Use proper reactivity patterns, avoid React patterns (#9)
- **Router v0.10.x**: `<Router root={Layout}><Route.../></Router>` structure (#22, #26)
- **Event Handlers**: Type events explicitly - `(e: Event)` or `(e: KeyboardEvent)` (#25)
- **Entry Point**: Use `index.tsx` rather than `App.tsx` (#27)
- **TypeScript JSX**: Configure `jsx: "preserve"` and `jsxImportSource: "solid-js"` (#11)

### Frontend Architecture
- **SolidJS frontend** with error-free routing, responsive design, Tailwind CSS
- **Modern SolidJS Router v0.10.x** with proper API implementation
- **Layout Integration**: ThemeProvider wrapper in `apps/web/src/components/Layout.tsx`
- **CSS Variables**: Root-level HSL color definitions in `apps/web/src/index.css`

### Testing Standards
- **E2E Testing**: Playwright works excellently with SolidJS, auto-starts dev server (#17)
- **Test Dependencies**: E2E tests require API + Database + UI components all working (#21)
- **WSL Playwright**: Requires system dependencies `sudo pnpm exec playwright install-deps` (#20)
- **>ê Comprehensive Testing**: 122 unit tests, 99 E2E tests, all lint and type checks passing
- **Test Commands**: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:e2e` all operational

### <­ E2E Testing Framework - FULLY IMPLEMENTED

#### Comprehensive Test Coverage
PremStats has a complete Playwright E2E testing suite with **95 tests** covering:

##### Page Tests (`pages.spec.ts`)
-  **Home page loads correctly** - Hero section, search, stats cards, navigation
-  **Navigation works correctly** - All routes and page transitions
-  **Mobile navigation works** - Responsive mobile menu functionality
-  **Teams page loads and functions** - Team list, search, filtering
-  **Players page loads with content** - Player stats and data tables
-  **Matches page loads with filters** - Season/limit filters and results
-  **Statistics page loads with league table** - Standings and position legends
-  **Error handling** - Graceful degradation for API failures
-  **Responsive design** - Multiple screen sizes and viewports
-  **Loading states** - Progress indicators during API calls

##### Team Detail Tests (`team-detail.spec.ts`)
-  **Team detail navigation** - From teams list to individual team pages
-  **Back button functionality** - Proper navigation history
-  **Invalid team ID handling** - 404 error states and recovery

##### API Integration Tests (`api-integration.spec.ts`)
-  **API health checks** - Backend connectivity verification
-  **Teams API integration** - Frontend ” Backend communication
-  **Seasons API integration** - Dropdown population and filtering
-  **Error handling** - API failure graceful degradation
-  **Timeout handling** - Network timeout scenarios
-  **CORS configuration** - Cross-origin request compatibility

#### Browser Coverage
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome on Android, Safari on iOS
- **Responsive**: 320px to 1920px viewport testing

#### Running E2E Tests
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
Use `Ctrl+Shift+P` ’ "Tasks: Run Task":
- **<­ Run E2E Tests** - All tests headless
- **<­ Run E2E Tests (UI Mode)** - Visual test runner
- **<­ Run E2E Tests (Headed)** - Visible browser mode
- **=Ê View E2E Test Report** - HTML report viewer

#### Test Environment Requirements
1. **API Server**: localhost:8081 (auto-started by test runner)
2. **Database**: PostgreSQL + Redis (Docker)
3. **UI Components**: Built in packages/ui/dist
4. **System Dependencies**: `sudo pnpm exec playwright install-deps` (WSL)

### Development Environment
- **Port Management**: 8081 for API, 3000 for frontend. Check for conflicts (#36)
- **VS Code Launch**: Use `"runtimeExecutable": "bash"` for shell scripts (#16)

### Development Commands
```bash
# Start frontend development server
pnpm --filter @premstats/web dev

# Build frontend
pnpm --filter @premstats/web build

# Run frontend tests
pnpm --filter @premstats/web test

# Lint frontend code
pnpm --filter @premstats/web lint

# Type check frontend
pnpm --filter @premstats/web typecheck
```

### Code Style
- **Code Style**: 2 spaces, no semicolons, single quotes, no trailing commas (#3)
- **ESLint**: Standard config (not neostandard due to version conflicts) (#4)

## Frontend Status
-  **PRODUCTION READY**: Frontend, API, and testing all complete
- **SolidJS frontend** with error-free routing, responsive design, Tailwind CSS
- **Modern SolidJS Router v0.10.x** with proper API implementation