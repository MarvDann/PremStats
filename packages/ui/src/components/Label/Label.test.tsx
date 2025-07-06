import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { Label } from './Label'

describe('Label', () => {
  it('renders with text content', () => {
    render(() => <Label>Test Label</Label>)
    const label = screen.getByText('Test Label')
    expect(label).toBeInTheDocument()
  })

  it('renders as a label element', () => {
    render(() => <Label>Label Text</Label>)
    const label = screen.getByText('Label Text')
    expect(label.tagName).toBe('LABEL')
  })

  it('applies default styling classes', () => {
    render(() => <Label data-testid="label">Styled Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('text-sm', 'font-medium', 'leading-none')
  })

  it('applies custom class names', () => {
    render(() => <Label class="custom-class" data-testid="label">Custom Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('custom-class')
    expect(label).toHaveClass('text-sm') // should still have base classes
  })

  it('forwards HTML attributes', () => {
    render(() => <Label for="input-id" id="label-id" data-testid="label">Associated Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('for', 'input-id')
    expect(label).toHaveAttribute('id', 'label-id')
  })

  it('supports htmlFor attribute', () => {
    render(() => <Label htmlFor="test-input" data-testid="label">Form Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('renders complex children', () => {
    render(() => (
      <Label data-testid="label">
        Email <span class="text-destructive">*</span>
      </Label>
    ))
    const label = screen.getByTestId('label')
    expect(label).toBeInTheDocument()
    expect(label.textContent).toContain('Email')
    expect(label.textContent).toContain('*')
  })

  it('handles peer-disabled styling', () => {
    render(() => <Label data-testid="label">Disabled Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70')
  })

  it('can be used with aria-label', () => {
    render(() => <Label aria-label="Accessible label" data-testid="label">Visible Label</Label>)
    const label = screen.getByTestId('label')
    expect(label).toHaveAttribute('aria-label', 'Accessible label')
  })

  it('supports click events', () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    
    render(() => <Label onClick={handleClick} data-testid="label">Clickable Label</Label>)
    const label = screen.getByTestId('label')
    
    label.click()
    expect(clicked).toBe(true)
  })
})