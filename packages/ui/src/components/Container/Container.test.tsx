import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { Container } from './Container'

describe('Container', () => {
  it('renders with children', () => {
    render(() => (
      <Container>
        <div>Test content</div>
      </Container>
    ))
    const content = screen.getByText('Test content')
    expect(content).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(() => (
      <Container data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('w-full', 'mx-auto', 'max-w-7xl', 'px-4')
  })

  it('renders with small size', () => {
    render(() => (
      <Container size="sm" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('max-w-2xl')
  })

  it('renders with medium size', () => {
    render(() => (
      <Container size="md" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('max-w-4xl')
  })

  it('renders with large size', () => {
    render(() => (
      <Container size="lg" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('max-w-6xl')
  })

  it('renders with extra large size', () => {
    render(() => (
      <Container size="xl" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('max-w-7xl')
  })

  it('renders with full width', () => {
    render(() => (
      <Container size="full" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('max-w-full')
  })

  it('renders with no padding', () => {
    render(() => (
      <Container padding="none" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('px-0')
  })

  it('renders with small padding', () => {
    render(() => (
      <Container padding="sm" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('px-2')
  })

  it('renders with large padding', () => {
    render(() => (
      <Container padding="lg" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('px-6')
  })

  it('renders with extra large padding', () => {
    render(() => (
      <Container padding="xl" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('px-8')
  })

  it('applies custom class names', () => {
    render(() => (
      <Container class="custom-class" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('custom-class')
    expect(container).toHaveClass('w-full') // should still have base classes
  })

  it('forwards HTML attributes', () => {
    render(() => (
      <Container id="main-container" role="main" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveAttribute('id', 'main-container')
    expect(container).toHaveAttribute('role', 'main')
  })

  it('combines size and padding variants', () => {
    render(() => (
      <Container size="sm" padding="lg" data-testid="container">
        <div>Content</div>
      </Container>
    ))
    const container = screen.getByTestId('container')
    expect(container).toHaveClass('max-w-2xl', 'px-6')
  })

  it('renders complex children', () => {
    render(() => (
      <Container>
        <div>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </div>
      </Container>
    ))
    
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph')).toBeInTheDocument()
    expect(screen.getByText('Button')).toBeInTheDocument()
  })
})