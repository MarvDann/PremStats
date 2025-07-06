import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { TeamCard } from './TeamCard'

const meta: Meta = {
  title: 'Components/TeamCard',
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    variant: {
      control: 'select',
      options: ['default', 'compact', 'featured']
    },
    showStats: {
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          name="Manchester United"
          stadium="Old Trafford"
          manager="Erik ten Hag"
          founded={1878}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const WithLogo: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          name="Arsenal"
          stadium="Emirates Stadium"
          manager="Mikel Arteta"
          founded={1886}
          logo="https://logos-world.net/wp-content/uploads/2020/06/Arsenal-Logo.png"
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const WithStats: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          name="Manchester City"
          stadium="Etihad Stadium"
          manager="Pep Guardiola"
          position={1}
          points={77}
          played={32}
          won={24}
          drawn={5}
          lost={3}
          goalsFor={78}
          goalsAgainst={29}
          showStats={true}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const ChampionsLeague: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          name="Arsenal"
          stadium="Emirates Stadium"
          position={2}
          points={75}
          played={32}
          won={23}
          drawn={6}
          lost={3}
          showStats={true}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const EuropeanCompetition: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          name="Newcastle United"
          stadium="St. James' Park"
          position={5}
          points={62}
          played={32}
          won={17}
          drawn={11}
          lost={4}
          showStats={true}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const RelegationZone: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          name="Southampton"
          stadium="St. Mary's Stadium"
          position={20}
          points={24}
          played={32}
          won={6}
          drawn={6}
          lost={20}
          goalsFor={28}
          goalsAgainst={59}
          showStats={true}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const Compact: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          variant="compact"
          name="Liverpool"
          stadium="Anfield"
          position={3}
          points={68}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const Featured: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          variant="featured"
          name="Tottenham Hotspur"
          stadium="Tottenham Hotspur Stadium"
          manager="Ange Postecoglou"
          founded={1882}
          position={8}
          points={56}
          played={32}
          won={16}
          drawn={8}
          lost={8}
          goalsFor={63}
          goalsAgainst={54}
          showStats={true}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const Small: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          size="sm"
          name="Chelsea"
          stadium="Stamford Bridge"
          position={11}
          points={43}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const Large: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <TeamCard
          size="lg"
          name="West Ham United"
          stadium="London Stadium"
          manager="David Moyes"
          founded={1895}
          position={14}
          points={40}
          played={32}
          won={11}
          drawn={7}
          lost={14}
          showStats={true}
          {...args}
        />
      ),
      container
    )
    return container
  }
}

export const Grid: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          <TeamCard
            name="Manchester City"
            stadium="Etihad Stadium"
            position={1}
            points={77}
            showStats={true}
          />
          <TeamCard
            name="Arsenal"
            stadium="Emirates Stadium"
            position={2}
            points={75}
            showStats={true}
          />
          <TeamCard
            name="Liverpool"
            stadium="Anfield"
            position={3}
            points={68}
            showStats={true}
          />
          <TeamCard
            name="Newcastle United"
            stadium="St. James' Park"
            position={4}
            points={62}
            showStats={true}
          />
          <TeamCard
            name="Manchester United"
            stadium="Old Trafford"
            position={5}
            points={60}
            showStats={true}
          />
          <TeamCard
            name="Tottenham Hotspur"
            stadium="Tottenham Hotspur Stadium"
            position={8}
            points={56}
            showStats={true}
          />
        </div>
      ),
      container
    )
    return container
  }
}