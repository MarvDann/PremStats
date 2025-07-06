import { render, screen } from '@solidjs/testing-library'
import { describe, it, expect } from 'vitest'
import { TeamCard } from './TeamCard'

describe('TeamCard', () => {
  it('renders team name', () => {
    render(() => (
      <TeamCard name="Manchester United" />
    ))
    
    expect(screen.getByText('Manchester United')).toBeInTheDocument()
  })

  it('renders stadium when provided', () => {
    render(() => (
      <TeamCard
        name="Arsenal"
        stadium="Emirates Stadium"
      />
    ))
    
    expect(screen.getByText('Arsenal')).toBeInTheDocument()
    expect(screen.getByText('Emirates Stadium')).toBeInTheDocument()
  })

  it('renders manager when provided', () => {
    render(() => (
      <TeamCard
        name="Liverpool"
        manager="Jürgen Klopp"
      />
    ))
    
    expect(screen.getByText('Manager')).toBeInTheDocument()
    expect(screen.getByText('Jürgen Klopp')).toBeInTheDocument()
  })

  it('renders founded year when provided', () => {
    render(() => (
      <TeamCard
        name="Chelsea"
        founded={1905}
      />
    ))
    
    expect(screen.getByText('Founded')).toBeInTheDocument()
    expect(screen.getByText('1905')).toBeInTheDocument()
  })

  it('renders position badge', () => {
    render(() => (
      <TeamCard
        name="Manchester City"
        position={1}
      />
    ))
    
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('shows Champions League position styling', () => {
    render(() => (
      <TeamCard
        name="Arsenal"
        position={2}
        data-testid="team-card"
      />
    ))
    
    const positionBadge = screen.getByText('#2')
    expect(positionBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('shows European competition position styling', () => {
    render(() => (
      <TeamCard
        name="Newcastle"
        position={5}
      />
    ))
    
    const positionBadge = screen.getByText('#5')
    expect(positionBadge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('shows relegation zone position styling', () => {
    render(() => (
      <TeamCard
        name="Southampton"
        position={20}
      />
    ))
    
    const positionBadge = screen.getByText('#20')
    expect(positionBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('renders logo when provided', () => {
    render(() => (
      <TeamCard
        name="Arsenal"
        logo="https://example.com/arsenal-logo.png"
      />
    ))
    
    const logo = screen.getByAltText('Arsenal logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'https://example.com/arsenal-logo.png')
  })

  it('renders initials when no logo provided', () => {
    render(() => (
      <TeamCard name="Manchester United" />
    ))
    
    expect(screen.getByText('MA')).toBeInTheDocument()
  })

  it('shows stats when showStats is true', () => {
    render(() => (
      <TeamCard
        name="Liverpool"
        points={68}
        played={32}
        won={20}
        drawn={8}
        lost={4}
        goalsFor={71}
        goalsAgainst={35}
        showStats={true}
      />
    ))
    
    expect(screen.getByText('68')).toBeInTheDocument() // points
    expect(screen.getByText('Points')).toBeInTheDocument()
    expect(screen.getByText('32')).toBeInTheDocument() // played
    expect(screen.getByText('Played')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument() // won
    expect(screen.getByText('Won')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument() // drawn
    expect(screen.getByText('Drawn')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument() // lost
    expect(screen.getByText('Lost')).toBeInTheDocument()
    expect(screen.getByText('71')).toBeInTheDocument() // goals for
    expect(screen.getByText('Goals For')).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument() // goals against
    expect(screen.getByText('Goals Against')).toBeInTheDocument()
  })

  it('hides stats when showStats is false', () => {
    render(() => (
      <TeamCard
        name="Liverpool"
        points={68}
        played={32}
        showStats={false}
      />
    ))
    
    expect(screen.queryByText('Points')).not.toBeInTheDocument()
    expect(screen.queryByText('Played')).not.toBeInTheDocument()
  })

  it('applies default size and variant', () => {
    render(() => (
      <TeamCard
        name="Chelsea"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveClass('max-w-md') // default size
  })

  it('applies small size', () => {
    render(() => (
      <TeamCard
        name="Chelsea"
        size="sm"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveClass('max-w-sm')
  })

  it('applies large size', () => {
    render(() => (
      <TeamCard
        name="Chelsea"
        size="lg"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveClass('max-w-lg')
  })

  it('applies compact variant', () => {
    render(() => (
      <TeamCard
        name="Chelsea"
        variant="compact"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveClass('[&_.team-logo]:w-8', '[&_.team-logo]:h-8')
  })

  it('applies featured variant', () => {
    render(() => (
      <TeamCard
        name="Chelsea"
        variant="featured"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveClass('[&_.team-logo]:w-16', '[&_.team-logo]:h-16')
  })

  it('applies custom class names', () => {
    render(() => (
      <TeamCard
        name="Arsenal"
        class="custom-team-card"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveClass('custom-team-card')
  })

  it('forwards HTML attributes', () => {
    render(() => (
      <TeamCard
        name="Tottenham"
        id="spurs-card"
        role="button"
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    expect(card).toHaveAttribute('id', 'spurs-card')
    expect(card).toHaveAttribute('role', 'button')
  })

  it('supports click events', () => {
    let clicked = false
    const handleClick = () => { clicked = true }
    
    render(() => (
      <TeamCard
        name="West Ham"
        onClick={handleClick}
        data-testid="team-card"
      />
    ))
    
    const card = screen.getByTestId('team-card')
    card.click()
    expect(clicked).toBe(true)
  })

  it('shows position qualification labels', () => {
    render(() => (
      <TeamCard
        name="Manchester City"
        position={1}
      />
    ))
    
    expect(screen.getByText('Champions League')).toBeInTheDocument()
  })

  it('shows relegation zone label', () => {
    render(() => (
      <TeamCard
        name="Southampton"
        position={18}
      />
    ))
    
    expect(screen.getByText('Relegation Zone')).toBeInTheDocument()
  })

  it('handles teams with long names', () => {
    render(() => (
      <TeamCard name="Tottenham Hotspur Football Club" />
    ))
    
    expect(screen.getByText('Tottenham Hotspur Football Club')).toBeInTheDocument()
  })
})