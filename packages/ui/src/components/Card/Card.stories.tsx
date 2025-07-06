import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card'
import { Button } from '../Button'

const meta: Meta = {
  title: 'Components/Card',
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated']
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
        <Card {...args}>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card description goes here</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area where you can put any content.</p>
          </CardContent>
          <CardFooter>
            <Button>Action</Button>
          </CardFooter>
        </Card>
      ),
      container
    )
    return container
  }
}

export const Outlined: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <Card variant="outlined" {...args}>
          <CardHeader>
            <CardTitle>Outlined Card</CardTitle>
            <CardDescription>This card has a thicker border</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content for the outlined card variant.</p>
          </CardContent>
        </Card>
      ),
      container
    )
    return container
  }
}

export const Elevated: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <Card variant="elevated" {...args}>
          <CardHeader>
            <CardTitle>Elevated Card</CardTitle>
            <CardDescription>This card has enhanced shadow</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content for the elevated card variant.</p>
          </CardContent>
        </Card>
      ),
      container
    )
    return container
  }
}

export const WithoutHeader: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <Card {...args}>
          <CardContent>
            <p>This card has no header, just content.</p>
          </CardContent>
        </Card>
      ),
      container
    )
    return container
  }
}

export const WithoutFooter: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <Card {...args}>
          <CardHeader>
            <CardTitle>No Footer</CardTitle>
            <CardDescription>This card has no footer</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Just header and content, no footer.</p>
          </CardContent>
        </Card>
      ),
      container
    )
    return container
  }
}

export const TeamCard: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <Card {...args}>
          <CardHeader>
            <CardTitle>Manchester United</CardTitle>
            <CardDescription>Old Trafford, Manchester</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex justify-between">
              <div>
                <p class="text-sm font-medium">Position</p>
                <p class="text-2xl font-bold">3rd</p>
              </div>
              <div>
                <p class="text-sm font-medium">Points</p>
                <p class="text-2xl font-bold">65</p>
              </div>
              <div>
                <p class="text-sm font-medium">Games</p>
                <p class="text-2xl font-bold">32</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
      container
    )
    return container
  }
}