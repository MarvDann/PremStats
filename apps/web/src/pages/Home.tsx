import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'

const HomePage: Component = () => {
  const [query, setQuery] = createSignal('')

  const handleSearch = () => {
    console.log('Searching for:', query())
    // TODO: Implement search functionality
  }

  return (
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
          <input
            type="text"
            placeholder="Ask anything... e.g., 'Who scored the most goals in 2023?'"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Search
          </button>
        </div>
        <div class="text-center">
          <p class="text-sm text-muted-foreground">
            Try: "Who is Arsenal's top scorer?" or "Manchester United vs Liverpool 1999"
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-sm font-medium">Total Matches</h3>
          </div>
          <div class="text-2xl font-bold">12,847</div>
          <p class="text-xs text-muted-foreground">Since 1992</p>
        </div>
        
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-sm font-medium">Total Goals</h3>
          </div>
          <div class="text-2xl font-bold">34,892</div>
          <p class="text-xs text-muted-foreground">All competitions</p>
        </div>
        
        <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 class="tracking-tight text-sm font-medium">Current Season</h3>
          </div>
          <div class="text-2xl font-bold">2023/24</div>
          <p class="text-xs text-muted-foreground">In progress</p>
        </div>
      </div>

      {/* Featured Section */}
      <div class="space-y-6">
        <h2 class="text-3xl font-bold tracking-tight">Quick Access</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/teams"
            class="group rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 class="font-semibold group-hover:text-primary">Teams</h3>
            <p class="text-sm text-muted-foreground">Explore all Premier League teams</p>
          </a>
          
          <a
            href="/players"
            class="group rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 class="font-semibold group-hover:text-primary">Players</h3>
            <p class="text-sm text-muted-foreground">Player statistics and records</p>
          </a>
          
          <a
            href="/matches"
            class="group rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 class="font-semibold group-hover:text-primary">Matches</h3>
            <p class="text-sm text-muted-foreground">Historical match results</p>
          </a>
          
          <a
            href="/stats"
            class="group rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h3 class="font-semibold group-hover:text-primary">Statistics</h3>
            <p class="text-sm text-muted-foreground">Advanced analytics and insights</p>
          </a>
        </div>
      </div>
    </div>
  )
}

export default HomePage