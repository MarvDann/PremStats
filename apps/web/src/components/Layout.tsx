import type { ParentComponent } from 'solid-js'
import { createSignal } from 'solid-js'
import { A } from '@solidjs/router'
import { ErrorBoundary } from './ErrorBoundary'
import { ThemeProvider, ThemeSwitcher } from '@premstats/ui'

const Layout: ParentComponent = (props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen())
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <ThemeProvider>
      <div class="min-h-screen bg-background">
        <nav class="border-b border-[hsl(var(--border))] bg-[hsl(var(--primary))] shadow-lg">
          <div class="container mx-auto px-4">
            <div class="flex h-16 items-center">
              <div class="flex items-center w-40">
                <A href="/" class="text-xl font-bold text-[hsl(var(--primary-foreground))] drop-shadow-sm whitespace-nowrap" onClick={closeMobileMenu}>
                ⚽ PremStats
                </A>
              </div>

              <div class="flex-1 flex justify-center">
                <div class="hidden md:flex items-center space-x-6">
                  <A
                    href="/teams"
                    class="text-sm font-semibold transition-colors text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))]"
                    activeClass="text-[hsl(var(--primary-foreground))] font-bold"
                  >
                  Teams
                  </A>
                  <A
                    href="/players"
                    class="text-sm font-semibold transition-colors text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))]"
                    activeClass="text-[hsl(var(--primary-foreground))] font-bold"
                  >
                  Players
                  </A>
                  <A
                    href="/matches"
                    class="text-sm font-semibold transition-colors text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))]"
                    activeClass="text-[hsl(var(--primary-foreground))] font-bold"
                  >
                  Matches
                  </A>
                  <A
                    href="/stats"
                    class="text-sm font-semibold transition-colors text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))]"
                    activeClass="text-[hsl(var(--primary-foreground))] font-bold"
                  >
                  Tables
                  </A>
                  <A
                    href="/data-completeness"
                    class="text-sm font-semibold transition-colors text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))]"
                    activeClass="text-[hsl(var(--primary-foreground))] font-bold"
                  >
                  Data Quality
                  </A>
                </div>
              </div>

              <div class="flex items-center w-40 justify-end space-x-2">
                {/* Theme switcher button */}
                <div class="hidden md:block">
                  <ThemeSwitcher />
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={toggleMobileMenu}
                  class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-[hsl(var(--primary-foreground)/0.8)] hover:text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/0.1)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[hsl(var(--primary-foreground)/0.2)]"
                  aria-expanded={isMobileMenuOpen()}
                >
                  <span class="sr-only">Open main menu</span>
                  {isMobileMenuOpen()
                    ? (
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )
                    : (
                      <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    )}
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen() && (
              <div class="md:hidden bg-[hsl(var(--primary))]">
                <div class="px-2 pt-2 pb-3 space-y-1 border-t border-[hsl(var(--primary-foreground)/0.2)]">
                  <A
                    href="/teams"
                    class="block px-3 py-2 rounded-md text-base font-semibold text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/0.1)]"
                    activeClass="text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground)/0.2)] font-bold"
                    onClick={closeMobileMenu}
                  >
                  Teams
                  </A>
                  <A
                    href="/players"
                    class="block px-3 py-2 rounded-md text-base font-semibold text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/0.1)]"
                    activeClass="text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground)/0.2)] font-bold"
                    onClick={closeMobileMenu}
                  >
                  Players
                  </A>
                  <A
                    href="/matches"
                    class="block px-3 py-2 rounded-md text-base font-semibold text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/0.1)]"
                    activeClass="text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground)/0.2)] font-bold"
                    onClick={closeMobileMenu}
                  >
                  Matches
                  </A>
                  <A
                    href="/stats"
                    class="block px-3 py-2 rounded-md text-base font-semibold text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/0.1)]"
                    activeClass="text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground)/0.2)] font-bold"
                    onClick={closeMobileMenu}
                  >
                  Tables
                  </A>
                  <A
                    href="/data-completeness"
                    class="block px-3 py-2 rounded-md text-base font-semibold text-[hsl(var(--primary-foreground)/0.9)] hover:text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-foreground)/0.1)]"
                    activeClass="text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary-foreground)/0.2)] font-bold"
                    onClick={closeMobileMenu}
                  >
                  Data Quality
                  </A>

                  {/* Mobile theme switcher */}
                  <div class="px-3 py-2">
                    <div class="flex items-center justify-between">
                      <span class="text-base font-semibold text-[hsl(var(--primary-foreground)/0.9)]">Theme</span>
                      <ThemeSwitcher />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>
        <main class="container mx-auto px-4 py-8 bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
          <ErrorBoundary>
            {props.children}
          </ErrorBoundary>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default Layout
