import type { StorybookConfig } from '@storybook/html-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  viteFinal: async (config) => {
    const { mergeConfig } = await import('vite')
    const { default: solid } = await import('vite-plugin-solid')

    return mergeConfig(config, {
      plugins: [solid()],
      resolve: {
        alias: {
          '@': '/src'
        }
      }
    })
  }
}

export default config