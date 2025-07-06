import type { ParentComponent } from 'solid-js'
import { createSignal } from 'solid-js'
import { A } from '@solidjs/router'
import { Button } from '@premstats/ui'

const Layout: ParentComponent = (props) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = createSignal(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen())
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div class="min-h-screen bg-background">
      <nav class="border-b">
        <div class="container mx-auto px-4">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center space-x-4">
              <A href="/" class="text-xl font-bold text-primary" onClick={closeMobileMenu}>
                ⚽ PremStats
              </A>
              <div class="hidden md:flex items-center space-x-4">
                <A
                  href="/teams"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  activeClass="text-primary"
                >
                  Teams
                </A>
                <A
                  href="/players"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  activeClass="text-primary"
                >
                  Players
                </A>
                <A
                  href="/matches"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  activeClass="text-primary"
                >
                  Matches
                </A>
                <A
                  href="/stats"
                  class="text-sm font-medium transition-colors hover:text-primary"
                  activeClass="text-primary"
                >
                  Statistics
                </A>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <Button variant="outline" size="sm" class="hidden sm:inline-flex">
                Search
              </Button>
              
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-expanded={isMobileMenuOpen()}
              >
                <span class="sr-only">Open main menu</span>
                {isMobileMenuOpen() ? (
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen() && (
            <div class="md:hidden">
              <div class="px-2 pt-2 pb-3 space-y-1 border-t">
                <A
                  href="/teams"
                  class="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  activeClass="text-primary bg-muted"
                  onClick={closeMobileMenu}
                >
                  Teams
                </A>
                <A
                  href="/players"
                  class="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  activeClass="text-primary bg-muted"
                  onClick={closeMobileMenu}
                >
                  Players
                </A>
                <A
                  href="/matches"
                  class="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  activeClass="text-primary bg-muted"
                  onClick={closeMobileMenu}
                >
                  Matches
                </A>
                <A
                  href="/stats"
                  class="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                  activeClass="text-primary bg-muted"
                  onClick={closeMobileMenu}
                >
                  Statistics
                </A>
                <div class="px-3 py-2">
                  <Button variant="outline" size="sm" class="w-full">
                    Search
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main class="container mx-auto px-4 py-8">
        {props.children}
      </main>
    </div>
  )
}

export default Layout