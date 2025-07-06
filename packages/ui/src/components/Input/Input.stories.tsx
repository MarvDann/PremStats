import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { Input } from './Input'

const meta: Meta = {
  title: 'Components/Input',
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    disabled: {
      control: 'boolean'
    },
    placeholder: {
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
      () => <Input placeholder="Enter text..." {...args} />,
      container
    )
    return container
  }
}

export const Destructive: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input variant="destructive" placeholder="Error state" {...args} />,
      container
    )
    return container
  }
}

export const Small: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input size="sm" placeholder="Small input" {...args} />,
      container
    )
    return container
  }
}

export const Large: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input size="lg" placeholder="Large input" {...args} />,
      container
    )
    return container
  }
}

export const Disabled: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input disabled placeholder="Disabled input" {...args} />,
      container
    )
    return container
  }
}

export const SearchInput: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input type="search" placeholder="Search teams..." {...args} />,
      container
    )
    return container
  }
}

export const EmailInput: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input type="email" placeholder="Enter email address" {...args} />,
      container
    )
    return container
  }
}

export const PasswordInput: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input type="password" placeholder="Enter password" {...args} />,
      container
    )
    return container
  }
}

export const NumberInput: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => <Input type="number" placeholder="Enter number" min="0" max="100" {...args} />,
      container
    )
    return container
  }
}