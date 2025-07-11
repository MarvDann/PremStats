import type { Component } from 'solid-js'
import { createSignal, For, onMount } from 'solid-js'
import { useParams } from '@solidjs/router'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card, StatsCard, Button } from '@premstats/ui'
import { getTeamCrest } from '../utils/teamCrests'
import { apiUrl } from '../config/api'

interface Team {
  id: number
  name: string
  shortName: string
  stadium: string
  founded: number
}

interface Season {
  id: number
  name: string
}

interface TeamSeasonStats {
  teamId: number
  team: string
  seasonId: number
  season: string
  matchesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  winPercentage: number
  pointsPerGame: number
}

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

const TeamDetail: Component = () => {
  const params = useParams()
  const teamId = () => parseInt(params.id)
  const [selectedSeason, setSelectedSeason] = createSignal<number | null>(null)

  // Set default season to current season (2024/25 = ID 33)
  onMount(() => {
    if (selectedSeason() === null) {
      setSelectedSeason(33) // Default to current season
    }
  })

  const teamQuery = createQuery(() => ({
    queryKey: ['team', teamId()],
    queryFn: async (): Promise<Team> => {
      const response = await fetch(apiUrl(`/teams/${teamId()}`))
      if (!response.ok) {
        throw new Error('Failed to fetch team')
      }
      const data = await response.json()
      return data.data
    }
  }))

  const seasonsQuery = createQuery(() => ({
    queryKey: ['seasons'],
    queryFn: async (): Promise<{ seasons: Season[] }> => {
      const response = await fetch(apiUrl('/seasons'))
      if (!response.ok) {
        throw new Error('Failed to fetch seasons')
      }
      const data = await response.json()
      // Sort seasons by name descending (most recent first)
      const sortedSeasons = data.data.seasons.sort((a: Season, b: Season) => 
        b.name.localeCompare(a.name)
      )
      return { seasons: sortedSeasons }
    }
  }))

  const teamSeasonStatsQuery = createQuery(() => ({
    queryKey: ['team-season-stats', teamId(), selectedSeason()],
    queryFn: async (): Promise<TeamSeasonStats> => {
      if (!selectedSeason()) {
        throw new Error('No season selected')
      }
      const response = await fetch(apiUrl(`/standings/team/${teamId()}/season/${selectedSeason()}`))
      if (!response.ok) {
        throw new Error('Failed to fetch team season stats')
      }
      const data = await response.json()
      return data.data
    },
    enabled: () => selectedSeason() !== null
  }))

  const teamMatchesQuery = createQuery(() => ({
    queryKey: ['team-matches', teamId(), selectedSeason()],
    queryFn: async (): Promise<{ matches: Match[] }> => {
      if (!selectedSeason()) {
        throw new Error('No season selected')
      }
      const response = await fetch(apiUrl(`/matches?season=${selectedSeason()}&limit=100`))
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      const data = await response.json()
      // Filter matches for this team using correct field names
      const teamName = teamQuery.data?.name || ''
      const filteredMatches = data.data.matches.filter((match: any) => 
        match.homeTeam === teamName || match.awayTeam === teamName
      )
      // Convert to expected format
      const convertedMatches = filteredMatches.map((match: any) => ({
        id: match.id,
        season_id: match.seasonId,
        home_team: match.homeTeam,
        away_team: match.awayTeam,
        home_score: match.homeScore,
        away_score: match.awayScore,
        match_date: match.date,
        referee: match.referee
      }))
      return { matches: convertedMatches }
    },
    enabled: () => teamQuery.data !== undefined && selectedSeason() !== null
  }))

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getMatchResult = (match: Match, teamName: string) => {
    const isHome = match.home_team === teamName
    const isAway = match.away_team === teamName
    
    if (isHome) {
      if (match.home_score > match.away_score) return 'W'
      if (match.home_score < match.away_score) return 'L'
      return 'D'
    } else if (isAway) {
      if (match.away_score > match.home_score) return 'W'
      if (match.away_score < match.home_score) return 'L'
      return 'D'
    }
    return 'D'
  }

  const getMatchScore = (match: Match, teamName: string) => {
    const isHome = match.home_team === teamName
    if (isHome) {
      return `${match.home_score}-${match.away_score}`
    } else {
      return `${match.away_score}-${match.home_score}`
    }
  }

  const getOpponent = (match: Match, teamName: string) => {
    return match.home_team === teamName ? match.away_team : match.home_team
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'W': return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      case 'L': return 'bg-rose-50 text-rose-700 border border-rose-200'
      case 'D': return 'bg-slate-100 text-slate-600 border border-slate-200'
      default: return 'bg-slate-100 text-slate-600 border border-slate-200'
    }
  }

  return (
    <Container class="max-w-5xl">
      <div class="space-y-6">
        {/* Team Header */}
        {teamQuery.data && (
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              {getTeamCrest(teamQuery.data.name) ? (
                <img
                  src={getTeamCrest(teamQuery.data.name)}
                  alt={`${teamQuery.data.name} crest`}
                  class="w-16 h-16 object-contain"
                />
              ) : (
                <div class="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-xl">
                  {teamQuery.data.shortName}
                </div>
              )}
              <div>
                <h1 class="text-3xl font-bold tracking-tight">{teamQuery.data.name}</h1>
                <p class="text-muted-foreground">
                  {teamQuery.data.stadium} • Founded {teamQuery.data.founded}
                </p>
              </div>
            </div>
            <Button onClick={() => window.history.back()}>
              ← Back to Teams
            </Button>
          </div>
        )}

        {/* Season Selector */}
        <div class="flex items-center space-x-2">
          <label class="text-sm font-medium">Season:</label>
          <select 
            class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={selectedSeason() || ''}
            onChange={(e) => setSelectedSeason(e.currentTarget.value ? parseInt(e.currentTarget.value) : null)}
          >
            <option value="">All seasons available</option>
            <For each={seasonsQuery.data?.seasons || []}>
              {(season) => (
                <option value={season.id}>{season.name}</option>
              )}
            </For>
          </select>
        </div>

        {/* Season Statistics */}
        {teamSeasonStatsQuery.data && (
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Season Statistics</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                label="Matches Played"
                value={teamSeasonStatsQuery.data.matchesPlayed.toString()}
                variant="default"
              />
              <StatsCard
                label="Points"
                value={teamSeasonStatsQuery.data.points.toString()}
                description={`${teamSeasonStatsQuery.data.pointsPerGame.toFixed(2)} per game`}
                variant="success"
              />
              <StatsCard
                label="Win Rate"
                value={`${teamSeasonStatsQuery.data.winPercentage.toFixed(1)}%`}
                description={`${teamSeasonStatsQuery.data.wins}W ${teamSeasonStatsQuery.data.draws}D ${teamSeasonStatsQuery.data.losses}L`}
                variant="default"
              />
              <StatsCard
                label="Goal Difference"
                value={teamSeasonStatsQuery.data.goalDifference > 0 ? `+${teamSeasonStatsQuery.data.goalDifference}` : teamSeasonStatsQuery.data.goalDifference.toString()}
                description={`${teamSeasonStatsQuery.data.goalsFor} for, ${teamSeasonStatsQuery.data.goalsAgainst} against`}
                variant={teamSeasonStatsQuery.data.goalDifference > 0 ? "success" : teamSeasonStatsQuery.data.goalDifference < 0 ? "danger" : "default"}
              />
            </div>
          </div>
        )}

        {/* Recent Matches */}
        {teamMatchesQuery.data && teamQuery.data && (
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Recent Matches</h2>
            <div class="space-y-2">
              <For each={teamMatchesQuery.data.matches.slice(0, 10)}>
                {(match) => {
                  const result = getMatchResult(match, teamQuery.data!.name)
                  return (
                    <Card>
                      <div class="p-4">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center space-x-4">
                            <div class="text-sm text-muted-foreground min-w-[80px]">
                              {formatDate(match.match_date)}
                            </div>
                            <div class={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center ${getResultColor(result)}`}>
                              {result}
                            </div>
                            <div class="font-medium">
                              vs {getOpponent(match, teamQuery.data!.name)}
                            </div>
                          </div>
                          <div class="flex items-center space-x-3">
                            <div class="font-bold text-lg">
                              {getMatchScore(match, teamQuery.data!.name)}
                            </div>
                            <div class="text-xs text-muted-foreground">
                              {match.home_team === teamQuery.data!.name ? 'H' : 'A'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                }}
              </For>
            </div>
          </div>
        )}

        {/* Loading States */}
        {teamQuery.isLoading && (
          <div class="text-center py-8">
            <p class="text-muted-foreground">Loading team details...</p>
          </div>
        )}

        {teamQuery.isError && (
          <div class="text-center py-8">
            <p class="text-destructive">Failed to load team details. Please try again.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export default TeamDetail