import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { Container } from './Container'
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card'

const meta: Meta = {
  title: 'Layout/Container',
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full']
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl']
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
        <div class="min-h-screen bg-gray-50">
          <Container {...args}>
            <Card>
              <CardHeader>
                <CardTitle>Container Example</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This content is contained within the Container component. The container centers content and provides responsive padding.</p>
              </CardContent>
            </Card>
          </Container>
        </div>
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
        <div class="min-h-screen bg-gray-50">
          <Container size="sm" {...args}>
            <Card>
              <CardHeader>
                <CardTitle>Small Container</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is a small container (max-w-2xl). Perfect for forms and focused content.</p>
              </CardContent>
            </Card>
          </Container>
        </div>
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
        <div class="min-h-screen bg-gray-50">
          <Container size="lg" {...args}>
            <Card>
              <CardHeader>
                <CardTitle>Large Container</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is a large container (max-w-6xl). Great for dashboards and data tables.</p>
              </CardContent>
            </Card>
          </Container>
        </div>
      ),
      container
    )
    return container
  }
}

export const FullWidth: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="min-h-screen bg-gray-50">
          <Container size="full" {...args}>
            <Card>
              <CardHeader>
                <CardTitle>Full Width Container</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This container takes the full width of its parent. Useful for wide layouts and data visualizations.</p>
              </CardContent>
            </Card>
          </Container>
        </div>
      ),
      container
    )
    return container
  }
}

export const NoPadding: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="min-h-screen bg-gray-50">
          <Container padding="none" {...args}>
            <Card class="rounded-none">
              <CardHeader>
                <CardTitle>No Padding Container</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This container has no horizontal padding. Content touches the edges.</p>
              </CardContent>
            </Card>
          </Container>
        </div>
      ),
      container
    )
    return container
  }
}

export const TeamsLayout: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="min-h-screen bg-gray-50">
          <Container {...args}>
            <div class="space-y-6">
              <div class="text-center">
                <h1 class="text-3xl font-bold text-gray-900">Premier League Teams</h1>
                <p class="text-gray-600 mt-2">Explore all 20 Premier League clubs</p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle>Team {i}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Team information and statistics</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Container>
        </div>
      ),
      container
    )
    return container
  }
}