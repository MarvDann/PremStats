import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'

const statsCardVariants = tv({
  base: 'relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md text-center',
  variants: {
    variant: {
      default: 'bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-sm',
      secondary: 'bg-[var(--color-table-europa-conference-bg)] border-[var(--color-table-europa-conference-border)] shadow-sm',
      primary: 'bg-[hsl(var(--primary)/0.1)] border-[hsl(var(--primary)/0.2)]',
      success: 'bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.2)]',
      warning: 'bg-[hsl(var(--warning)/0.1)] border-[hsl(var(--warning)/0.2)]',
      danger: 'bg-[hsl(var(--destructive)/0.1)] border-[hsl(var(--destructive)/0.2)]'
    },
    size: {
      sm: 'p-3',
      md: 'p-6', 
      lg: 'p-6'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'md'
  }
})

const valueVariants = tv({
  base: 'font-bold text-[hsl(var(--foreground))]',
  variants: {
    size: {
      sm: 'text-xl',
      md: 'text-2xl',
      lg: 'text-3xl'
    }
  },
  defaultVariants: {
    size: 'md'
  }
})

const labelVariants = tv({
  base: 'text-[hsl(var(--muted-foreground))] font-medium',
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    }
  },
  defaultVariants: {
    size: 'md'
  }
})

export interface StatsCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  description?: string
  icon?: JSX.Element
  variant?: 'default' | 'secondary' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

export const StatsCard: ParentComponent<StatsCardProps> = (props) => {
  const [local, others] = splitProps(props, ['label', 'value', 'description', 'icon', 'variant', 'size', 'class'])

  return (
    <div
      class={cn(
        statsCardVariants({ variant: local.variant, size: local.size }),
        local.class
      )}
      {...others}
    >
      <div class="flex flex-col items-center text-center space-y-2">
        {local.icon && (
          <div class="text-[hsl(var(--muted-foreground))] opacity-70">
            {local.icon}
          </div>
        )}
        
        <div class="space-y-1">
          <div class={valueVariants({ size: local.size })}>
            {local.value}
          </div>
          <div class={labelVariants({ size: local.size })}>
            {local.label}
          </div>
        </div>

        {local.description && (
          <div class="text-xs text-[hsl(var(--muted-foreground))] opacity-80 leading-relaxed">
            {local.description}
          </div>
        )}
      </div>
    </div>
  )
}