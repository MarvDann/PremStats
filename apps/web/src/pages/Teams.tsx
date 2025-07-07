import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { A } from '@solidjs/router'
import { Input, TeamCard, Container } from '@premstats/ui'
import { getTeamCrest } from '../utils/teamCrests'

interface Team {
  id: number
  name: string
  shortName: string
  stadium: string
}

interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string
}

const TeamsPage: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal('')
  const [activeTab, setActiveTab] = createSignal<'current' | 'historical'>('current')

  // Current Premier League teams (2024/25 season)
  const currentPLTeams = [
    'Liverpool', 'Arsenal', 'Manchester City', 'Chelsea', 'Newcastle United',
    'Aston Villa', 'Nottingham Forest', 'Brighton & Hove Albion', 'Bournemouth',
    'Brentford', 'Fulham', 'Crystal Palace', 'Everton', 'West Ham United',
    'Manchester United', 'Wolverhampton Wanderers', 'Tottenham', 'Leicester City',
    'Ipswich Town', 'Southampton'
  ]

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

  // Fetch recent matches for form guide (current season = 33)
  const recentMatchesQuery = createQuery(() => ({
    queryKey: ['recent-matches'],
    queryFn: async (): Promise<{ matches: Match[] }> => {
      const response = await fetch('http://localhost:8081/api/v1/matches?season=33&limit=500')
      if (!response.ok) {
        throw new Error('Failed to fetch recent matches')
      }
      const result = await response.json()
      return result.data
    }
  }))

  // Calculate form guide for a team (last 6 matches)
  const getFormGuide = (teamName: string): string[] => {
    const matches = recentMatchesQuery.data?.matches || []
    
    // Filter matches for this team
    const teamMatches = matches
      .filter(match => match.homeTeam === teamName || match.awayTeam === teamName)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Oldest first
      .slice(-6) // Last 6 matches
    
    return teamMatches.map(match => {
      const isHome = match.homeTeam === teamName
      const teamScore = isHome ? match.homeScore : match.awayScore
      const opponentScore = isHome ? match.awayScore : match.homeScore
      
      if (teamScore > opponentScore) return 'W'
      if (teamScore < opponentScore) return 'L'
      return 'D'
    })
  }

  const filteredTeams = () => {
    const teams = teamsQuery.data?.teams || []
    const term = searchTerm().toLowerCase()
    
    // Filter by tab selection
    const tabFilteredTeams = teams.filter(team => {
      const isCurrentPL = currentPLTeams.includes(team.name)
      return activeTab() === 'current' ? isCurrentPL : !isCurrentPL
    })
    
    // Filter by search term
    return tabFilteredTeams.filter(team => 
      team.name.toLowerCase().includes(term) ||
      team.shortName.toLowerCase().includes(term)
    )
  }

  const getCurrentTeamsCount = () => {
    const teams = teamsQuery.data?.teams || []
    return teams.filter(team => currentPLTeams.includes(team.name)).length
  }

  const getHistoricalTeamsCount = () => {
    const teams = teamsQuery.data?.teams || []
    return teams.filter(team => !currentPLTeams.includes(team.name)).length
  }

  return (
    <Container class="max-w-5xl">
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Teams</h1>
        </div>

        {/* Tabs */}
        <div class="border-b border-border">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab() === 'current'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              onClick={() => setActiveTab('current')}
            >
              Current Teams ({getCurrentTeamsCount()})
            </button>
            <button
              class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab() === 'historical'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              onClick={() => setActiveTab('historical')}
            >
              Historical Teams ({getHistoricalTeamsCount()})
            </button>
          </nav>
        </div>

        {/* Tab Description and Search */}
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div class="text-sm text-muted-foreground">
            {activeTab() === 'current' 
              ? "Teams currently competing in the 2024/25 Premier League season" 
              : "Teams that have previously played in the Premier League but are not currently in the top division"
            }
          </div>
          <div class="max-w-md md:max-w-sm">
            <Input
              type="text"
              placeholder={`Search ${activeTab() === 'current' ? 'current' : 'historical'} teams...`}
              value={searchTerm()}
              onInput={(e: Event) => setSearchTerm((e.currentTarget as HTMLInputElement).value)}
            />
          </div>
        </div>

        {/* Teams Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <For each={filteredTeams()}>
            {(team) => (
              <A href={`/teams/${team.id}`}>
                <TeamCard
                  name={team.name}
                  stadium={team.stadium}
                  logo={getTeamCrest(team.name)}
                  formGuide={activeTab() === 'current' ? getFormGuide(team.name) : undefined}
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