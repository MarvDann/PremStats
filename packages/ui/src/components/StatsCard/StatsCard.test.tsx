import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { StatsCard } from './StatsCard'

describe('StatsCard', () => {
  it('renders with label and value', () => {
    render(() => <StatsCard label="Goals" value="25" />)
    
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(() => (
      <StatsCard 
        label="Goals" 
        value="25" 
        description="This season" 
      />
    ))
    
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('This season')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const TestIcon = () => <div data-testid="test-icon">⚽</div>
    
    render(() => (
      <StatsCard 
        label="Goals" 
        value="25" 
        icon={<TestIcon />}
      />
    ))
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('applies default variant styling', () => {
    render(() => (
      <StatsCard 
        label="Goals" 
        value="25" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('text-center')
  })

  it('applies success variant styling', () => {
    render(() => (
      <StatsCard 
        variant="success"
        label="Win Rate" 
        value="85%" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('bg-green-50', 'border-green-200')
  })

  it('applies warning variant styling', () => {
    render(() => (
      <StatsCard 
        variant="warning"
        label="Yellow Cards" 
        value="8" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('bg-yellow-50', 'border-yellow-200')
  })

  it('applies danger variant styling', () => {
    render(() => (
      <StatsCard 
        variant="danger"
        label="Red Cards" 
        value="2" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('bg-red-50', 'border-red-200')
  })

  it('applies small size styling', () => {
    render(() => (
      <StatsCard 
        size="sm"
        label="Assists" 
        value="12" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('p-3')
  })

  it('applies large size styling', () => {
    render(() => (
      <StatsCard 
        size="lg"
        label="Points" 
        value="68" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('p-6')
  })

  it('handles numeric values', () => {
    render(() => <StatsCard label="Goals" value={25} />)
    
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('handles string values', () => {
    render(() => <StatsCard label="Position" value="3rd" />)
    
    expect(screen.getByText('3rd')).toBeInTheDocument()
  })

  it('applies custom class names', () => {
    render(() => (
      <StatsCard 
        class="custom-class"
        label="Goals" 
        value="25" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveClass('custom-class')
  })

  it('forwards HTML attributes', () => {
    render(() => (
      <StatsCard 
        id="stats-card"
        role="button"
        label="Goals" 
        value="25" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    expect(card).toHaveAttribute('id', 'stats-card')
    expect(card).toHaveAttribute('role', 'button')
  })

  it('supports click events', () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    
    render(() => (
      <StatsCard 
        onClick={handleClick}
        label="Goals" 
        value="25" 
        data-testid="stats-card"
      />
    ))
    
    const card = screen.getByTestId('stats-card')
    card.click()
    expect(clicked).toBe(true)
  })

  it('renders without description', () => {
    render(() => <StatsCard label="Goals" value="25" />)
    
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.queryByText('This season')).not.toBeInTheDocument()
  })

  it('renders without icon', () => {
    render(() => <StatsCard label="Goals" value="25" />)
    
    expect(screen.getByText('Goals')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
  })
})