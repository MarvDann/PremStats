import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'

describe('Card', () => {
  it('renders with default variant', () => {
    render(() => <Card>Card content</Card>)
    const card = screen.getByText('Card content')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('bg-card')
  })

  it('renders with outlined variant', () => {
    render(() => <Card variant="outlined">Outlined card</Card>)
    const card = screen.getByText('Outlined card')
    expect(card).toHaveClass('border-2')
  })

  it('renders with elevated variant', () => {
    render(() => <Card variant="elevated">Elevated card</Card>)
    const card = screen.getByText('Elevated card')
    expect(card).toHaveClass('shadow-lg')
  })

  it('applies custom class names', () => {
    render(() => <Card class="custom-class">Custom card</Card>)
    const card = screen.getByText('Custom card')
    expect(card).toHaveClass('custom-class')
  })
})

describe('CardHeader', () => {
  it('renders with proper styling', () => {
    render(() => <CardHeader>Header content</CardHeader>)
    const header = screen.getByText('Header content')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
  })

  it('applies custom class names', () => {
    render(() => <CardHeader class="custom-header">Custom header</CardHeader>)
    const header = screen.getByText('Custom header')
    expect(header).toHaveClass('custom-header')
  })
})

describe('CardTitle', () => {
  it('renders as h3 with proper styling', () => {
    render(() => <CardTitle>Card Title</CardTitle>)
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Card Title')
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
  })

  it('applies custom class names', () => {
    render(() => <CardTitle class="custom-title">Custom Title</CardTitle>)
    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toHaveClass('custom-title')
  })
})

describe('CardDescription', () => {
  it('renders with proper styling', () => {
    render(() => <CardDescription>Card description</CardDescription>)
    const description = screen.getByText('Card description')
    expect(description).toBeInTheDocument()
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })

  it('applies custom class names', () => {
    render(() => <CardDescription class="custom-desc">Custom description</CardDescription>)
    const description = screen.getByText('Custom description')
    expect(description).toHaveClass('custom-desc')
  })
})

describe('CardContent', () => {
  it('renders with proper styling', () => {
    render(() => <CardContent>Card content</CardContent>)
    const content = screen.getByText('Card content')
    expect(content).toBeInTheDocument()
    expect(content).toHaveClass('p-6', 'pt-0')
  })

  it('applies custom class names', () => {
    render(() => <CardContent class="custom-content">Custom content</CardContent>)
    const content = screen.getByText('Custom content')
    expect(content).toHaveClass('custom-content')
  })
})

describe('CardFooter', () => {
  it('renders with proper styling', () => {
    render(() => <CardFooter>Footer content</CardFooter>)
    const footer = screen.getByText('Footer content')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
  })

  it('applies custom class names', () => {
    render(() => <CardFooter class="custom-footer">Custom footer</CardFooter>)
    const footer = screen.getByText('Custom footer')
    expect(footer).toHaveClass('custom-footer')
  })
})

describe('Card composition', () => {
  it('renders complete card structure', () => {
    render(() => (
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test content</p>
        </CardContent>
        <CardFooter>
          <button>Test button</button>
        </CardFooter>
      </Card>
    ))

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Title')
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Test button' })).toBeInTheDocument()
  })
})