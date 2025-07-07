import type { Component } from 'solid-js'
import { createSignal, For, onMount, onCleanup } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card, StatsCard, Input, DataTable } from '@premstats/ui'

interface Team {
  id: number
  name: string
  shortName: string
}

interface TopScorer {
  player: string
  team: string
  goals: number
  season: string
}

interface PlayerStats {
  name: string
  team: string
  position: string
  goals: number
  assists: number
  appearances: number
  yellowCards: number
  redCards: number
}

const PlayersPage: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedTeam, setSelectedTeam] = createSignal<number | null>(null)

  onMount(() => {
    console.log('Players component mounted')
  })

  onCleanup(() => {
    console.log('Players component unmounted')
  })

  const teamsQuery = createQuery(() => ({
    queryKey: ['teams'],
    queryFn: async (): Promise<{ teams: Team[] }> => {
      const response = await fetch('http://localhost:8081/api/v1/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const result = await response.json()
      return result.data // Extract the data property from the API response
    }
  }))

  // Mock data for demonstration since we don't have player endpoints yet
  const mockTopScorers: TopScorer[] = [
    { player: "Alan Shearer", team: "Blackburn Rovers", goals: 34, season: "1994/95" },
    { player: "Andy Cole", team: "Newcastle United", goals: 34, season: "1993/94" },
    { player: "Thierry Henry", team: "Arsenal", goals: 30, season: "2003/04" },
    { player: "Mohamed Salah", team: "Liverpool", goals: 32, season: "2017/18" },
    { player: "Harry Kane", team: "Tottenham", goals: 30, season: "2017/18" },
    { player: "Sergio Aguero", team: "Manchester City", goals: 26, season: "2014/15" },
    { player: "Sadio Mane", team: "Liverpool", goals: 22, season: "2018/19" },
    { player: "Jamie Vardy", team: "Leicester City", goals: 24, season: "2015/16" },
    { player: "Raheem Sterling", team: "Manchester City", goals: 23, season: "2019/20" },
    { player: "Bruno Fernandes", team: "Manchester United", goals: 18, season: "2020/21" }
  ]

  const mockPlayerStats: PlayerStats[] = [
    { name: "Alan Shearer", team: "Newcastle United", position: "Forward", goals: 206, assists: 64, appearances: 303, yellowCards: 58, redCards: 4 },
    { name: "Wayne Rooney", team: "Manchester United", position: "Forward", goals: 208, assists: 103, appearances: 491, yellowCards: 97, redCards: 6 },
    { name: "Andy Cole", team: "Manchester United", position: "Forward", goals: 187, assists: 73, appearances: 414, yellowCards: 45, redCards: 2 },
    { name: "Sergio Aguero", team: "Manchester City", position: "Forward", goals: 184, assists: 47, appearances: 275, yellowCards: 24, redCards: 1 },
    { name: "Frank Lampard", team: "Chelsea", position: "Midfielder", goals: 177, assists: 102, appearances: 609, yellowCards: 81, redCards: 5 },
    { name: "Thierry Henry", team: "Arsenal", position: "Forward", goals: 175, assists: 74, appearances: 258, yellowCards: 21, redCards: 1 },
    { name: "Robbie Fowler", team: "Liverpool", position: "Forward", goals: 163, assists: 46, appearances: 379, yellowCards: 42, redCards: 2 },
    { name: "Jermain Defoe", team: "Tottenham", position: "Forward", goals: 162, assists: 34, appearances: 496, yellowCards: 36, redCards: 1 },
    { name: "Michael Owen", team: "Liverpool", position: "Forward", goals: 150, assists: 35, appearances: 326, yellowCards: 18, redCards: 0 },
    { name: "Les Ferdinand", team: "Newcastle United", position: "Forward", goals: 149, assists: 42, appearances: 351, yellowCards: 31, redCards: 1 }
  ]

  const filteredPlayers = () => {
    let players = mockPlayerStats
    const term = searchTerm().toLowerCase()
    
    if (term) {
      players = players.filter(player => 
        player.name.toLowerCase().includes(term) ||
        player.team.toLowerCase().includes(term) ||
        player.position.toLowerCase().includes(term)
      )
    }
    
    if (selectedTeam()) {
      const selectedTeamName = teamsQuery.data?.teams.find(t => t.id === selectedTeam())?.name
      if (selectedTeamName) {
        players = players.filter(player => 
          player.team.toLowerCase().includes(selectedTeamName.toLowerCase())
        )
      }
    }
    
    return players
  }

  const topScorersColumns = [
    { header: 'Player', key: 'player', align: 'left' as const, accessor: (item: TopScorer) => item.player },
    { header: 'Team', key: 'team', align: 'left' as const, accessor: (item: TopScorer) => item.team },
    { header: 'Goals', key: 'goals', align: 'center' as const, accessor: (item: TopScorer) => item.goals },
    { header: 'Season', key: 'season', align: 'center' as const, accessor: (item: TopScorer) => item.season }
  ]

  const allTimeColumns = [
    { header: 'Player', key: 'name', align: 'left' as const, accessor: (item: PlayerStats) => item.name },
    { header: 'Team', key: 'team', align: 'left' as const, accessor: (item: PlayerStats) => item.team },
    { header: 'Position', key: 'position', align: 'center' as const, accessor: (item: PlayerStats) => item.position },
    { header: 'Goals', key: 'goals', align: 'center' as const, accessor: (item: PlayerStats) => item.goals },
    { header: 'Assists', key: 'assists', align: 'center' as const, accessor: (item: PlayerStats) => item.assists },
    { header: 'Apps', key: 'appearances', align: 'center' as const, accessor: (item: PlayerStats) => item.appearances },
    { header: 'YC', key: 'yellowCards', align: 'center' as const, accessor: (item: PlayerStats) => item.yellowCards },
    { header: 'RC', key: 'redCards', align: 'center' as const, accessor: (item: PlayerStats) => item.redCards }
  ]

  return (
    <Container class="max-w-5xl">
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Players</h1>
        </div>

        {/* Quick Stats */}
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            label="All-Time Top Scorer"
            value="Alan Shearer"
            description="206 goals"
            variant="success"
          />
          <StatsCard
            label="Most Appearances"
            value="Gareth Barry"
            description="653 games"
            variant="default"
          />
          <StatsCard
            label="Most Assists"
            value="Ryan Giggs"
            description="162 assists"
            variant="default"
          />
          <StatsCard
            label="Most Clean Sheets"
            value="Petr Cech"
            description="202 clean sheets"
            variant="success"
          />
        </div>

        {/* Top Scorers by Season */}
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Top Scorers by Season</h2>
          <Card>
            <div class="p-4">
              <DataTable
                data={mockTopScorers}
                columns={topScorersColumns}
                sortable={true}
                variant="striped"
              />
            </div>
          </Card>
        </div>

        {/* All-Time Statistics */}
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">All-Time Leading Scorers</h2>
          
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
              <label class="text-sm font-medium">Team:</label>
              <select 
                class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedTeam() || ''}
                onChange={(e) => setSelectedTeam(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
              >
                <option value="">All Teams</option>
                <For each={teamsQuery.data?.teams ? [...teamsQuery.data.teams].sort((a, b) => a.name.localeCompare(b.name)) : []}>
                  {(team) => (
                    <option value={team.id}>{team.name}</option>
                  )}
                </For>
              </select>
            </div>
          </div>

          <Card>
            <div class="p-4">
              <DataTable
                data={filteredPlayers()}
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
              <strong>Note:</strong> Player statistics shown are historical data for demonstration purposes. 
              Individual player tracking and goal scorer data will be added as the database is expanded with more detailed match events.
            </p>
          </div>
        </Card>

        {/* Loading States */}
        {teamsQuery.isLoading && (
          <div class="text-center py-8">
            <p class="text-muted-foreground">Loading player data...</p>
          </div>
        )}

        {teamsQuery.isError && (
          <div class="text-center py-8">
            <p class="text-destructive">Failed to load player data. Please try again.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export default PlayersPage