import { JSX, ParentComponent, splitProps } from 'solid-js'
import { cn } from '../../utils/cn'
import { InputVariant, InputSize } from '../../types'

const inputVariants = (props: { variant?: InputVariant; size?: InputSize }) => {
  const variant = props.variant || 'default'
  const size = props.size || 'md'
  
  const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  
  const variantClasses = {
    default: 'border-input',
    destructive: 'border-destructive focus-visible:ring-destructive'
  }
  
  const sizeClasses = {
    sm: 'h-8 px-2 text-xs',
    md: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base'
  }
  
  return cn(baseClasses, variantClasses[variant], sizeClasses[size])
}

export interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant
  size?: InputSize
  class?: string
}

export const Input: ParentComponent<InputProps> = (props) => {
  const [local, others] = splitProps(props, ['variant', 'size', 'class'])

  return (
    <input
      class={cn(
        inputVariants({ variant: local.variant, size: local.size }),
        local.class
      )}
      {...others}
    />
  )
}