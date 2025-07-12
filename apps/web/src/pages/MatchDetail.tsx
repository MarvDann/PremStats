import type { Component } from 'solid-js'
import { createSignal, For, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card, Button, Badge } from '@premstats/ui'
import { getTeamCrest } from '../utils/teamCrests'
import { apiUrl } from '../config/api'

interface MatchDetail {
  id: number
  seasonId: number
  homeTeamId: number
  awayTeamId: number
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  halfTimeHome: number | null
  halfTimeAway: number | null
  date: string
  status: string
  referee: string | null
  attendance: number | null
  // Additional stats
  homeShots?: number
  awayShots?: number
  homeShotsOnTarget?: number
  awayShotsOnTarget?: number
  homeCorners?: number
  awayCorners?: number
  homeFouls?: number
  awayFouls?: number
  homeYellowCards?: number
  awayYellowCards?: number
  homeRedCards?: number
  awayRedCards?: number
}

interface MatchEvent {
  id: number
  matchId: number
  eventType: string
  minute: number
  playerId: number
  playerName?: string
  teamId: number
  detail?: string
}

interface HeadToHead {
  totalMatches: number
  homeWins: number
  draws: number
  awayWins: number
  homeGoals: number
  awayGoals: number
  lastMeetings: MatchDetail[]
}

