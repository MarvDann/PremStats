import type { ParentComponent } from 'solid-js'
import { createSignal } from 'solid-js'
import { A, useLocation } from '@solidjs/router'
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
      <nav class="border-b bg-gradient-to-r from-primary to-purple-600 shadow-lg">
        <div class="container mx-auto px-4">
          <div class="flex h-16 items-center">
            <div class="flex items-center w-40">
              <A href="/" class="text-xl font-bold text-white drop-shadow-sm whitespace-nowrap" onClick={closeMobileMenu}>
                ⚽ PremStats
              </A>
            </div>
            
            <div class="flex-1 flex justify-center">
              <div class="hidden md:flex items-center space-x-6">
                <A
                  href="/teams"
                  class="text-sm font-semibold transition-colors text-white/90 hover:text-white"
                  activeClass="text-white font-bold"
                >
                  Teams
                </A>
                <A
                  href="/players"
                  class="text-sm font-semibold transition-colors text-white/90 hover:text-white"
                  activeClass="text-white font-bold"
                >
                  Players
                </A>
                <A
                  href="/matches"
                  class="text-sm font-semibold transition-colors text-white/90 hover:text-white"
                  activeClass="text-white font-bold"
                >
                  Matches
                </A>
                <A
                  href="/stats"
                  class="text-sm font-semibold transition-colors text-white/90 hover:text-white"
                  activeClass="text-white font-bold"
                >
                  Tables
                </A>
              </div>
            </div>
            
            <div class="flex items-center w-40 justify-end">
              {/* Mobile menu button */}
              <button
                onClick={toggleMobileMenu}
                class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/20"
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
            <div class="md:hidden bg-gradient-to-b from-primary to-purple-600">
              <div class="px-2 pt-2 pb-3 space-y-1 border-t border-white/20">
                <A
                  href="/teams"
                  class="block px-3 py-2 rounded-md text-base font-semibold text-white/90 hover:text-white hover:bg-white/10"
                  activeClass="text-white bg-white/20 font-bold"
                  onClick={closeMobileMenu}
                >
                  Teams
                </A>
                <A
                  href="/players"
                  class="block px-3 py-2 rounded-md text-base font-semibold text-white/90 hover:text-white hover:bg-white/10"
                  activeClass="text-white bg-white/20 font-bold"
                  onClick={closeMobileMenu}
                >
                  Players
                </A>
                <A
                  href="/matches"
                  class="block px-3 py-2 rounded-md text-base font-semibold text-white/90 hover:text-white hover:bg-white/10"
                  activeClass="text-white bg-white/20 font-bold"
                  onClick={closeMobileMenu}
                >
                  Matches
                </A>
                <A
                  href="/stats"
                  class="block px-3 py-2 rounded-md text-base font-semibold text-white/90 hover:text-white hover:bg-white/10"
                  activeClass="text-white bg-white/20 font-bold"
                  onClick={closeMobileMenu}
                >
                  Tables
                </A>
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