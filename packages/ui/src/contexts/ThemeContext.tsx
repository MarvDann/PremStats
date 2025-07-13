import { createContext, useContext, createSignal, onMount, JSX } from 'solid-js'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: () => Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>()

export function useTheme (): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: JSX.Element
  defaultTheme?: Theme
}

export function ThemeProvider (props: ThemeProviderProps) {
  const [theme, setThemeState] = createSignal<Theme>(props.defaultTheme || 'light')

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    updateDocumentTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme() === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const updateDocumentTheme = (theme: Theme) => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
      root.classList.add('dark')
    } else {
      root.removeAttribute('data-theme')
      root.classList.remove('dark')
    }
  }

  onMount(() => {
    // Check for saved theme preference or default to 'light'
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setThemeState(savedTheme)
      updateDocumentTheme(savedTheme)
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      setThemeState(systemTheme)
      updateDocumentTheme(systemTheme)
    }
  })

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  )
}