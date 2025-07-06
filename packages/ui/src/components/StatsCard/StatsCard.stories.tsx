import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { StatsCard } from './StatsCard'

const meta: Meta = {
  title: 'Components/StatsCard',
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    label: {
      control: 'text'
    },
    value: {
      control: 'text'
    },
    description: {
      control: 'text'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <StatsCard label="Goals" value="25" {...args} />,
      container
    )
    return container
  }
}

export const WithDescription: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <StatsCard 
          label="Goals" 
          value="25" 
          description="In 32 appearances"
          {...args} 
        />
      ),
      container
    )
    return container
  }
}

export const WithIcon: Story = {
  render: (args) => {
    const container = document.createElement('div')
    const icon = (
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    )
    render(
      () => (
        <StatsCard 
          label="Goals" 
          value="25" 
          description="Top scorer"
          icon={icon}
          {...args} 
        />
      ),
      container
    )
    return container
  }
}

export const Success: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <StatsCard 
          variant="success"
          label="Win Rate" 
          value="85%" 
          description="Last 10 matches"
          {...args} 
        />
      ),
      container
    )
    return container
  }
}

export const Warning: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <StatsCard 
          variant="warning"
          label="Yellow Cards" 
          value="8" 
          description="Season total"
          {...args} 
        />
      ),
      container
    )
    return container
  }
}

export const Danger: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <StatsCard 
          variant="danger"
          label="Red Cards" 
          value="2" 
          description="Season total"
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
        <StatsCard 
          size="sm"
          label="Assists" 
          value="12" 
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
        <StatsCard 
          size="lg"
          label="Total Points" 
          value="68" 
          description="Current season"
          {...args} 
        />
      ),
      container
    )
    return container
  }
}

export const PlayerStats: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
          <StatsCard label="Goals" value="25" description="This season" />
          <StatsCard label="Assists" value="12" description="This season" />
          <StatsCard label="Appearances" value="32" description="All competitions" />
          <StatsCard label="Minutes" value="2,847" description="Total played" />
        </div>
      ),
      container
    )
    return container
  }
}

export const TeamStats: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          <StatsCard 
            variant="success"
            label="League Position" 
            value="3rd" 
            description="Premier League"
            size="lg"
          />
          <StatsCard 
            label="Total Points" 
            value="68" 
            description="32 games played"
            size="lg"
          />
          <StatsCard 
            variant="success"
            label="Goal Difference" 
            value="+24" 
            description="52 for, 28 against"
            size="lg"
          />
        </div>
      ),
      container
    )
    return container
  }
}