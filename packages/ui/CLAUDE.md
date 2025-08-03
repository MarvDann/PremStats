# UI Components - Claude Development Guide

This file provides UI component-specific guidance for the PremStats component library.

## <¨ UI Components & Styling Guidelines

### Color Scheme & Theming
- **Color Scheme**: Deep purple theme `from-primary to-purple-600`. Avoid green except for football context (#14, #35)
- **StatsCards**: Use `variant="default"` unless indicating success/failure states (#14, #35)
- **Theme Components**: Import ThemeProvider and ThemeSwitcher from `@premstats/ui` for theme functionality
- **Color Consistency**: Secondary StatsCard variant matches Europa Conference League table colors for visual harmony

### Component Development Standards
- **DataTable Columns**: Must include accessor function - `{ header, key, align, accessor: (item) => item.field }` (#24)
- **Accessibility**: Always include ARIA labels, proper semantic HTML, keyboard navigation (#15)
- **TypeScript Declarations**: Use vite-plugin-dts for UI packages to generate .d.ts files (#23)
- **Storybook**: Use `@storybook/html-vite` with `vite-plugin-solid` (#12)

### <¨ THEME SYSTEM -  **PRODUCTION READY**

**COMPREHENSIVE DARK/LIGHT THEME IMPLEMENTATION**: Complete CSS variable-based theme system with user preferences, persistence, and full component support operational across all UI elements.

####  THEME SYSTEM FEATURES
- **< Theme Switcher**: Sun/moon icons in navigation bar (desktop + mobile)
- **=¾ Persistence**: localStorage with system preference detection
- **<¨ CSS Variables**: HSL color system for complete customization
- **=ñ Responsive**: Mobile menu integration with theme controls
- **=' Component Support**: All UI components themed with CSS variables
- **¡ Instant Switching**: No page reload, immediate theme application
- **<Æ Table Colors**: Ultra-subtle light mode, proper dark mode contrast for league table qualification zones

#### <¯ THEME ARCHITECTURE
- **Context Provider**: `packages/ui/src/contexts/ThemeContext.tsx` - SolidJS theme state management
- **Theme Switcher**: `packages/ui/src/components/ThemeSwitcher.tsx` - Reusable theme toggle component
- **CSS Variables**: Root-level HSL color definitions in `apps/web/src/index.css`
- **Table Row Colors**: CSS variables for champion, champions league, europa league, europa conference, relegation zones
- **Component Integration**: All UI components use `hsl(var(--variable))` pattern
- **Layout Integration**: ThemeProvider wrapper in `apps/web/src/components/Layout.tsx`

#### >ê THEME TESTING
- ** E2E Tests**: Theme switching, persistence, mobile support verified
- ** Unit Tests**: 122 tests passing with updated CSS variable expectations
- ** Visual Testing**: Both light and dark themes beautiful and readable
- ** Accessibility**: Proper ARIA labels and keyboard navigation
- ** Table Colors**: Ultra-subtle light mode preserves original appearance, dark mode maintains good contrast
- **Theme Testing**: Theme system fully tested with E2E tests for switching, persistence, and mobile support
- **CSS Variable Tests**: Component tests updated to expect CSS variable classes instead of hard-coded Tailwind

### <¯ UI Patterns
- **Pagination**: 50 items per page, include total count, reset to page 1 on filter change (#38)
- **Team Filters**: Use team dropdown with ID values but display names, filter by `current_team_id` (#39)

### Testing Standards
- **Component Testing**: SolidJS Testing Library + Vitest works excellently (#13)
- **Theme Testing**: Update component tests to expect CSS variable classes, not hard-coded Tailwind classes
- **UI Build Dependencies**: Frontend depends on UI components being built first (#18)
- **>ê Comprehensive Testing**: 122 unit tests, 99 E2E tests, all lint and type checks passing

### Development Commands
```bash
# Build UI components
pnpm --filter @premstats/ui build

# Run component tests
pnpm --filter @premstats/ui test

# Start Storybook
pnpm --filter @premstats/ui storybook

# Lint UI components
pnpm --filter @premstats/ui lint
```

### Code Style
- **Code Style**: 2 spaces, no semicolons, single quotes, no trailing commas (#3)
- **ESLint**: Standard config (not neostandard due to version conflicts) (#4)

## Component Library Status
- **Production-ready UI component library** (8 components, 122 tests, Storybook)
- **<¨ Dark/Light Theme System** with CSS variables, persistence, and full component support