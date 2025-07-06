import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card } from '@premstats/ui'

interface Match {
  id: number
  season_id: number
  home_team: string
  away_team: string
  home_score: number
  away_score: number
  match_date: string
  referee: string
}

interface Season {
  id: number
  name: string
}

const MatchesPage: Component = () => {
  const [selectedSeason, setSelectedSeason] = createSignal<number | null>(null)
  const [limit, setLimit] = createSignal(50)

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

  const matchesQuery = createQuery(() => ({
    queryKey: ['matches', selectedSeason(), limit()],
    queryFn: async (): Promise<{ matches: Match[] }> => {
      const seasonParam = selectedSeason() ? `&season=${selectedSeason()}` : ''
      const response = await fetch(`http://localhost:8081/api/v1/matches?limit=${limit()}${seasonParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      return response.json()
    }
  }))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getMatchResult = (homeScore: number, awayScore: number) => {
    if (homeScore > awayScore) return 'H'
    if (awayScore > homeScore) return 'A'
    return 'D'
  }

  return (
    <Container>
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Matches</h1>
        </div>

        {/* Filters */}
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium">Season:</label>
            <select 
              class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedSeason() || ''}
              onChange={(e) => setSelectedSeason(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
            >
              <option value="">All Seasons</option>
              <For each={seasonsQuery.data?.seasons || []}>
                {(season) => (
                  <option value={season.id}>{season.name}</option>
                )}
              </For>
            </select>
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium">Show:</label>
            <select 
              class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={limit()}
              onChange={(e) => setLimit(parseInt(e.currentTarget.value))}
            >
              <option value={25}>25 matches</option>
              <option value={50}>50 matches</option>
              <option value={100}>100 matches</option>
            </select>
          </div>
        </div>

        {/* Matches List */}
        <div class="space-y-4">
          <For each={matchesQuery.data?.matches || []}>
            {(match) => (
              <Card>
                <div class="p-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="text-sm text-muted-foreground min-w-[80px]">
                        {formatDate(match.match_date)}
                      </div>
                      <div class="flex items-center space-x-3">
                        <div class="text-right min-w-[120px] font-medium">
                          {match.home_team}
                        </div>
                        <div class="flex items-center space-x-2 min-w-[60px] justify-center">
                          <span class="font-bold text-lg">{match.home_score}</span>
                          <span class="text-muted-foreground">-</span>
                          <span class="font-bold text-lg">{match.away_score}</span>
                        </div>
                        <div class="text-left min-w-[120px] font-medium">
                          {match.away_team}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="text-xs text-muted-foreground">
                        {match.referee && `Ref: ${match.referee}`}
                      </div>
                      <div class={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        getMatchResult(match.home_score, match.away_score) === 'H' 
                          ? 'bg-green-100 text-green-800' 
                          : getMatchResult(match.home_score, match.away_score) === 'A'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {getMatchResult(match.home_score, match.away_score)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </For>
        </div>

        {matchesQuery.isLoading && (
          <div class="text-center py-8">
            <p class="text-muted-foreground">Loading matches...</p>
          </div>
        )}

        {matchesQuery.isError && (
          <div class="text-center py-8">
            <p class="text-destructive">Failed to load matches. Please try again.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export default MatchesPage