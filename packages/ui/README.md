# @premstats/ui

Themable component library for PremStats built with SolidJS and Tailwind CSS.

## 📦 Overview

This package provides a collection of reusable, accessible UI components designed specifically for the PremStats application. All components follow the established design system with a deep purple theme and consistent styling patterns.

## 🚀 Getting Started

### Installation

```bash
# Install the package (if published)
pnpm add @premstats/ui

# Or use from monorepo
pnpm --filter @premstats/web add @premstats/ui
```

### Usage

```tsx
import { Button, Card, DataTable } from '@premstats/ui'

function MyComponent() {
  return (
    <Card>
      <Button variant="primary" size="lg">
        Click me!
      </Button>
    </Card>
  )
}
```

## 🎨 Design System

### Color Scheme
- **Primary**: Deep purple theme with gradients (`from-primary to-purple-600`)
- **Variants**: Only use green for football context (Champions League positions)
- **StatsCards**: Use `variant="default"` unless indicating success/failure states

### Styling
- **Tailwind Variants**: Components use `tailwind-variants` for consistent styling
- **Accessibility**: All components include ARIA labels and proper semantic HTML
- **Responsive**: Mobile-first design with responsive breakpoints

## 📚 Components

### Core Components

#### Button
Versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@premstats/ui'

// Basic usage
<Button>Click me</Button>

// With variants and sizes
<Button variant="primary" size="lg">Primary Large</Button>
<Button variant="outline" size="sm">Outline Small</Button>
<Button variant="ghost" size="icon">👍</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'`
- `size`: `'sm' | 'md' | 'lg' | 'icon'`
- `disabled`: boolean
- All standard HTML button attributes

#### Card
Container component for grouping related content.

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@premstats/ui'

<Card>
  <CardHeader>
    <CardTitle>Player Stats</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Goals: 25</p>
  </CardContent>
</Card>
```

**Props:**
- `class`: Additional CSS classes
- All standard HTML div attributes

#### DataTable
Comprehensive data table with sorting, filtering, and custom styling.

```tsx
import { DataTable } from '@premstats/ui'

const columns = [
  {
    key: 'name',
    header: 'Player Name',
    accessor: (player) => player.name,
    sortable: true,
    align: 'left'
  },
  {
    key: 'goals',
    header: 'Goals',
    accessor: (player) => player.goals,
    sortable: true,
    align: 'center'
  }
]

<DataTable 
  data={players} 
  columns={columns} 
  sortable 
  variant="striped"
/>
```

**Props:**
- `data`: Array of data objects
- `columns`: Column definitions with accessor functions
- `variant`: `'default' | 'striped'`
- `size`: `'default' | 'compact'`
- `sortable`: Enable sorting functionality
- `getRowClass`: Function to apply custom row classes

**Column Interface:**
```tsx
interface Column<T> {
  key: string
  header: string
  accessor: (item: T) => JSX.Element | string | number
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
}
```

#### StatsCard
Specialized card for displaying statistics with optional status variants.

```tsx
import { StatsCard } from '@premstats/ui'

<StatsCard 
  value="25" 
  label="Goals Scored" 
  variant="default" 
  size="md"
/>
```

**Props:**
- `value`: The statistic value to display
- `label`: Description of the statistic
- `variant`: `'default' | 'success' | 'warning' | 'danger'`
- `size`: `'sm' | 'md' | 'lg'`

#### TeamCard
Card component specifically designed for team information display.

```tsx
import { TeamCard } from '@premstats/ui'

<TeamCard 
  teamName="Arsenal" 
  logoUrl="/logos/arsenal.png"
  stats={{ wins: 20, draws: 5, losses: 3 }}
/>
```

### Form Components

#### Input
Styled input component with consistent theming.

```tsx
import { Input } from '@premstats/ui'

<Input 
  type="text" 
  placeholder="Search players..." 
  value={searchTerm}
  onInput={(e) => setSearchTerm(e.target.value)}
/>
```

#### Label
Accessible label component for form inputs.

```tsx
import { Label } from '@premstats/ui'

<Label for="player-search">Player Name</Label>
<Input id="player-search" />
```

### Utility Components

#### Badge
Small component for status indicators and tags.

```tsx
import { Badge } from '@premstats/ui'

<Badge variant="success">Active</Badge>
<Badge variant="warning">Injured</Badge>
```

#### Container
Layout wrapper with responsive max-width and padding.

```tsx
import { Container } from '@premstats/ui'

<Container>
  <h1>Page Content</h1>
</Container>
```

## 🧪 Development

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific component tests
pnpm test Button
```

### Storybook

View and develop components in isolation:

```bash
# Start Storybook dev server
pnpm storybook

# Build Storybook for production
pnpm build-storybook
```

Visit [http://localhost:6006](http://localhost:6006) to view the component library.

### Building

```bash
# Build the library
pnpm build

# Build in watch mode for development
pnpm dev
```

## 📋 Development Guidelines

### Adding New Components

1. Create component directory in `src/components/`
2. Include these files:
   - `ComponentName.tsx` - Main component implementation
   - `ComponentName.stories.tsx` - Storybook stories
   - `ComponentName.test.tsx` - Unit tests
   - `index.ts` - Export file

3. Follow established patterns:
   - Use `tailwind-variants` for styling
   - Include proper TypeScript types
   - Add accessibility features
   - Follow SolidJS reactivity patterns

### Component Structure Template

```tsx
import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'

const componentVariants = tv({
  base: 'base-styles',
  variants: {
    variant: {
      default: 'default-styles',
      // other variants
    },
    size: {
      sm: 'small-styles',
      md: 'medium-styles',
      lg: 'large-styles'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'md'
  }
})

export interface ComponentProps extends JSX.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'other'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

export const Component: ParentComponent<ComponentProps> = (props) => {
  const [local, others] = splitProps(props, ['variant', 'size', 'class', 'children'])

  return (
    <div
      class={cn(
        componentVariants({ variant: local.variant, size: local.size }),
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  )
}
```

### Testing Guidelines

- Test component rendering and props
- Test user interactions and events
- Test accessibility features
- Use SolidJS Testing Library patterns

### Story Guidelines

- Include all component variants
- Show common usage patterns
- Demonstrate accessibility features
- Provide interactive controls

## 🔧 Configuration

### TypeScript

The package generates TypeScript declarations automatically using `vite-plugin-dts`. Type definitions are available at `./dist/index.d.ts`.

### Tailwind CSS

Components use the project's Tailwind configuration with custom theme values:

- Primary colors: Purple theme
- Font family: Inter
- Custom spacing and sizing scales

## 📖 Best Practices

### SolidJS Patterns
- Use proper reactivity patterns, avoid React patterns
- Type events explicitly: `(e: Event)` or `(e: KeyboardEvent)`
- Use `splitProps` for prop handling
- Follow component composition patterns

### Accessibility
- Include ARIA labels and descriptions
- Ensure proper semantic HTML structure
- Support keyboard navigation
- Maintain color contrast ratios

### Performance
- Use `splitProps` to avoid unnecessary re-renders
- Implement proper memoization for expensive computations
- Keep component bundles small and focused

## 🔗 Related Documentation

- [Component Testing Guide](../../docs/testing.md)
- [Design System](../../docs/design-system.md)
- [Frontend Architecture](../../apps/web/README.md)
- [Storybook Deployment](../../docs/storybook.md)

## 📄 License

This component library is part of the PremStats project and follows the same licensing terms.