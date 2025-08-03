import { JSX, ParentComponent, splitProps } from 'solid-js'
import { cn } from '../../utils/cn'

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl'

const containerVariants = (props: { size?: ContainerSize; padding?: ContainerPadding }) => {
  const size = props.size || 'xl'
  const padding = props.padding || 'md'
  
  const baseClasses = 'w-full mx-auto'
  
  const sizeClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  }
  
  const paddingClasses = {
    none: 'px-0',
    sm: 'px-2',
    md: 'px-4',
    lg: 'px-6',
    xl: 'px-8'
  }
  
  return cn(baseClasses, sizeClasses[size], paddingClasses[padding])
}

export interface ContainerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize
  padding?: ContainerPadding
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