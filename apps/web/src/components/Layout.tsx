import type { Component, ParentComponent } from 'solid-js'
import { A } from '@solidjs/router'

const Layout: ParentComponent = (props) => {
  return (
    <div class="min-h-screen bg-background">
      <nav class="border-b">
        <div class="container mx-auto px-4">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center space-x-4">
              <A href="/" class="text-xl font-bold text-primary">
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
              <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Search
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main class="container mx-auto px-4 py-8">
        {props.children}
      </main>
    </div>
  )
}

export default Layout