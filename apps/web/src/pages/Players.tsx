import type { Component } from 'solid-js'
import { createSignal, For, onMount, onCleanup } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card, StatsCard, Input, DataTable } from '@premstats/ui'
import { getCurrentSeasonId } from '../utils/seasonStore'

interface TopScorer {
  rank: number
  playerId: number
  playerName: string
  teamId: number
  teamName: string
  goals: number
  assists: number
  appearances: number
  nationality?: string
  position?: string
}

interface Player {
  id: number
  name: string
  dateOfBirth?: string
  nationality?: string
  position?: string
}

const PlayersPage: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedPosition, setSelectedPosition] = createSignal<string>('')
  const [selectedNationality, setSelectedNationality] = createSignal<string>('')
  const selectedSeason = () => getCurrentSeasonId() || 33 // Default to 2024/25

  onMount(() => {
    console.log('Players component mounted')
  })

  onCleanup(() => {
    console.log('Players component unmounted')
  })

  // Fetch top scorers for the selected season
  const topScorersQuery = createQuery(() => ({
    queryKey: ['topScorers', selectedSeason()],
    queryFn: async (): Promise<{ topScorers: TopScorer[] }> => {
      const response = await fetch(`http://localhost:8081/api/v1/stats/top-scorers?season=${selectedSeason()}&limit=10`)
      if (!response.ok) {
        throw new Error('Failed to fetch top scorers')
      }
      const result = await response.json()
      return result.data
    }
  }))

  // Fetch all players
  const playersQuery = createQuery(() => ({
    queryKey: ['players', searchTerm(), selectedPosition(), selectedNationality()],
    queryFn: async (): Promise<{ players: Player[] }> => {
      const params = new URLSearchParams({
        limit: '100',
        search: searchTerm(),
        position: selectedPosition(),
        nationality: selectedNationality()
      })
      const response = await fetch(`http://localhost:8081/api/v1/players?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch players')
      }
      const result = await response.json()
      return result.data
    }
  }))

  // Fetch positions for filter
  const positionsQuery = createQuery(() => ({
    queryKey: ['positions'],
    queryFn: async (): Promise<{ positions: string[] }> => {
      const response = await fetch('http://localhost:8081/api/v1/players/positions')
      if (!response.ok) {
        throw new Error('Failed to fetch positions')
      }
      const result = await response.json()
      return result.data
    }
  }))

  // Fetch nationalities for filter
  const nationalitiesQuery = createQuery(() => ({
    queryKey: ['nationalities'],
    queryFn: async (): Promise<{ nationalities: string[] }> => {
      const response = await fetch('http://localhost:8081/api/v1/players/nationalities')
      if (!response.ok) {
        throw new Error('Failed to fetch nationalities')
      }
      const result = await response.json()
      return result.data
    }
  }))

  // Mock data for all-time stats (until we have historical data)
  const mockAllTimeScorers = [
    { name: "Alan Shearer", goals: 260, seasons: 14 },
    { name: "Harry Kane", goals: 213, seasons: 10 },
    { name: "Wayne Rooney", goals: 208, seasons: 13 },
    { name: "Andy Cole", goals: 187, seasons: 15 },
    { name: "Sergio Aguero", goals: 184, seasons: 10 },
    { name: "Frank Lampard", goals: 177, seasons: 13 },
    { name: "Thierry Henry", goals: 175, seasons: 8 },
    { name: "Robbie Fowler", goals: 163, seasons: 9 },
    { name: "Jermain Defoe", goals: 162, seasons: 16 },
    { name: "Michael Owen", goals: 150, seasons: 8 }
  ]

  const topScorersColumns = [
    { header: 'Rank', key: 'rank', align: 'center' as const, accessor: (item: TopScorer) => item.rank },
    { header: 'Player', key: 'playerName', align: 'left' as const, accessor: (item: TopScorer) => item.playerName },
    { header: 'Team', key: 'teamName', align: 'left' as const, accessor: (item: TopScorer) => item.teamName },
    { header: 'Goals', key: 'goals', align: 'center' as const, accessor: (item: TopScorer) => item.goals },
    { header: 'Assists', key: 'assists', align: 'center' as const, accessor: (item: TopScorer) => item.assists },
    { header: 'Apps', key: 'appearances', align: 'center' as const, accessor: (item: TopScorer) => item.appearances },
    { header: 'Position', key: 'position', align: 'center' as const, accessor: (item: TopScorer) => item.position || '-' }
  ]

  const playersColumns = [
    { header: 'Name', key: 'name', align: 'left' as const, accessor: (item: Player) => item.name },
    { header: 'Position', key: 'position', align: 'center' as const, accessor: (item: Player) => item.position || '-' },
    { header: 'Nationality', key: 'nationality', align: 'center' as const, accessor: (item: Player) => item.nationality || '-' }
  ]

  const allTimeColumns = [
    { header: 'Player', key: 'name', align: 'left' as const, accessor: (item: any) => item.name },
    { header: 'Goals', key: 'goals', align: 'center' as const, accessor: (item: any) => item.goals },
    { header: 'Seasons', key: 'seasons', align: 'center' as const, accessor: (item: any) => item.seasons }
  ]

  return (
    <Container class="max-w-5xl">
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Players</h1>
        </div>

        {/* Quick Stats - Show current season top scorer */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            label="Current Top Scorer"
            value={topScorersQuery.data?.topScorers?.[0]?.playerName || "Loading..."}
            description={topScorersQuery.data?.topScorers?.[0] ? `${topScorersQuery.data.topScorers[0].goals} goals` : ""}
            variant="success"
          />
          <StatsCard
            label="Most Assists"
            value={topScorersQuery.data?.topScorers?.reduce((max, p) => p.assists > (max?.assists || 0) ? p : max, topScorersQuery.data.topScorers[0])?.playerName || "Loading..."}
            description={topScorersQuery.data?.topScorers?.reduce((max, p) => p.assists > (max?.assists || 0) ? p : max, topScorersQuery.data.topScorers[0])?.assists ? `${topScorersQuery.data.topScorers.reduce((max, p) => p.assists > (max?.assists || 0) ? p : max, topScorersQuery.data.topScorers[0]).assists} assists` : ""}
            variant="default"
          />
          <StatsCard
            label="All-Time Top Scorer"
            value="Alan Shearer"
            description="260 goals"
            variant="default"
          />
          <StatsCard
            label="Total Players"
            value={playersQuery.data?.players?.length?.toString() || "0"}
            description="In database"
            variant="default"
          />
        </div>

        {/* Current Season Top Scorers */}
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Top Scorers - 2024/25 Season</h2>
          <Card>
            <div class="p-4">
              {topScorersQuery.isLoading ? (
                <p class="text-center py-4 text-muted-foreground">Loading top scorers...</p>
              ) : topScorersQuery.data?.topScorers ? (
                <DataTable
                  data={topScorersQuery.data.topScorers}
                  columns={topScorersColumns}
                  sortable={true}
                  variant="striped"
                />
              ) : (
                <p class="text-center py-4 text-muted-foreground">No scorer data available</p>
              )}
            </div>
          </Card>
        </div>

        {/* All Players */}
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">All Players</h2>
          
          {/* Filters */}
          <div class="flex flex-wrap gap-4 items-center">
            <div class="flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Search players..."
                value={searchTerm()}
                onInput={(e: Event) => setSearchTerm((e.currentTarget as HTMLInputElement).value)}
              />
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium">Position:</label>
              <select 
                class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedPosition()}
                onChange={(e) => setSelectedPosition(e.currentTarget.value)}
              >
                <option value="">All Positions</option>
                <For each={positionsQuery.data?.positions || []}>
                  {(position) => (
                    <option value={position}>{position}</option>
                  )}
                </For>
              </select>
            </div>
            <div class="flex items-center space-x-2">
              <label class="text-sm font-medium">Nationality:</label>
              <select 
                class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedNationality()}
                onChange={(e) => setSelectedNationality(e.currentTarget.value)}
              >
                <option value="">All Nationalities</option>
                <For each={nationalitiesQuery.data?.nationalities || []}>
                  {(nationality) => (
                    <option value={nationality}>{nationality}</option>
                  )}
                </For>
              </select>
            </div>
          </div>

          <Card>
            <div class="p-4">
              {playersQuery.isLoading ? (
                <p class="text-center py-4 text-muted-foreground">Loading players...</p>
              ) : playersQuery.data?.players ? (
                <DataTable
                  data={playersQuery.data.players}
                  columns={playersColumns}
                  sortable={true}
                  variant="striped"
                />
              ) : (
                <p class="text-center py-4 text-muted-foreground">No players found</p>
              )}
            </div>
          </Card>
        </div>

        {/* All-Time Leading Scorers */}
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">All-Time Leading Scorers</h2>
          <Card>
            <div class="p-4">
              <DataTable
                data={mockAllTimeScorers}
                columns={allTimeColumns}
                sortable={true}
                variant="striped"
              />
            </div>
          </Card>
        </div>

        {/* Note */}
        <Card>
          <div class="p-4 bg-blue-50 border-blue-200">
            <p class="text-sm text-blue-800">
              <strong>Note:</strong> Currently showing 2024/25 season top scorers with {topScorersQuery.data?.topScorers?.length || 0} players. 
              All-time records are historical estimates. Individual match-level goal data is being imported progressively.
            </p>
          </div>
        </Card>

      </div>
    </Container>
  )
}

export default PlayersPage