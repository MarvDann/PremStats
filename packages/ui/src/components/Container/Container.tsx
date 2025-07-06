import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'

const containerVariants = tv({
  base: 'w-full mx-auto px-4',
  variants: {
    size: {
      sm: 'max-w-2xl',
      md: 'max-w-4xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full'
    },
    padding: {
      none: 'px-0',
      sm: 'px-2',
      md: 'px-4',
      lg: 'px-6',
      xl: 'px-8'
    }
  },
  defaultVariants: {
    size: 'xl',
    padding: 'md'
  }
})

export interface ContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  class?: string
  children?: JSX.Element
}

export const Container: ParentComponent<ContainerProps> = (props) => {
  const [local, others] = splitProps(props, ['size', 'padding', 'class', 'children'])

  return (
    <div
      class={cn(
        containerVariants({ size: local.size, padding: local.padding }),
        local.class
      )}
      {...others}
    >
      {local.children}
    </div>
  )
}