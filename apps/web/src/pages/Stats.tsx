import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card, DataTable, StatsCard } from '@premstats/ui'

interface Season {
  id: number
  name: string
}

interface StandingsEntry {
  position: number
  team: string
  teamId: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface StandingsResponse {
  seasonId: number
  season: string
  table: StandingsEntry[]
}

interface SeasonSummary {
  season: string
  totalMatches: number
  totalGoals: number
  averageGoalsPerMatch: number
  champion: string
  relegated: string[]
}

const StatsPage: Component = () => {
  const [selectedSeason, setSelectedSeason] = createSignal<number>(3) // Default to 1993/94

  const seasonsQuery = createQuery(() => ({
    queryKey: ['seasons'],
    queryFn: async (): Promise<{ seasons: Season[] }> => {
      const response = await fetch('http://localhost:8081/api/v1/seasons')
      if (!response.ok) {
        throw new Error('Failed to fetch seasons')
      }
      return response.json()
    }
  }))

  const standingsQuery = createQuery(() => ({
    queryKey: ['standings', selectedSeason()],
    queryFn: async (): Promise<StandingsResponse> => {
      const response = await fetch(`http://localhost:8081/api/v1/standings?season=${selectedSeason()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch standings')
      }
      const data = await response.json()
      return data.data
    }
  }))

  const seasonSummaryQuery = createQuery(() => ({
    queryKey: ['season-summary', selectedSeason()],
    queryFn: async (): Promise<SeasonSummary> => {
      const response = await fetch(`http://localhost:8081/api/v1/seasons/${selectedSeason()}/summary`)
      if (!response.ok) {
        throw new Error('Failed to fetch season summary')
      }
      const data = await response.json()
      return data.data
    }
  }))

  const standingsColumns = [
    { header: 'Pos', key: 'position', align: 'center' as const, accessor: (item: StandingsEntry) => item.position },
    { header: 'Team', key: 'team', align: 'left' as const, accessor: (item: StandingsEntry) => item.team },
    { header: 'P', key: 'played', align: 'center' as const, accessor: (item: StandingsEntry) => item.played },
    { header: 'W', key: 'won', align: 'center' as const, accessor: (item: StandingsEntry) => item.won },
    { header: 'D', key: 'drawn', align: 'center' as const, accessor: (item: StandingsEntry) => item.drawn },
    { header: 'L', key: 'lost', align: 'center' as const, accessor: (item: StandingsEntry) => item.lost },
    { header: 'GF', key: 'goalsFor', align: 'center' as const, accessor: (item: StandingsEntry) => item.goalsFor },
    { header: 'GA', key: 'goalsAgainst', align: 'center' as const, accessor: (item: StandingsEntry) => item.goalsAgainst },
    { header: 'GD', key: 'goalDifference', align: 'center' as const, accessor: (item: StandingsEntry) => item.goalDifference },
    { header: 'Pts', key: 'points', align: 'center' as const, accessor: (item: StandingsEntry) => item.points }
  ]



  return (
    <Container>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Statistics</h1>
        </div>

        {/* Season Selector */}
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium">Season:</label>
          <select 
            class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedSeason()}
            onChange={(e) => setSelectedSeason(parseInt(e.currentTarget.value))}
          >
            <For each={seasonsQuery.data?.seasons || []}>
              {(season) => (
                <option value={season.id}>{season.name}</option>
              )}
            </For>
          </select>
        </div>

        {/* Season Summary Stats */}
        {seasonSummaryQuery.data && (
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard 
              label="Total Matches" 
              value={seasonSummaryQuery.data.totalMatches.toString()}
              variant="default"
            />
            <StatsCard 
              label="Total Goals" 
              value={seasonSummaryQuery.data.totalGoals.toString()}
              variant="success"
            />
            <StatsCard 
              label="Avg Goals/Match" 
              value={seasonSummaryQuery.data.averageGoalsPerMatch.toFixed(1)}
              variant="default"
            />
            <StatsCard 
              label="Champion" 
              value={seasonSummaryQuery.data.champion}
              variant="success"
            />
          </div>
        )}

        {/* League Table */}
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">League Table</h2>
          
          {/* Legend */}
          <div class="flex flex-wrap gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Champions League</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span>Europa League</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Relegation</span>
            </div>
          </div>

          {standingsQuery.data && (
            <DataTable
              data={standingsQuery.data.table}
              columns={standingsColumns}
              sortable={false}
              variant="striped"
            />
          )}
        </div>

        {/* Relegated Teams */}
        {seasonSummaryQuery.data?.relegated && seasonSummaryQuery.data.relegated.length > 0 && (
          <Card>
            <div class="p-4">
              <h3 class="font-semibold mb-2">Relegated Teams</h3>
              <div class="flex flex-wrap gap-2">
                <For each={seasonSummaryQuery.data.relegated}>
                  {(team) => (
                    <span class="px-2 py-1 bg-red-100 text-red-800 text-sm rounded">{team}</span>
                  )}
                </For>
              </div>
            </div>
          </Card>
        )}

        {/* Loading States */}
        {(standingsQuery.isLoading || seasonSummaryQuery.isLoading) && (
          <div class="text-center py-8">
            <p class="text-muted-foreground">Loading statistics...</p>
          </div>
        )}

        {(standingsQuery.isError || seasonSummaryQuery.isError) && (
          <div class="text-center py-8">
            <p class="text-destructive">Failed to load statistics. Please try again.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export default StatsPage