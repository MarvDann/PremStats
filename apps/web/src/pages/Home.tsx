import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import { Container, Card, StatsCard, Input, Button } from '@premstats/ui'

const HomePage: Component = () => {
  const [query, setQuery] = createSignal('')

  const handleSearch = () => {
    console.log('Searching for:', query())
    // TODO: Implement search functionality
  }

  return (
    <Container>
      <div class="space-y-8">
        {/* Hero Section */}
        <div class="text-center space-y-4">
          <h1 class="text-4xl font-bold tracking-tight lg:text-6xl">
            Premier League Statistics
          </h1>
          <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive football data from 1992 to present. Explore teams, players, matches, and statistics.
          </p>
        </div>

        {/* Search Section */}
        <div class="max-w-2xl mx-auto space-y-4">
          <div class="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Ask anything... e.g., 'Who scored the most goals in 2023?'"
              value={query()}
              onInput={(e: Event) => setQuery((e.currentTarget as HTMLInputElement).value)}
              onKeyPress={(e: KeyboardEvent) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>
          <div class="text-center">
            <p class="text-sm text-muted-foreground">
              Try: "Who is Arsenal's top scorer?" or "Manchester United vs Liverpool 1999"
            </p>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            label="Total Matches"
            value="8,106+"
            description="Since 1992"
            variant="default"
          />
          <StatsCard
            label="Total Goals"
            value="21,000+"
            description="All competitions"
            variant="success"
          />
          <StatsCard
            label="Current Season"
            value="2023/24"
            description="In progress"
            variant="default"
          />
        </div>

        {/* Featured Section */}
        <div class="space-y-6">
          <h2 class="text-3xl font-bold tracking-tight">Quick Access</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <a
                href="/teams"
                class="block p-6 group hover:bg-muted/50 transition-colors"
              >
                <h3 class="font-semibold group-hover:text-primary">Teams</h3>
                <p class="text-sm text-muted-foreground">Explore all Premier League teams</p>
              </a>
            </Card>
            
            <Card>
              <a
                href="/players"
                class="block p-6 group hover:bg-muted/50 transition-colors"
              >
                <h3 class="font-semibold group-hover:text-primary">Players</h3>
                <p class="text-sm text-muted-foreground">Player statistics and records</p>
              </a>
            </Card>
            
            <Card>
              <a
                href="/matches"
                class="block p-6 group hover:bg-muted/50 transition-colors"
              >
                <h3 class="font-semibold group-hover:text-primary">Matches</h3>
                <p class="text-sm text-muted-foreground">Historical match results</p>
              </a>
            </Card>
            
            <Card>
              <a
                href="/stats"
                class="block p-6 group hover:bg-muted/50 transition-colors"
              >
                <h3 class="font-semibold group-hover:text-primary">Statistics</h3>
                <p class="text-sm text-muted-foreground">Advanced analytics and insights</p>
              </a>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default HomePage