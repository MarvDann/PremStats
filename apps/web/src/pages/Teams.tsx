import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { A } from '@solidjs/router'
import { Input, TeamCard, Container } from '@premstats/ui'

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
      const response = await fetch('http://localhost:8081/api/v1/teams')
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
    <Container>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Teams</h1>
        </div>

        {/* Search */}
        <div class="max-w-md">
          <Input
            type="text"
            placeholder="Search teams..."
            value={searchTerm()}
            onInput={(e: Event) => setSearchTerm((e.currentTarget as HTMLInputElement).value)}
          />
        </div>

        {/* Teams Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredTeams()}>
            {(team) => (
              <A href={`/teams/${team.id}`}>
                <TeamCard
                  name={team.name}
                  stadium={team.stadium}
                  onClick={() => {}}
                />
              </A>
            )}
          </For>
        </div>
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
    </Container>
  )
}

export default TeamsPage