const MatchDetail: Component = () => {
  const params = useParams()
  const matchId = () => parseInt(params.id)
  const [activeTab, setActiveTab] = createSignal<'overview' | 'stats' | 'timeline' | 'h2h'>('overview')

  // Fetch match details
  const matchQuery = createQuery(() => ({
    queryKey: ['match', matchId()],
    queryFn: async (): Promise<MatchDetail> => {
      const response = await fetch(apiUrl(`/matches/${matchId()}`))
      if (!response.ok) {
        throw new Error('Failed to fetch match')
      }
      const data = await response.json()
      return data.data
    }
  }))

  // Fetch match events (goals, cards, subs)
  const eventsQuery = createQuery(() => ({
    queryKey: ['match-events', matchId()],
    queryFn: async (): Promise<{ events: MatchEvent[] }> => {
      const response = await fetch(apiUrl(`/matches/${matchId()}/events`))
      if (!response.ok) {
        // Return empty events if endpoint doesn't exist yet
        return { events: [] }
      }
      const data = await response.json()
      return data.data
    }
  }))

  // Fetch head-to-head data
  const h2hQuery = createQuery(() => ({
    queryKey: ['h2h', matchQuery.data?.homeTeamId, matchQuery.data?.awayTeamId],
    queryFn: async (): Promise<HeadToHead | null> => {
      if (!matchQuery.data) return null
      const response = await fetch(
        apiUrl(`/teams/${matchQuery.data.homeTeamId}/vs/${matchQuery.data.awayTeamId}`)
      )
      if (!response.ok) {
        // Return mock data for now
        return {
          totalMatches: 0,
          homeWins: 0,
          draws: 0,
          awayWins: 0,
          homeGoals: 0,
          awayGoals: 0,
          lastMeetings: []
        }
      }
      const data = await response.json()
      return data.data
    },
    enabled: () => !!matchQuery.data
  }))

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getResultBadge = (homeScore: number | null, awayScore: number | null, isHome: boolean) => {
    if (homeScore === null || awayScore === null) return null

    if (homeScore > awayScore) {
      return isHome ? <Badge variant="success">W</Badge> : <Badge variant="destructive">L</Badge>
    } else if (homeScore < awayScore) {
      return isHome ? <Badge variant="destructive">L</Badge> : <Badge variant="success">W</Badge>
    } else {
      return <Badge variant="default">D</Badge>
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
    case 'goal':
      return '⚽'
    case 'own_goal':
      return '🥅'
    case 'penalty':
      return '⚽🎯'
    case 'yellow_card':
      return '🟨'
    case 'red_card':
      return '🟥'
    case 'substitution':
      return '🔄'
    default:
      return '📝'
    }
  }

  const getEventDescription = (event: MatchEvent) => {
    switch (event.eventType) {
    case 'goal':
      return 'Goal'
    case 'own_goal':
      return 'Own Goal'
    case 'penalty':
      return 'Penalty Goal'
    case 'yellow_card':
      return 'Yellow Card'
    case 'red_card':
      return 'Red Card'
    case 'substitution':
      return 'Substitution'
    default:
      return event.eventType
    }
  }

  return (
    <Container>
      <div class="space-y-6">
        {/* Back button */}
        <Button onClick={() => window.history.back()}>
          ← Back to Matches
        </Button>

        {/* Match Header */}
        {matchQuery.data && (
          <Card>
            <div class="p-6">
              <div class="text-center mb-4">
                <p class="text-sm text-muted-foreground">{formatDate(matchQuery.data.date)}</p>
                <p class="text-xs text-muted-foreground">{formatTime(matchQuery.data.date)}</p>
              </div>

              <div class="grid grid-cols-3 gap-4 items-center">
                {/* Home Team */}
                <div class="text-center">
                  <div class="flex flex-col items-center space-y-2">
                    {getTeamCrest(matchQuery.data.homeTeam)
                      ? (
                        <img
                          src={getTeamCrest(matchQuery.data.homeTeam)}
                          alt={`${matchQuery.data.homeTeam} crest`}
                          class="w-20 h-20 object-contain"
                        />
                      )
                      : (
                        <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                          {matchQuery.data.homeTeam.substring(0, 3).toUpperCase()}
                        </div>
                      )}
                    <h3 class="font-semibold text-lg">{matchQuery.data.homeTeam}</h3>
                    {getResultBadge(matchQuery.data.homeScore, matchQuery.data.awayScore, true)}
                  </div>
                </div>

                {/* Score */}
                <div class="text-center">
                  <div class="text-5xl font-bold">
                    {matchQuery.data.homeScore ?? '-'} - {matchQuery.data.awayScore ?? '-'}
                  </div>
                  {matchQuery.data.halfTimeHome !== null && matchQuery.data.halfTimeAway !== null && (
                    <p class="text-sm text-muted-foreground mt-2">
                          HT: {matchQuery.data.halfTimeHome} - {matchQuery.data.halfTimeAway}
                    </p>
                  )}
                </div>

                {/* Away Team */}
                <div class="text-center">
                  <div class="flex flex-col items-center space-y-2">
                    {getTeamCrest(matchQuery.data.awayTeam)
                      ? (
                        <img
                          src={getTeamCrest(matchQuery.data.awayTeam)}
                          alt={`${matchQuery.data.awayTeam} crest`}
                          class="w-20 h-20 object-contain"
                        />
                      )
                      : (
                        <div class="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-2xl">
                          {matchQuery.data.awayTeam.substring(0, 3).toUpperCase()}
                        </div>
                      )}
                    <h3 class="font-semibold text-lg">{matchQuery.data.awayTeam}</h3>
                    {getResultBadge(matchQuery.data.homeScore, matchQuery.data.awayScore, false)}
                  </div>
                </div>
              </div>

              {/* Match Info */}
              <div class="mt-6 flex justify-center space-x-6 text-sm text-muted-foreground">
                {matchQuery.data.referee && (
                  <div>
                    <span class="font-medium">Referee:</span> {matchQuery.data.referee}
                  </div>
                )}
                {matchQuery.data.attendance && (
                  <div>
                    <span class="font-medium">Attendance:</span> {matchQuery.data.attendance.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div class="border-b border-border">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab() === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab() === 'stats'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              Statistics
            </button>
            <button
              class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab() === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button
              class={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab() === 'h2h'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
              onClick={() => setActiveTab('h2h')}
            >
              Head to Head
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <Show when={activeTab() === 'overview'}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Stats */}
            <Card>
              <div class="p-4">
                <h3 class="text-lg font-semibold mb-4">Key Statistics</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span>Total Shots</span>
                    <div class="flex items-center space-x-4 text-sm">
                      <span>{matchQuery.data?.homeShots ?? '-'}</span>
                      <span class="text-muted-foreground">|</span>
                      <span>{matchQuery.data?.awayShots ?? '-'}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Shots on Target</span>
                    <div class="flex items-center space-x-4 text-sm">
                      <span>{matchQuery.data?.homeShotsOnTarget ?? '-'}</span>
                      <span class="text-muted-foreground">|</span>
                      <span>{matchQuery.data?.awayShotsOnTarget ?? '-'}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Corners</span>
                    <div class="flex items-center space-x-4 text-sm">
                      <span>{matchQuery.data?.homeCorners ?? '-'}</span>
                      <span class="text-muted-foreground">|</span>
                      <span>{matchQuery.data?.awayCorners ?? '-'}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Fouls</span>
                    <div class="flex items-center space-x-4 text-sm">
                      <span>{matchQuery.data?.homeFouls ?? '-'}</span>
                      <span class="text-muted-foreground">|</span>
                      <span>{matchQuery.data?.awayFouls ?? '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Discipline */}
            <Card>
              <div class="p-4">
                <h3 class="text-lg font-semibold mb-4">Discipline</h3>
                <div class="space-y-3">
                  <div class="flex justify-between items-center">
                    <span>Yellow Cards</span>
                    <div class="flex items-center space-x-4 text-sm">
                      <span>{matchQuery.data?.homeYellowCards ?? '-'}</span>
                      <span class="text-muted-foreground">|</span>
                      <span>{matchQuery.data?.awayYellowCards ?? '-'}</span>
                    </div>
                  </div>
                  <div class="flex justify-between items-center">
                    <span>Red Cards</span>
                    <div class="flex items-center space-x-4 text-sm">
                      <span>{matchQuery.data?.homeRedCards ?? '-'}</span>
                      <span class="text-muted-foreground">|</span>
                      <span>{matchQuery.data?.awayRedCards ?? '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Show>

        <Show when={activeTab() === 'stats'}>
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold mb-6">Match Statistics</h3>
              {matchQuery.data && (
                <div class="space-y-6">
                  {/* Shots */}
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium">Total Shots</span>
                      <div class="flex items-center space-x-4 text-sm font-medium">
                        <span>{matchQuery.data.homeShots ?? '-'}</span>
                        <span class="text-muted-foreground">|</span>
                        <span>{matchQuery.data.awayShots ?? '-'}</span>
                      </div>
                    </div>
                    <div class="relative h-2 bg-muted rounded-full overflow-hidden">
                      {matchQuery.data.homeShots && matchQuery.data.awayShots && (
                        <>
                          <div
                            class="absolute left-0 top-0 h-full bg-primary transition-all"
                            style={`width: ${(matchQuery.data.homeShots / (matchQuery.data.homeShots + matchQuery.data.awayShots)) * 100}%`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Shots on Target */}
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium">Shots on Target</span>
                      <div class="flex items-center space-x-4 text-sm font-medium">
                        <span>{matchQuery.data.homeShotsOnTarget ?? '-'}</span>
                        <span class="text-muted-foreground">|</span>
                        <span>{matchQuery.data.awayShotsOnTarget ?? '-'}</span>
                      </div>
                    </div>
                    <div class="relative h-2 bg-muted rounded-full overflow-hidden">
                      {matchQuery.data.homeShotsOnTarget && matchQuery.data.awayShotsOnTarget && (
                        <>
                          <div
                            class="absolute left-0 top-0 h-full bg-primary transition-all"
                            style={`width: ${(matchQuery.data.homeShotsOnTarget / (matchQuery.data.homeShotsOnTarget + matchQuery.data.awayShotsOnTarget)) * 100}%`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Corners */}
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium">Corners</span>
                      <div class="flex items-center space-x-4 text-sm font-medium">
                        <span>{matchQuery.data.homeCorners ?? '-'}</span>
                        <span class="text-muted-foreground">|</span>
                        <span>{matchQuery.data.awayCorners ?? '-'}</span>
                      </div>
                    </div>
                    <div class="relative h-2 bg-muted rounded-full overflow-hidden">
                      {matchQuery.data.homeCorners && matchQuery.data.awayCorners && (
                        <>
                          <div
                            class="absolute left-0 top-0 h-full bg-primary transition-all"
                            style={`width: ${(matchQuery.data.homeCorners / (matchQuery.data.homeCorners + matchQuery.data.awayCorners)) * 100}%`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Fouls */}
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium">Fouls</span>
                      <div class="flex items-center space-x-4 text-sm font-medium">
                        <span>{matchQuery.data.homeFouls ?? '-'}</span>
                        <span class="text-muted-foreground">|</span>
                        <span>{matchQuery.data.awayFouls ?? '-'}</span>
                      </div>
                    </div>
                    <div class="relative h-2 bg-muted rounded-full overflow-hidden">
                      {matchQuery.data.homeFouls && matchQuery.data.awayFouls && (
                        <>
                          <div
                            class="absolute left-0 top-0 h-full bg-primary transition-all"
                            style={`width: ${(matchQuery.data.homeFouls / (matchQuery.data.homeFouls + matchQuery.data.awayFouls)) * 100}%`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Cards */}
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium">Yellow Cards</span>
                      <div class="flex items-center space-x-4 text-sm font-medium">
                        <span class="text-yellow-600">{matchQuery.data.homeYellowCards ?? '-'}</span>
                        <span class="text-muted-foreground">|</span>
                        <span class="text-yellow-600">{matchQuery.data.awayYellowCards ?? '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm font-medium">Red Cards</span>
                      <div class="flex items-center space-x-4 text-sm font-medium">
                        <span class="text-red-600">{matchQuery.data.homeRedCards ?? '-'}</span>
                        <span class="text-muted-foreground">|</span>
                        <span class="text-red-600">{matchQuery.data.awayRedCards ?? '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Show>

        <Show when={activeTab() === 'timeline'}>
          <Card>
            <div class="p-6">
              {eventsQuery.data?.events && eventsQuery.data.events.length > 0
                ? (
                  <div class="space-y-3">
                    <h3 class="text-lg font-semibold mb-4">Match Events</h3>
                    <For each={eventsQuery.data.events.sort((a, b) => a.minute - b.minute)}>
                      {(event) => {
                        const isHomeTeam = event.teamId === matchQuery.data?.homeTeamId
                        const teamName = isHomeTeam ? matchQuery.data?.homeTeam : matchQuery.data?.awayTeam

                        return (
                          <div class={`flex items-center space-x-4 p-3 rounded-lg transition-colors hover:bg-muted/50 ${
                            event.eventType === 'goal' || event.eventType === 'penalty' || event.eventType === 'own_goal' ? 'bg-green-50 border border-green-200' : ''
                          }`}>
                            <div class="text-2xl flex-shrink-0">{getEventIcon(event.eventType)}</div>
                            <div class="flex-1">
                              <div class="flex items-center space-x-2">
                                <p class="font-medium">{event.playerName || 'Unknown Player'}</p>
                                <span class="text-sm text-muted-foreground">({teamName})</span>
                                {(event.eventType === 'goal' || event.eventType === 'penalty' || event.eventType === 'own_goal') && (
                                  <Badge variant="success" class="text-xs">{getEventDescription(event)}</Badge>
                                )}
                              </div>
                              {event.detail && (
                                <p class="text-sm text-muted-foreground mt-1">{event.detail}</p>
                              )}
                              {(event.eventType === 'goal' || event.eventType === 'penalty' || event.eventType === 'own_goal') && (
                                <p class="text-xs text-green-700 mt-1 font-medium">⚽ Scored for {teamName}</p>
                              )}
                            </div>
                            <div class="text-sm font-medium tabular-nums">{event.minute}'</div>
                          </div>
                        )
                      }}
                    </For>
                  </div>
                )
                : (
                  <p class="text-center text-muted-foreground">
                  Match timeline data not yet available. Goal scorers and match events will be displayed here.
                  </p>
                )}
            </div>
          </Card>
        </Show>

        <Show when={activeTab() === 'h2h'}>
          <Card>
            <div class="p-6">
              {h2hQuery.data && h2hQuery.data.totalMatches > 0 ? (
                <div class="space-y-6">
                  {/* Overall H2H Stats */}
                  <div>
                    <h3 class="text-lg font-semibold mb-4">All-Time Record</h3>
                    <div class="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p class="text-2xl font-bold text-primary">{h2hQuery.data.homeWins}</p>
                        <p class="text-sm text-muted-foreground">{matchQuery.data?.homeTeam} Wins</p>
                      </div>
                      <div>
                        <p class="text-2xl font-bold">{h2hQuery.data.draws}</p>
                        <p class="text-sm text-muted-foreground">Draws</p>
                      </div>
                      <div>
                        <p class="text-2xl font-bold text-primary">{h2hQuery.data.awayWins}</p>
                        <p class="text-sm text-muted-foreground">{matchQuery.data?.awayTeam} Wins</p>
                      </div>
                      <div>
                        <p class="text-2xl font-bold">{h2hQuery.data.totalMatches}</p>
                        <p class="text-sm text-muted-foreground">Total Matches</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Meetings */}
                  <div>
                    <h3 class="text-lg font-semibold mb-4">Recent Meetings</h3>
                    <div class="space-y-2">
                      <For each={h2hQuery.data.lastMeetings}>
                        {(match) => (
                          <div class="flex items-center justify-between p-3 border rounded-lg">
                            <div class="flex items-center space-x-4">
                              <span class="text-sm text-muted-foreground">
                                {new Date(match.date).toLocaleDateString()}
                              </span>
                              <span class="font-medium">
                                {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
                              </span>
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>
              ) : (
                <p class="text-center text-muted-foreground">
                  Head-to-head data will be available when historical matches are fully indexed.
                </p>
              )}
            </div>
          </Card>
        </Show>

        {/* Loading States */}
        {matchQuery.isLoading && (
          <div class="text-center py-8">
            <p class="text-muted-foreground">Loading match details...</p>
          </div>
        )}

        {matchQuery.isError && (
          <div class="text-center py-8">
            <p class="text-destructive">Failed to load match details. Please try again.</p>
          </div>
        )}
      </div>
    </Container>
  )
}

export default MatchDetail
