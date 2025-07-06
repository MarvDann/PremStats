import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { Label } from './Label'
import { Input } from '../Input/Input'

const meta: Meta = {
  title: 'Components/Label',
  parameters: {
    layout: 'centered'
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Label {...args}>Default Label</Label>,
      container
    )
    return container
  }
}

export const WithInput: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="space-y-2">
          <Label for="email" {...args}>Email Address</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
      ),
      container
    )
    return container
  }
}

export const Required: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="space-y-2">
          <Label for="password" {...args}>
            Password <span class="text-destructive">*</span>
          </Label>
          <Input id="password" type="password" placeholder="Enter password" />
        </div>
      ),
      container
    )
    return container
  }
}

export const TeamSearch: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="space-y-2">
          <Label for="team-search" {...args}>Search Teams</Label>
          <Input id="team-search" type="search" placeholder="Arsenal, Manchester United..." />
        </div>
      ),
      container
    )
    return container
  }
}

export const PlayerFilter: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="space-y-2">
          <Label for="player-position" {...args}>Player Position</Label>
          <select id="player-position" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">All Positions</option>
            <option value="goalkeeper">Goalkeeper</option>
            <option value="defender">Defender</option>
            <option value="midfielder">Midfielder</option>
            <option value="forward">Forward</option>
          </select>
        </div>
      ),
      container
    )
    return container
  }
}

export const CustomStyling: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="space-y-2">
          <Label class="text-lg font-bold text-primary" {...args}>
            Premier League Statistics
          </Label>
          <Input placeholder="Search for stats..." />
        </div>
      ),
      container
    )
    return container
  }
}