import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'

interface Team {
  id: number
  name: string
  shortName: string
  stadium: string
}

const TeamsPage: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal('')

  const teamsQuery = createQuery(() => ({
    queryKey: ['teams'],
    queryFn: async (): Promise<{ teams: Team[] }> => {
      const response = await fetch('/api/v1/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      return response.json()
    }
  }))

  const filteredTeams = () => {
    const teams = teamsQuery.data?.teams || []
    const term = searchTerm().toLowerCase()
    return teams.filter(team => 
      team.name.toLowerCase().includes(term) ||
      team.shortName.toLowerCase().includes(term)
    )
  }

  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold tracking-tight">Premier League Teams</h1>
      </div>

      {/* Search */}
      <div class="max-w-md">
        <input
          type="text"
          placeholder="Search teams..."
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={searchTerm()}
          onInput={(e) => setSearchTerm(e.currentTarget.value)}
        />
      </div>

      {/* Teams Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <For each={filteredTeams()}>
          {(team) => (
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
              <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                  {team.shortName}
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold">{team.name}</h3>
                  <p class="text-sm text-muted-foreground">{team.stadium}</p>
                </div>
              </div>
              <div class="mt-4 pt-4 border-t">
                <button class="text-sm text-primary hover:underline">
                  View Details →
                </button>
              </div>
            </div>
          )}
        </For>
      </div>

      {teamsQuery.isLoading && (
        <div class="text-center py-8">
          <p class="text-muted-foreground">Loading teams...</p>
        </div>
      )}

      {teamsQuery.isError && (
        <div class="text-center py-8">
          <p class="text-destructive">Failed to load teams. Please try again.</p>
        </div>
      )}
    </div>
  )
}

export default TeamsPage