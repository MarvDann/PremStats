import type { Component, JSX } from 'solid-js'
import { splitProps } from 'solid-js'
import { tv, type VariantProps } from 'tailwind-variants'

const badgeVariants = tv({
  base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  variants: {
    variant: {
      default: 'bg-primary/10 text-primary hover:bg-primary/20',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
      outline: 'border border-input text-foreground',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export interface BadgeProps
  extends JSX.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: Component<BadgeProps> = (props) => {
  const [local, others] = splitProps(props, ['variant', 'class'])

  return (
    <div
      class={badgeVariants({ variant: local.variant, class: local.class })}
      {...others}
    />
  )
}