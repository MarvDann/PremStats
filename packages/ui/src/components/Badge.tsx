import type { Component, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { cn } from '../utils/cn'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'

const badgeVariants = (props: { variant?: BadgeVariant; class?: string }) => {
  const variant = props.variant || 'default'
  
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
  
  const variantClasses = {
    default: 'bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
    outline: 'border border-input text-foreground',
    success: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.2)]',
    warning: 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.2)]',
    info: 'bg-primary/10 text-primary hover:bg-primary/20'
  }
  
  return cn(baseClasses, variantClasses[variant], props.class)
}

export interface BadgeProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant
}

export const Badge: Component<BadgeProps> = (props) => {
  const [local, others] = splitProps(props, ['variant', 'class'])

  return (
    <div
      class={badgeVariants({ variant: local.variant, class: local.class })}
      {...others}
    />
  )
}