import { Component, createSignal, onError, JSX } from 'solid-js'
import { Card } from '@premstats/ui'

interface ErrorBoundaryProps {
  fallback?: (error: Error, reset: () => void) => JSX.Element
  children: JSX.Element
}

const defaultFallback = (error: Error, reset: () => void) => (
  <Card class="p-6 border-destructive">
    <div class="text-center space-y-4">
      <div class="text-destructive">
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold">Something went wrong</h3>
      <p class="text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred while loading this content.'}
      </p>
      <button 
        onClick={reset}
        class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
      >
        Try again
      </button>
    </div>
  </Card>
)

export const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
  const [error, setError] = createSignal<Error | null>(null)

  const reset = () => {
    setError(null)
  }

  onError((err) => {
    console.error('Error caught by boundary:', err)
    setError(err as Error)
  })

  if (error()) {
    const fallback = props.fallback || defaultFallback
    return fallback(error()!, reset)
  }

  return props.children
}