import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, it, expect, vi } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('renders with default props', () => {
    render(() => <Input placeholder="Test input" />)
    const input = screen.getByPlaceholderText('Test input')
    expect(input).toBeInTheDocument()
  })

  it('renders with default variant', () => {
    render(() => <Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('border-input')
  })

  it('renders with destructive variant', () => {
    render(() => <Input variant="destructive" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('border-destructive')
  })

  it('renders with small size', () => {
    render(() => <Input size="sm" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('h-8', 'px-2', 'text-xs')
  })

  it('renders with medium size by default', () => {
    render(() => <Input data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('h-10', 'px-3', 'text-sm')
  })

  it('renders with large size', () => {
    render(() => <Input size="lg" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('h-12', 'px-4', 'text-base')
  })

  it('handles input changes', () => {
    const handleChange = vi.fn()
    render(() => <Input onInput={handleChange} data-testid="input" />)
    const input = screen.getByTestId('input')
    
    fireEvent.input(input, { target: { value: 'test value' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(() => <Input disabled data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:opacity-50')
  })

  it('applies custom class names', () => {
    render(() => <Input class="custom-class" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-class')
  })

  it('forwards HTML attributes', () => {
    render(() => <Input type="email" id="email-input" data-testid="input" />)
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('id', 'email-input')
  })

  it('handles different input types', () => {
    render(() => <Input type="search" placeholder="Search..." data-testid="search" />)
    const input = screen.getByTestId('search')
    expect(input).toHaveAttribute('type', 'search')
    expect(input).toHaveAttribute('placeholder', 'Search...')
  })

  it('supports focus events', () => {
    const handleFocus = vi.fn()
    render(() => <Input onFocus={handleFocus} data-testid="input" />)
    const input = screen.getByTestId('input')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalled()
  })

  it('supports blur events', () => {
    const handleBlur = vi.fn()
    render(() => <Input onBlur={handleBlur} data-testid="input" />)
    const input = screen.getByTestId('input')
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalled()
  })

  it('handles value prop', () => {
    render(() => <Input value="preset value" data-testid="input" />)
    const input = screen.getByTestId('input') as HTMLInputElement
    expect(input.value).toBe('preset value')
  })
})