# 🧪 PremStats Testing Guide

Comprehensive testing documentation for PremStats application covering all testing methodologies and best practices.

## Testing Overview

PremStats employs a multi-layered testing strategy ensuring reliability, performance, and user experience across all components and features.

### Test Suite Statistics
- **✅ 122 Unit Tests** - UI component library (100% passing)
- **✅ 99 E2E Tests** - Full application flow including theme system
- **✅ Lint Checks** - Code quality across all packages
- **✅ Type Checks** - TypeScript validation for type safety
- **✅ API Health** - Backend endpoint validation

## Testing Commands

### All Tests
```bash
# Complete test suite
pnpm lint          # ESLint checks across all packages
pnpm typecheck     # TypeScript validation
pnpm test:unit     # UI component unit tests
pnpm test:e2e      # End-to-end application tests
```

### Package-Specific Tests
```bash
# UI Component Tests Only
pnpm --filter @premstats/ui test:unit
pnpm --filter @premstats/ui lint
pnpm --filter @premstats/ui typecheck

# Frontend Tests Only
pnpm --filter @premstats/web test:e2e
pnpm --filter @premstats/web lint
pnpm --filter @premstats/web typecheck
```

### Browser-Specific E2E Tests
```bash
# Single browser testing (faster)
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=firefox

# Specific test files
pnpm exec playwright test tests/e2e/theme.spec.ts
pnpm exec playwright test tests/e2e/pages.spec.ts
pnpm exec playwright test tests/e2e/api-integration.spec.ts
```

## Unit Testing

### Technology Stack
- **Framework**: Vitest
- **Testing Library**: SolidJS Testing Library
- **Assertion Library**: Expect (built into Vitest)
- **Coverage**: Via Vitest coverage reports

### Component Testing Patterns

#### Theme-Aware Component Testing
```typescript
// Updated for CSS variable approach
import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders with CSS variable styling', () => {
    render(() => <Card>Card content</Card>)
    const card = screen.getByText('Card content')
    
    // ✅ Correct: Test CSS variable classes
    expect(card).toHaveClass('bg-[hsl(var(--card))]')
    expect(card).toHaveClass('text-[hsl(var(--card-foreground))]')
    
    // ❌ Wrong: Hard-coded Tailwind classes
    // expect(card).toHaveClass('bg-white')
  })
})
```

#### Component Variant Testing
```typescript
// StatsCard component testing
describe('StatsCard', () => {
  it('applies theme-aware variant styling', () => {
    render(() => (
      <StatsCard 
        variant="success"
        label="Win Rate" 
        value="85%" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('[&]:bg-[hsl(var(--success)/0.1)]')
    expect(card).toHaveClass('[&]:border-[hsl(var(--success)/0.2)]')
  })
})
```

### Running Unit Tests
```bash
# Watch mode for development
pnpm --filter @premstats/ui test:watch

# Coverage report
pnpm --filter @premstats/ui test:coverage

# Debug mode
pnpm --filter @premstats/ui test:debug
```

## End-to-End Testing

### Technology Stack
- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit (mobile)
- **Test Runner**: Playwright Test Runner
- **Reporting**: HTML reports with screenshots/videos

### E2E Test Categories

#### 1. Page Tests (`tests/e2e/pages.spec.ts`)
- Home page loads and navigation works
- Teams, Players, Matches pages functional
- Responsive design across viewports
- Error handling and loading states

#### 2. API Integration Tests (`tests/e2e/api-integration.spec.ts`)
- Backend connectivity validation
- API endpoint functionality
- Error handling for network issues
- Timeout handling

#### 3. Theme System Tests (`tests/e2e/theme.spec.ts`)
```typescript
test('Theme switcher is visible and functional', async ({ page }) => {
  await page.goto('/')
  
  const themeSwitcher = page.locator('button[aria-label*="Switch to"]')
  await expect(themeSwitcher).toBeVisible()
  
  // Switch to dark theme
  await themeSwitcher.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  
  // Verify persistence
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})
```

#### 4. Team Detail Tests (`tests/e2e/team-detail.spec.ts`)
- Navigation from teams list
- Team detail page functionality
- Error handling for invalid team IDs

### E2E Test Environment

#### Prerequisites
```bash
# System dependencies (WSL)
sudo pnpm exec playwright install-deps

# Browser installation
pnpm exec playwright install
```

#### Test Execution
```bash
# Headless mode (CI/CD)
pnpm test:e2e

# Headed mode (visible browser)
pnpm exec playwright test --headed

# UI mode (interactive)
pnpm exec playwright test --ui

# Debug mode
pnpm exec playwright test --debug
```

