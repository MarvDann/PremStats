# PremStats Development Workflow

## Quick Development Restart

**Always use the streamlined restart script:**
```bash
./scripts/dev-restart.sh
```

This script:
- ✅ Checks what's already running
- ✅ Starts database if needed
- ✅ Rebuilds and restarts API
- ✅ Tests new features automatically
- ✅ Provides clear status feedback

## Before Making API Changes

1. **Check current state:**
```bash
pwd  # Verify you're in correct directory
ps aux | grep api  # Check running processes
curl -s "http://localhost:8081/api/v1/teams" > /dev/null && echo "API running" || echo "API down"
```

2. **Proper restart sequence:**
```bash
pkill -9 -f "api"  # Force kill existing API
cd packages/api    # Go to API directory
go build -o bin/api cmd/api/main.go  # Build fresh binary
PORT=8081 ./bin/api > api.log 2>&1 &  # Start with logging
```

## Database Best Practices

### Use IDs for Relationships
❌ **Wrong:** `WHERE team_name = 'Arsenal'`  
✅ **Correct:** `WHERE team_id = 1`

### Handling Duplicates
- Use diacritic normalization for name matching
- Prioritize records with higher completeness scores
- Always preserve statistics when merging
- Use completeness scoring: team(4) + nationality(2) + position(2) + DOB(1)

## Frontend Development

### 🎨 Theme System Rules
- **Color Variables:** Always use CSS variables: `hsl(var(--variable))`
- **Never Hard-code:** Avoid `bg-blue-500`, use `bg-[hsl(var(--primary))]`
- **Theme Components:** Import from `@premstats/ui`: `ThemeProvider`, `ThemeSwitcher`
- **Primary Scheme:** Purple theme with CSS variables for light/dark support
- **StatsCards:** Use `variant="default"` (not "success") for consistent theming
- **Green only for:** Football context (Champions League positions)

### Component Development Pattern
```typescript
// ✅ Correct: Use CSS variables
<div class="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
  <h1 class="text-[hsl(var(--foreground))]">Title</h1>
</div>

// ❌ Wrong: Hard-coded colors
<div class="bg-white text-black">
  <h1 class="text-gray-900">Title</h1>
</div>
```

### Pagination Standards
- 50 items per page
- Include total count in API responses
- Reset to page 1 when filters change
- Show "Showing X to Y of Z items" format

### Filter Implementation
- Dropdowns use ID values but display names
- Reset pagination when filters change
- Use team ID for filtering, not team name

## Common Pitfalls to Avoid

1. **Port Conflicts:** Check VS Code port forwarding
2. **Directory Issues:** Always verify `pwd` before running commands
3. **Stale API:** Old processes can keep running on different ports
4. **Build Caching:** Always rebuild after Go code changes
5. **Database Dependencies:** Ensure PostgreSQL is running before API

## 🧪 Testing New Features

### Comprehensive Test Suite
```bash
# Run all tests
pnpm lint          # ESLint checks (all packages)
pnpm typecheck     # TypeScript validation
pnpm test:unit     # 122 unit tests (UI components)
pnpm test:e2e      # 99 E2E tests (including theme system)

# Run specific test suites
pnpm --filter @premstats/ui test:unit    # UI component tests only
pnpm exec playwright test --project=chromium  # E2E tests (single browser)
```

### API Testing
```bash
# Test core endpoints
curl -s "http://localhost:8081/api/v1/health" | jq '.data.status'
curl -s "http://localhost:8081/api/v1/seasons" | jq '.data.seasons | length'
curl -s "http://localhost:8081/api/v1/reports/data-completeness" | jq '.data.overallStats'

# Test filtering and pagination
curl -s "http://localhost:8081/api/v1/players?limit=3&team=1" | jq '.data.total'
curl -s "http://localhost:8081/api/v1/players?limit=5&offset=10" | jq '.data | {total, count: (.players | length)}'
```

### Theme System Testing
```bash
# Run theme-specific E2E tests
pnpm exec playwright test tests/e2e/theme.spec.ts

# Test theme components manually
# 1. Navigate to http://localhost:3000
# 2. Click theme switcher in navigation
# 3. Verify theme changes and persistence
# 4. Test mobile menu theme switcher
```

## Debugging Checklist

When something doesn't work:

1. ✅ Check `pwd` - am I in the right directory?
2. ✅ Check processes - `ps aux | grep api`
3. ✅ Check database - `docker compose ps postgres`
4. ✅ Check API logs - `tail -f packages/api/api.log`
5. ✅ Test API endpoint - `curl localhost:8081/api/v1/teams`
6. ✅ Rebuild if needed - `go build -o bin/api cmd/api/main.go`

## Time-Saving Scripts

- `./scripts/dev-restart.sh` - Complete development restart
- `./scripts/clean-duplicate-players.js` - Remove duplicate player records
- `./scripts/daily-data-update.js` - Background data updates

Remember: **Check first, then act!** Most issues come from processes running in unexpected states.