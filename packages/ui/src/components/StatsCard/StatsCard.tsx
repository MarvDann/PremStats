import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'
import { Card, CardContent } from '../Card'

const statsCardVariants = tv({
  base: 'text-center',
  variants: {
    variant: {
      default: '',
      success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
      warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
      danger: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
    },
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'md'
  }
})

const valueVariants = tv({
  variants: {
    size: {
      sm: 'text-lg font-bold',
      md: 'text-2xl font-bold',
      lg: 'text-3xl font-bold'
    },
    variant: {
      default: 'text-foreground',
      success: 'text-green-700 dark:text-green-300',
      warning: 'text-yellow-700 dark:text-yellow-300',
      danger: 'text-red-700 dark:text-red-300'
    }
  },
  defaultVariants: {
    size: 'md',
    variant: 'default'
  }
})

const labelVariants = tv({
  base: 'text-sm font-medium text-muted-foreground',
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
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

export const StatsCard: ParentComponent<StatsCardProps> = (props) => {
  const [local, others] = splitProps(props, ['label', 'value', 'description', 'icon', 'variant', 'size', 'class'])

  return (
    <Card
      class={cn(statsCardVariants({ variant: local.variant, size: local.size }), local.class)}
      {...others}
    >
      <CardContent class="space-y-2">
        {local.icon && (
          <div class="flex justify-center text-muted-foreground">
            {local.icon}
          </div>
        )}
        <div class={valueVariants({ size: local.size, variant: local.variant })}>
          {local.value}
        </div>
        <div class={labelVariants({ size: local.size })}>
          {local.label}
        </div>
        {local.description && (
          <div class="text-xs text-muted-foreground">
            {local.description}
          </div>
        )}
      </CardContent>
    </Card>
  )
}