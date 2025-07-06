import { JSX, ParentComponent, splitProps } from 'solid-js'
import { tv } from 'tailwind-variants'
import { cn } from '../../utils/cn'

const labelVariants = tv({
  base: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
})

export interface LabelProps extends JSX.LabelHTMLAttributes<HTMLLabelElement> {
  class?: string
  children?: JSX.Element
}

export const Label: ParentComponent<LabelProps> = (props) => {
  const [local, others] = splitProps(props, ['class', 'children'])

  return (
    <label
      class={cn(labelVariants(), local.class)}
      {...others}
    >
      {local.children}
    </label>
  )
}