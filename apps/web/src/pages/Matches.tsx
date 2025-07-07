import type { Component } from 'solid-js'
import { createSignal, For, onMount, onCleanup } from 'solid-js'
import { createQuery } from '@tanstack/solid-query'
import { Container, Card } from '@premstats/ui'
import { getCurrentSeasonId, getSortedSeasons } from '../utils/seasonStore'
import { getTeamCrest } from '../utils/teamCrests'

interface Match {
  id: number
  seasonId: number
  homeTeamId: number
  awayTeamId: number
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  date: string
  referee: string
  status: string
}

interface Season {
  id: number
  name: string
}

const MatchesPage: Component = () => {
  const [selectedSeason, setSelectedSeason] = createSignal<number | null>(null)
  const [selectedTeam, setSelectedTeam] = createSignal<string | null>(null)
  const [currentPage, setCurrentPage] = createSignal(1)
  const limit = 20

  // Initialize with global current season when component mounts
  onMount(() => {
    const currentId = getCurrentSeasonId()
    if (currentId && selectedSeason() === null) {
      setSelectedSeason(currentId)
    }
    console.log('Matches component mounted')
  })

  // Clean up when component unmounts
  onCleanup(() => {
    console.log('Matches component unmounted')
  })

  // Use global sorted seasons
  const sortedSeasons = () => getSortedSeasons()
  
  // Get effective season ID (fallback to global current season)
  const effectiveSeasonId = () => {
    const selected = selectedSeason()
    return selected !== null ? selected : getCurrentSeasonId()
  }

  // Teams query for filter dropdown - only teams from selected season
  const seasonTeamsQuery = createQuery(() => ({
    queryKey: ['season-teams', effectiveSeasonId()],
    queryFn: async (): Promise<string[]> => {
      const seasonId = effectiveSeasonId()
      if (!seasonId) return []
      
      // Fetch matches for the season to get unique teams
      const response = await fetch(`http://localhost:8081/api/v1/matches?season=${seasonId}&limit=1000`)
      if (!response.ok) {
        throw new Error('Failed to fetch matches for season teams')
      }
      const result = await response.json()
      
      // Extract unique team names from matches
      const teams = new Set<string>()
      result.data.matches.forEach((match: Match) => {
        teams.add(match.homeTeam)
        teams.add(match.awayTeam)
      })
      
      return Array.from(teams).sort()
    },
    get enabled() {
      return effectiveSeasonId() !== null
    }
  }))

  const matchesQuery = createQuery(() => ({
    queryKey: ['matches', effectiveSeasonId(), selectedTeam(), currentPage()],
    queryFn: async (): Promise<{ matches: Match[]; total: number }> => {
      const seasonId = effectiveSeasonId()
      if (!seasonId) throw new Error('No season selected')
      
      // Fetch ALL matches for the season first
      const response = await fetch(`http://localhost:8081/api/v1/matches?season=${seasonId}&limit=1000`)
      if (!response.ok) {
        throw new Error('Failed to fetch matches')
      }
      const result = await response.json()
      let allMatches = result.data.matches.sort((a: Match, b: Match) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      // Filter by team if selected
      if (selectedTeam()) {
        allMatches = allMatches.filter((match: Match) => 
          match.homeTeam === selectedTeam() || match.awayTeam === selectedTeam()
        )
      }
      
      // Apply pagination
      const startIndex = (currentPage() - 1) * limit
      const endIndex = startIndex + limit
      const paginatedMatches = allMatches.slice(startIndex, endIndex)
      
      console.log(`Loaded ${paginatedMatches.length} matches (page ${currentPage()}) for season ${seasonId}`)
      return { matches: paginatedMatches, total: allMatches.length }
    },
    get enabled() {
      return effectiveSeasonId() !== null
    }
  }))

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1)

  // Clear selected team if it's not in the current season
  const clearInvalidTeamSelection = () => {
    if (selectedTeam() && seasonTeamsQuery.data && !seasonTeamsQuery.data.includes(selectedTeam()!)) {
      setSelectedTeam(null)
    }
  }

  // Watch for season team data changes to clear invalid selections
  const _ = () => {
    clearInvalidTeamSelection()
    return seasonTeamsQuery.data
  }
  _() // Call to establish reactivity

  // Calculate pagination info
  const totalPages = () => Math.ceil((matchesQuery.data?.total || 0) / limit)
  const startResult = () => (currentPage() - 1) * limit + 1
  const endResult = () => Math.min(currentPage() * limit, matchesQuery.data?.total || 0)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'TBD'
    return date.toLocaleDateString('en-GB', {
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
    <Container class="max-w-5xl">
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
              value={effectiveSeasonId() || ''}
              onChange={(e) => {
                setSelectedSeason(parseInt(e.currentTarget.value))
                resetPage()
              }}
            >
              <For each={sortedSeasons()}>
                {(season) => (
                  <option value={season.id}>{season.name}</option>
                )}
              </For>
            </select>
          </div>
          
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium">Team:</label>
            <select 
              class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedTeam() || ''}
              onChange={(e) => {
                setSelectedTeam(e.currentTarget.value || null)
                resetPage()
              }}
            >
              <option value="">All Teams</option>
              <For each={seasonTeamsQuery.data || []}>
                {(teamName) => (
                  <option value={teamName}>{teamName}</option>
                )}
              </For>
            </select>
          </div>
        </div>

        {/* Results Info */}
        {matchesQuery.data && (
          <div class="flex justify-between items-center text-sm text-muted-foreground">
            <div>
              Showing {startResult()}-{endResult()} of {matchesQuery.data.total} matches
              {selectedTeam() && ` for ${selectedTeam()}`}
            </div>
            <div>
              Page {currentPage()} of {totalPages()}
            </div>
          </div>
        )}

        {/* Matches List */}
        <div class="space-y-2">
          <For each={matchesQuery.data?.matches || []}>
            {(match) => (
              <Card>
                <div class="p-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                      <div class="text-sm text-muted-foreground min-w-[80px]">
                        {formatDate(match.date)}
                      </div>
                      <div class="flex items-center space-x-3">
                        <div class="flex items-center justify-end space-x-2 w-[250px] font-medium">
                          <span class="text-right">{match.homeTeam}</span>
                          {getTeamCrest(match.homeTeam) ? (
                            <img
                              src={getTeamCrest(match.homeTeam)}
                              alt={`${match.homeTeam} crest`}
                              class="w-5 h-5 object-contain flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            class={`w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 ${getTeamCrest(match.homeTeam) ? 'hidden' : 'flex'}`}
                            style={getTeamCrest(match.homeTeam) ? 'display: none' : 'display: flex'}
                          >
                            {match.homeTeam.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div class="flex items-center justify-center w-[100px]">
                          <span class="font-bold text-lg tabular-nums w-[30px] text-right">{match.homeScore}</span>
                          <span class="text-muted-foreground mx-2">-</span>
                          <span class="font-bold text-lg tabular-nums w-[30px] text-left">{match.awayScore}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-left w-[250px] font-medium">
                          {getTeamCrest(match.awayTeam) ? (
                            <img
                              src={getTeamCrest(match.awayTeam)}
                              alt={`${match.awayTeam} crest`}
                              class="w-5 h-5 object-contain flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div 
                            class={`w-5 h-5 bg-muted rounded-full flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0 ${getTeamCrest(match.awayTeam) ? 'hidden' : 'flex'}`}
                            style={getTeamCrest(match.awayTeam) ? 'display: none' : 'display: flex'}
                          >
                            {match.awayTeam.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{match.awayTeam}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="text-xs text-muted-foreground">
                        {match.referee && `Ref: ${match.referee}`}
                      </div>
                      <div class={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        getMatchResult(match.homeScore, match.awayScore) === 'H' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : getMatchResult(match.homeScore, match.awayScore) === 'A'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {getMatchResult(match.homeScore, match.awayScore)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </For>
        </div>

        {/* Pagination */}
        {matchesQuery.data && totalPages() > 1 && (
          <div class="flex justify-center items-center space-x-2">
            <button
              class="flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              disabled={currentPage() === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage() - 1))}
            >
              Previous
            </button>
            
            <div class="flex items-center space-x-1">
              <For each={Array.from({ length: Math.min(5, totalPages()) }, (_, i) => {
                const start = Math.max(1, currentPage() - 2)
                const end = Math.min(totalPages(), start + 4)
                return Array.from({ length: end - start + 1 }, (_, j) => start + j)
              })[0]}>
                {(pageNum) => (
                  <button
                    class={`flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-10 w-10 ${
                      currentPage() === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                )}
              </For>
            </div>
            
            <button
              class="flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              disabled={currentPage() === totalPages()}
              onClick={() => setCurrentPage(Math.min(totalPages(), currentPage() + 1))}
            >
              Next
            </button>
          </div>
        )}

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