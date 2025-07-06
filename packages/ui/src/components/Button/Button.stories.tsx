import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { Button } from './Button'

const meta: Meta = {
  title: 'Components/Button',
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive', 'outline', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon']
    },
    disabled: {
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button variant="primary" {...args}>Primary Button</Button>,
      container
    )
    return container
  }
}

export const Secondary: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button variant="secondary" {...args}>Secondary Button</Button>,
      container
    )
    return container
  }
}

export const Destructive: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button variant="destructive" {...args}>Destructive Button</Button>,
      container
    )
    return container
  }
}

export const Outline: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button variant="outline" {...args}>Outline Button</Button>,
      container
    )
    return container
  }
}

export const Ghost: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button variant="ghost" {...args}>Ghost Button</Button>,
      container
    )
    return container
  }
}

export const Link: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button variant="link" {...args}>Link Button</Button>,
      container
    )
    return container
  }
}

export const Small: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button size="sm" {...args}>Small Button</Button>,
      container
    )
    return container
  }
}

export const Large: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button size="lg" {...args}>Large Button</Button>,
      container
    )
    return container
  }
}

export const Icon: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button size="icon" {...args}>+</Button>,
      container
    )
    return container
  }
}

export const Disabled: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Button disabled {...args}>Disabled Button</Button>,
      container
    )
    return container
  }
}