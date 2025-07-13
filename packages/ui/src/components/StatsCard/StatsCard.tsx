import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'

const statsCardVariants = tv({
  base: 'relative overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md',
  variants: {
    variant: {
      default: 'bg-[hsl(var(--card))] border-[hsl(var(--border))] shadow-sm',
      secondary: 'bg-[var(--table-europa-conference-bg)] border-[var(--table-europa-conference-border)] shadow-sm',
      primary: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800/30',
      success: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/30 dark:to-green-900/20 dark:border-green-800/30',
      warning: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800/30',
      danger: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-800/30'
    },
    size: {
      sm: 'p-4',
      md: 'p-6', 
      lg: 'p-8'
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