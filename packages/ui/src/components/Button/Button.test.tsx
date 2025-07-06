import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders with default props', () => {
    render(() => <Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })

  it('renders with primary variant by default', () => {
    render(() => <Button>Primary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary')
  })

  it('renders with secondary variant', () => {
    render(() => <Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary')
  })

  it('renders with destructive variant', () => {
    render(() => <Button variant="destructive">Destructive</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('renders with outline variant', () => {
    render(() => <Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border')
  })

  it('renders with ghost variant', () => {
    render(() => <Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('renders with link variant', () => {
    render(() => <Button variant="link">Link</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-primary')
  })

  it('renders with small size', () => {
    render(() => <Button size="sm">Small</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')
  })

  it('renders with large size', () => {
    render(() => <Button size="lg">Large</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-11')
  })

  it('renders with icon size', () => {
    render(() => <Button size="icon">+</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'w-10')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(() => <Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(() => <Button disabled>Disabled</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('applies custom class names', () => {
    render(() => <Button class="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards HTML attributes', () => {
    render(() => <Button type="submit" id="submit-btn">Submit</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('id', 'submit-btn')
  })
})