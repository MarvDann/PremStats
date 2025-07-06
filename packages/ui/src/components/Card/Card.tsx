import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'
import { CardVariant } from '../../types'

const cardVariants = tv({
  base: 'rounded-lg border text-card-foreground shadow-sm',
  variants: {
    variant: {
      default: 'bg-card',
      outlined: 'bg-card border-2',
      elevated: 'bg-card shadow-lg'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  class?: string
  children?: JSX.Element
}

export const Card: ParentComponent<CardProps> = (props) => {
  const [local, others] = splitProps(props, ['variant', 'class', 'children'])

  return (
    <div
      class={cn(
        cardVariants({ variant: local.variant }),
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  )
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string
  children?: JSX.Element
}

export const CardHeader: ParentComponent<CardHeaderProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <div
      class={cn('flex flex-col space-y-1.5 p-6', local.class)}
      {...others}
    >
      {local.children}
    </div>
  )
}

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {
  class?: string
  children?: JSX.Element
}

export const CardTitle: ParentComponent<CardTitleProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <h3
      class={cn('text-2xl font-semibold leading-none tracking-tight', local.class)}
      {...others}
    >
      {local.children}
    </h3>
  )
}

export interface CardDescriptionProps extends JSX.HTMLAttributes<HTMLParagraphElement> {
  class?: string
  children?: JSX.Element
}

export const CardDescription: ParentComponent<CardDescriptionProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <p
      class={cn('text-sm text-muted-foreground', local.class)}
      {...others}
    >
      {local.children}
    </p>
  )
}

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string
  children?: JSX.Element
}

export const CardContent: ParentComponent<CardContentProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <div
      class={cn('p-6 pt-0', local.class)}
      {...others}
    >
      {local.children}
    </div>
  )
}

export interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {
  class?: string
  children?: JSX.Element
}

export const CardFooter: ParentComponent<CardFooterProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <div
      class={cn('flex items-center p-6 pt-0', local.class)}
      {...others}
    >
      {local.children}
    </div>
  )
}