### Test Reports
```bash
# Generate and view HTML report
pnpm exec playwright show-report

# View last test results
pnpm exec playwright show-report --port 9323
```

## API Testing

### Health Check Testing
```bash
# Basic health check
curl -s http://localhost:8081/api/v1/health | jq '.data.status'

# Expected response:
# "healthy"
```

### Endpoint Validation
```bash
# Seasons endpoint
curl -s "http://localhost:8081/api/v1/seasons" | jq '.data.seasons | length'
# Expected: 33

# Data completeness
curl -s "http://localhost:8081/api/v1/reports/data-completeness" | jq '.data.overallStats.totalSeasons'
# Expected: 33

# Teams endpoint
curl -s "http://localhost:8081/api/v1/teams" | jq '.data.teams | length'
# Expected: 47+

# Players with filtering
curl -s "http://localhost:8081/api/v1/players?limit=5&team=1" | jq '.data.total'
# Expected: Positive integer
```

## Testing Best Practices

### Unit Tests
- **Component Isolation**: Test components in isolation with mock dependencies
- **CSS Variable Testing**: Expect CSS variable classes, not hard-coded colors
- **Accessibility**: Test ARIA labels, keyboard navigation, screen reader support
- **Edge Cases**: Test loading states, error conditions, empty data

### E2E Tests
- **User Journeys**: Test complete user workflows, not just individual features
- **Cross-Browser**: Verify functionality across Chromium, Firefox, and WebKit
- **Responsive**: Test mobile, tablet, and desktop viewports
- **Performance**: Monitor page load times and interaction responsiveness

### Theme System Testing
- **Theme Switching**: Verify light/dark theme transitions work correctly
- **Persistence**: Ensure theme choices persist across page reloads
- **Mobile Support**: Test mobile menu theme controls
- **Component Theming**: Verify all UI components properly themed

## Continuous Integration

### GitHub Actions
The project includes automated testing in CI/CD pipelines:

```yaml
# .github/workflows/test.yml (example)
- name: Run Tests
  run: |
    pnpm lint
    pnpm typecheck
    pnpm test:unit
    pnpm exec playwright install --with-deps
    pnpm test:e2e
```

### Test Coverage Goals
- **Unit Tests**: 90%+ coverage for UI components
- **E2E Tests**: All critical user journeys covered
- **API Tests**: All endpoints validated
- **Cross-Browser**: Chromium and Firefox support verified

## Debugging Tests

### Unit Test Debugging
```bash
# Debug specific test
pnpm exec vitest run --reporter=verbose StatsCard.test.tsx

# Debug with browser
pnpm exec vitest --ui
```

### E2E Test Debugging
```bash
# Debug mode with browser
pnpm exec playwright test --debug

# Trace viewer
pnpm exec playwright test --trace on
pnpm exec playwright show-trace trace.zip

# Screenshots on failure
pnpm exec playwright test --screenshot=only-on-failure
```

### Common Test Issues

#### CSS Variable Classes Not Matching
```typescript
// ❌ Problem: Test expects old class names
expect(element).toHaveClass('bg-white')

// ✅ Solution: Update to CSS variable classes
expect(element).toHaveClass('bg-[hsl(var(--background))]')
```

#### E2E Tests Timing Out
```typescript
// ❌ Problem: Default timeout too short
await page.goto('/slow-page')

// ✅ Solution: Increase timeout for slow pages
await page.goto('/slow-page', { timeout: 30000 })
```

#### Theme System Tests Failing
```typescript
// ❌ Problem: Not waiting for theme to apply
await themeSwitcher.click()
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

// ✅ Solution: Wait for attribute to be set
await themeSwitcher.click()
await page.waitForFunction(() => 
  document.documentElement.getAttribute('data-theme') === 'dark'
)
```

## Performance Testing

### Metrics to Monitor
- **Page Load Time**: < 2 seconds for initial load
- **Theme Switch Time**: < 100ms for theme transitions
- **API Response Time**: < 500ms for data endpoints
- **Bundle Size**: Monitor JavaScript bundle growth

### Performance Commands
```bash
# Lighthouse performance audit
pnpm exec playwright test --reporter=html

# Bundle analysis
pnpm exec vite build --analyze

# Memory usage monitoring
node --inspect scripts/performance-test.js
```

## Future Testing Enhancements

- [ ] Visual regression testing with Percy/Chromatic
- [ ] Performance budget enforcement
- [ ] Accessibility testing automation (axe-core)
- [ ] Load testing for API endpoints
- [ ] Mobile device testing (real devices)
- [ ] Cross-browser automated testing in CI/CD