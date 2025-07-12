import type { Component } from 'solid-js'
import { createSignal, For, onMount, onCleanup } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Container, DataTable } from '@premstats/ui'
import { getCurrentSeasonId, getSortedSeasons } from '../utils/seasonStore'
import { getTeamCrest } from '../utils/teamCrests'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { apiUrl } from '../config/api'


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
  const [selectedSeason, setSelectedSeason] = createSignal<number | null>(null)

  // Initialize with global current season when component mounts
  onMount(() => {
    const currentId = getCurrentSeasonId()
    if (currentId && selectedSeason() === null) {
      setSelectedSeason(currentId)
    }
    console.log('Stats component mounted')
  })

  // Clean up when component unmounts
  onCleanup(() => {
    console.log('Stats component unmounted')
  })

  // Use global sorted seasons
  const sortedSeasons = () => getSortedSeasons()
  
  // Get effective season ID (fallback to global current season)
  const effectiveSeasonId = () => {
    const selected = selectedSeason()
    return selected !== null ? selected : getCurrentSeasonId()
  }

  const standingsQuery = createQuery(() => ({
    queryKey: ['standings', effectiveSeasonId()],
    queryFn: async (): Promise<StandingsResponse> => {
      const seasonId = effectiveSeasonId()
      if (!seasonId) throw new Error('No season selected')
      
      const response = await fetch(apiUrl(`/standings?season=${seasonId}`))
      if (!response.ok) {
        throw new Error('Failed to fetch standings')
      }
      const data = await response.json()
      return data.data
    },
    get enabled() {
      return effectiveSeasonId() !== null
    }
  }))

  const seasonSummaryQuery = createQuery(() => ({
    queryKey: ['season-summary', effectiveSeasonId()],
    queryFn: async (): Promise<SeasonSummary> => {
      const seasonId = effectiveSeasonId()
      if (!seasonId) throw new Error('No season selected')
      
      const response = await fetch(apiUrl(`/seasons/${seasonId}/summary`))
      if (!response.ok) {
        throw new Error('Failed to fetch season summary')
      }
      const data = await response.json()
      return data.data
    },
    get enabled() {
      return effectiveSeasonId() !== null
    }
  }))

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return num + 'st'
    if (j === 2 && k !== 12) return num + 'nd'
    if (j === 3 && k !== 13) return num + 'rd'
    return num + 'th'
  }

  // Get season-specific qualification rules
  const getSeasonRules = (seasonId: number | null) => {
    if (!seasonId) return { championsLeague: 4, europaLeague: [5, 6], europaConference: null, relegation: [18, 19, 20], totalTeams: 20 }
    
    // Find season by ID to get the name
    const season = sortedSeasons().find(s => s.id === seasonId)
    if (!season) return { championsLeague: 4, europaLeague: [5, 6], europaConference: null, relegation: [18, 19, 20], totalTeams: 20 }
    
    // Extract year from season name (e.g., "2024/25" -> 2024)
    const startYear = parseInt(season.name.split('/')[0])
    
    if (startYear >= 2024) {
      // 2024/25 onwards - 5 CL spots due to coefficient
      return { championsLeague: 5, europaLeague: [6], europaConference: [7], relegation: [18, 19, 20], totalTeams: 20 }
    } else if (startYear >= 2021) {
      // 2021/22 onwards - Europa Conference League introduced
      return { championsLeague: 4, europaLeague: [5, 6], europaConference: [7], relegation: [18, 19, 20], totalTeams: 20 }
    } else if (startYear >= 1995) {
      // 1995/96 onwards - 20 teams, 3 relegated
      return { championsLeague: 4, europaLeague: [5, 6], europaConference: null, relegation: [18, 19, 20], totalTeams: 20 }
    } else if (startYear === 1994) {
      // 1994/95 - Transition year: 22 teams, 4 relegated (to reduce to 20)
      return { championsLeague: 4, europaLeague: [5, 6], europaConference: null, relegation: [19, 20, 21, 22], totalTeams: 22 }
    } else {
      // 1992/93 to 1993/94 - 22 teams, 3 relegated
      return { championsLeague: 4, europaLeague: [5, 6], europaConference: null, relegation: [20, 21, 22], totalTeams: 22 }
    }
  }

  const getRowClassName = (position: number) => {
    const rules = getSeasonRules(effectiveSeasonId())
    
    if (position === 1) return 'bg-yellow-100 border-yellow-300' // Champion
    if (position <= rules.championsLeague) return 'bg-orange-50 border-orange-200' // Champions League
    if (rules.europaLeague.includes(position)) return 'bg-blue-50 border-blue-200' // Europa League
    if (rules.europaConference && rules.europaConference.includes(position)) return 'bg-purple-50 border-purple-200' // Europa Conference League
    if (rules.relegation.includes(position)) return 'bg-red-50 border-red-200' // Relegation
    return ''
  }

  const standingsColumns = [
    { header: 'Pos', key: 'position', align: 'center' as const, width: '60px', accessor: (item: StandingsEntry) => item.position },
    { 
      header: 'Team', 
      key: 'team', 
      align: 'left' as const,
      width: '300px',
      accessor: (item: StandingsEntry) => (
        <div class="flex items-center space-x-2">
          {getTeamCrest(item.team) ? (
            <img
              src={getTeamCrest(item.team)}
              alt={`${item.team} crest`}
              class="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
          ) : null}
          <div 
            class={`w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground ${getTeamCrest(item.team) ? 'hidden' : 'flex'}`}
            style={getTeamCrest(item.team) ? 'display: none' : 'display: flex'}
          >
            {item.team.substring(0, 2).toUpperCase()}
          </div>
          <span>{item.team}</span>
          {item.position === 1 && (
            <div class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <span class="text-xs font-bold text-white">C</span>
            </div>
          )}
        </div>
      )
    },
    { header: 'P', key: 'played', align: 'center' as const, width: '50px', accessor: (item: StandingsEntry) => item.played },
    { header: 'W', key: 'won', align: 'center' as const, width: '50px', accessor: (item: StandingsEntry) => item.won },
    { header: 'D', key: 'drawn', align: 'center' as const, width: '50px', accessor: (item: StandingsEntry) => item.drawn },
    { header: 'L', key: 'lost', align: 'center' as const, width: '50px', accessor: (item: StandingsEntry) => item.lost },
    { header: 'GF', key: 'goalsFor', align: 'center' as const, width: '50px', accessor: (item: StandingsEntry) => item.goalsFor },
    { header: 'GA', key: 'goalsAgainst', align: 'center' as const, width: '50px', accessor: (item: StandingsEntry) => item.goalsAgainst },
    { header: 'GD', key: 'goalDifference', align: 'center' as const, width: '60px', accessor: (item: StandingsEntry) => item.goalDifference },
    { header: 'Pts', key: 'points', align: 'center' as const, width: '60px', accessor: (item: StandingsEntry) => item.points }
  ]



  return (
    <Container class="max-w-5xl">
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h1 class="text-3xl font-bold tracking-tight">Premier League Tables</h1>
        </div>

        {/* Season Selector and Legend */}
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium">Season:</label>
            <select 
              class="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={effectiveSeasonId() || ''}
              onChange={(e) => setSelectedSeason(parseInt(e.currentTarget.value))}
            >
              <For each={sortedSeasons()}>
                {(season) => (
                  <option value={season.id}>{season.name}</option>
                )}
              </For>
            </select>
          </div>
          
          {/* Dynamic Legend */}
          <div class="flex flex-wrap gap-3 text-xs">
            {(() => {
              const rules = getSeasonRules(effectiveSeasonId())
              const legendItems = []
              
              // Champion
              legendItems.push(
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span class="font-medium">Champion</span>
                </div>
              )
              
              // Champions League
              const clRange = rules.championsLeague === 4 ? '2nd-4th' : '2nd-5th'
              legendItems.push(
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                  <span>Champions League ({clRange})</span>
                </div>
              )
              
              // Europa League
              const elRange = rules.europaLeague.length === 1 
                ? getOrdinalSuffix(rules.europaLeague[0])
                : `${getOrdinalSuffix(rules.europaLeague[0])}-${getOrdinalSuffix(rules.europaLeague[rules.europaLeague.length - 1])}`
              legendItems.push(
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                  <span>Europa League ({elRange})</span>
                </div>
              )
              
              // Europa Conference League (only if applicable)
              if (rules.europaConference) {
                legendItems.push(
                  <div class="flex items-center gap-1">
                    <div class="w-3 h-3 bg-purple-50 border border-purple-200 rounded"></div>
                    <span>Europa Conference League (7th)</span>
                  </div>
                )
              }
              
              // Relegation
              const relegationRange = rules.relegation.length === 1 
                ? getOrdinalSuffix(rules.relegation[0])
                : `${getOrdinalSuffix(rules.relegation[0])}-${getOrdinalSuffix(rules.relegation[rules.relegation.length - 1])}`
              legendItems.push(
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-red-50 border border-red-200 rounded"></div>
                  <span>Relegation ({relegationRange})</span>
                </div>
              )
              
              return legendItems
            })()}
          </div>
        </div>

        <ErrorBoundary>

          {standingsQuery.data && (
            <DataTable
              data={standingsQuery.data.table}
              columns={standingsColumns}
              sortable={false}
              variant="default"
              size="compact"
              getRowClass={(item: StandingsEntry) => getRowClassName(item.position)}
            />
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
        </ErrorBoundary>
      </div>
    </Container>
  )
}

export default StatsPage