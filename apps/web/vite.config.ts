import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'path'

export default defineConfig({
  plugins: [solid()],
  server: {
    host: true,
    port: 3000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@premstats/ui': resolve(__dirname, '../../packages/ui/src')
    }
  }
})