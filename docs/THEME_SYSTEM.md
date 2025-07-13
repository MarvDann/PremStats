# 🎨 PremStats Theme System

Complete documentation for the dark/light theme system implementation in PremStats.

## Overview

PremStats features a comprehensive theme system that provides seamless switching between light and dark themes with full component support, user preference persistence, and accessibility compliance.

## Architecture

### Core Components

#### 1. Theme Context (`packages/ui/src/contexts/ThemeContext.tsx`)
- **Purpose**: SolidJS context provider for global theme state management
- **Features**: 
  - Theme state management (`light` | `dark`)
  - localStorage persistence
  - System preference detection
  - Document attribute updates

```typescript
import { ThemeProvider, useTheme } from '@premstats/ui'

// Usage in Layout
<ThemeProvider>
  <App />
</ThemeProvider>

// Usage in components
const { theme, setTheme, toggleTheme } = useTheme()
```

#### 2. Theme Switcher (`packages/ui/src/components/ThemeSwitcher.tsx`)
- **Purpose**: Reusable theme toggle button component
- **Features**:
  - Sun/moon icon transitions
  - Accessibility labels
  - Hover states and transitions
  - ARIA support

```typescript
import { ThemeSwitcher } from '@premstats/ui'

// Usage
<ThemeSwitcher />
```

### CSS Variable System

#### Root Variables (`apps/web/src/index.css`)

**Light Theme (Default)**:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 259 84% 45%;
  --primary-foreground: 0 0% 100%;
  --border: 259 20% 88%;
  /* ... more variables */
}
```

**Dark Theme**:
```css
[data-theme="dark"] {
  --background: 259 30% 8%;
  --foreground: 210 40% 98%;
  --card: 259 25% 12%;
  --card-foreground: 210 40% 98%;
  --primary: 259 84% 65%;
  --primary-foreground: 259 30% 8%;
  --border: 259 20% 25%;
  /* ... more variables */
}
```

#### Usage Pattern

**Correct CSS Variable Usage**:
```css
/* Use HSL function with CSS variables */
.component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}
```

**Tailwind CSS Integration**:
```typescript
// Use arbitrary value syntax with CSS variables
<div className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
  Content
</div>
```

## Implementation Guide

### 1. Setting Up Theme System

#### Install Theme Dependencies
```bash
# Theme components are included in @premstats/ui
pnpm install @premstats/ui
```

#### Wrap Application with ThemeProvider
```typescript
// apps/web/src/components/Layout.tsx
import { ThemeProvider, ThemeSwitcher } from '@premstats/ui'

const Layout = (props) => {
  return (
    <ThemeProvider>
      <div class="min-h-screen bg-[hsl(var(--background))]">
        <nav>
          {/* Desktop theme switcher */}
          <ThemeSwitcher />
        </nav>
        <main class="text-[hsl(var(--foreground))]">
          {props.children}
        </main>
      </div>
    </ThemeProvider>
  )
}
```

### 2. Creating Theme-Aware Components

#### Component with CSS Variables
```typescript
// packages/ui/src/components/Card/Card.tsx
import { tv } from 'tailwind-variants'

const cardVariants = tv({
  base: 'rounded-lg border shadow-sm',
  variants: {
    variant: {
      default: 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--card-foreground))]',
      outlined: 'bg-[hsl(var(--card))] border-[hsl(var(--border))] border-2',
    }
  }
})
```

#### Theme-Aware Styling
```typescript
// Use CSS variables for all color values
const Component = () => (
  <div class="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
    <h1 class="text-[hsl(var(--foreground))]">Title</h1>
    <p class="text-[hsl(var(--muted-foreground))]">Description</p>
  </div>
)
```

### 3. Theme Persistence

The theme system automatically handles:
- **localStorage**: Theme choice persisted across sessions
- **System Preference**: Detects `prefers-color-scheme: dark`
- **Default Fallback**: Light theme as default

```typescript
// Theme persistence is automatic, but you can access it:
const { theme } = useTheme()
console.log(theme()) // 'light' | 'dark'
```

## Color Variables Reference

### Core Colors
- `--background`: Main page background
- `--foreground`: Primary text color
- `--card`: Card/container background
- `--card-foreground`: Text on cards
- `--primary`: Brand primary color (purple)
- `--primary-foreground`: Text on primary background

### Interaction Colors
- `--secondary`: Secondary elements
- `--muted`: Muted/disabled elements
- `--accent`: Accent/highlight elements
- `--border`: Border colors
- `--input`: Form input backgrounds

### Status Colors
- `--success`: Success states (green)
- `--warning`: Warning states (yellow)
- `--destructive`: Error/danger states (red)

## Testing

### Unit Tests
```typescript
// Component tests should expect CSS variable classes
expect(card).toHaveClass('bg-[hsl(var(--card))]')
expect(description).toHaveClass('text-[hsl(var(--muted-foreground))]')
```

### E2E Tests
```typescript
// Theme switching tests
const themeSwitcher = page.locator('button[aria-label*="Switch to"]')
await themeSwitcher.click()
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
```

## Mobile Support

### Mobile Theme Switcher
```typescript
// Mobile navigation includes theme controls
<div class="md:hidden">
  <div class="flex items-center justify-between">
    <span class="text-base font-semibold">Theme</span>
    <ThemeSwitcher />
  </div>
</div>
```

## Accessibility

### ARIA Support
- **aria-label**: Dynamic labels indicating current theme
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper announcements for theme changes

### Example ARIA Implementation
```typescript
<button
  onClick={toggleTheme}
  aria-label={`Switch to ${theme() === 'light' ? 'dark' : 'light'} theme`}
>
  {theme() === 'light' ? <MoonIcon /> : <SunIcon />}
</button>
```

## Best Practices

### ✅ Do
- Use CSS variables for all colors: `hsl(var(--variable))`
- Test components in both light and dark themes
- Include ARIA labels for theme controls
- Use semantic color names (primary, secondary, etc.)

### ❌ Don't
- Hard-code color values: `bg-blue-500`
- Use color-specific class names: `bg-white`, `text-black`
- Forget to test mobile theme switching
- Skip accessibility considerations

## Troubleshooting

### Common Issues

1. **CSS Variables Not Working**
   - Ensure HSL function: `hsl(var(--variable))`
   - Check variable exists in CSS root

2. **Theme Not Persisting**
   - Verify localStorage is available
   - Check ThemeProvider wraps entire app

3. **Components Not Themed**
   - Update component styles to use CSS variables
   - Rebuild UI package after changes

4. **Mobile Theme Switcher Hidden**
   - Check responsive classes
   - Verify mobile menu implementation

## Performance

- **CSS Variables**: Minimal runtime overhead
- **Theme Switching**: Instant, no re-renders
- **Bundle Size**: ~2KB additional for theme system
- **Memory**: Negligible impact on application memory

## Future Enhancements

- [ ] System theme change detection
- [ ] More color scheme variants
- [ ] Theme customization UI
- [ ] CSS-in-JS integration
- [ ] Animation transitions between themes