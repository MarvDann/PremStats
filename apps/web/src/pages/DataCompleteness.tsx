import { createSignal, createEffect, For, Show } from 'solid-js'
import { API_BASE_URL } from '../config/api'

interface SeasonCompleteness {
  id: number
  year: number
  name: string
  totalMatches: number
  matchesWithScores: number
  matchesWithGoals: number
  totalGoals: number
  uniquePlayers: number
  teamsCount: number
  expectedMatches: number
  matchCompleteness: number
  goalCompleteness: number
  seasonProgress: number
  qualityLevel: string
  qualityIcon: string
  seasonStart: string | null
  seasonEnd: string | null
  lastUpdated: string
}

interface OverallStats {
  totalSeasons: number
  seasonsWithData: number
  totalMatches: number
  totalGoals: number
  totalPlayers: number
  excellentSeasons: number
  goodSeasons: number
  partialSeasons: number
  minimalSeasons: number
  noDataSeasons: number
  avgMatchCompleteness: number
  avgGoalCompleteness: number
  lastUpdated: string
}

interface EraStats {
  name: string
  yearRange: string
  seasonsTotal: number
  seasonsWithData: number
  avgGoalCompleteness: number
  totalGoals: number
  totalMatches: number
}

interface ActivityLog {
  date: string
  activity: string
  season: string
  details: string
  goalsAdded: number
  source: string
}

interface DataCompletenessReport {
  overallStats: OverallStats
  seasonData: SeasonCompleteness[]
  eraStats: EraStats[]
  bestSeasons: SeasonCompleteness[]
  worstSeasons: SeasonCompleteness[]
  recentActivity: ActivityLog[]
  generatedAt: string
}

const DataCompleteness = () => {
  const [report, setReport] = createSignal<DataCompletenessReport | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)
  const [autoRefresh, setAutoRefresh] = createSignal(true)
  const [lastRefresh, setLastRefresh] = createSignal<Date | null>(null)

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/reports/data-completeness`)
      const data = await response.json()

      if (data.success) {
        setReport(data.data)
        setLastRefresh(new Date())
      } else {
        setError('Failed to fetch data completeness report')
      }
    } catch (err) {
      setError('Error connecting to API')
      console.error('Report fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh every 30 seconds if enabled
  createEffect(() => {
    if (autoRefresh()) {
      const interval = setInterval(fetchReport, 30000)
      return () => clearInterval(interval)
    }
  })

  // Initial load
  createEffect(() => {
    fetchReport()
  })

  const getQualityColor = (level: string) => {
    switch (level) {
    case 'Excellent': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
    case 'Good': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30'
    case 'Partial': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30'
    case 'Minimal': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30'
    case 'No Data': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30'
    default: return 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div class="min-h-screen bg-[hsl(var(--background))] p-6">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 mb-6 border border-[hsl(var(--border))]">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-[hsl(var(--foreground))]">Data Completeness Report</h1>
              <p class="text-[hsl(var(--muted-foreground))] mt-2">Live monitoring of Premier League data coverage across all seasons</p>
            </div>
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh()}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  class="mr-2"
                />
                Auto-refresh (30s)
              </label>
              <button
                onClick={fetchReport}
                disabled={loading()}
                class="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-md hover:bg-[hsl(var(--primary)/0.9)] disabled:opacity-50"
              >
                {loading() ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>
          <Show when={lastRefresh()}>
            <p class="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              Last updated: {lastRefresh()?.toLocaleString()}
            </p>
          </Show>
        </div>

        <Show when={error()}>
          <div class="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400 px-4 py-3 rounded mb-6">
            {error()}
          </div>
        </Show>

        <Show when={loading() && !report()}>
          <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-12 text-center border border-[hsl(var(--border))]">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(var(--primary))] mx-auto"></div>
            <p class="mt-4 text-[hsl(var(--muted-foreground))]">Loading data completeness report...</p>
          </div>
        </Show>

        <Show when={report()}>
          {(reportData) => (
            <>
              {/* Overall Statistics */}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Total Seasons</h3>
                  <div class="text-3xl font-bold text-primary">{reportData().overallStats.totalSeasons}</div>
                  <p class="text-sm text-[hsl(var(--muted-foreground))]">Seasons with data: {reportData().overallStats.seasonsWithData}</p>
                </div>

                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Total Matches</h3>
                  <div class="text-3xl font-bold text-blue-600">{formatNumber(reportData().overallStats.totalMatches)}</div>
                  <p class="text-sm text-[hsl(var(--muted-foreground))]">Across all seasons</p>
                </div>

                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Total Goals</h3>
                  <div class="text-3xl font-bold text-green-600">{formatNumber(reportData().overallStats.totalGoals)}</div>
                  <p class="text-sm text-[hsl(var(--muted-foreground))]">Historical goal data</p>
                </div>

                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h3 class="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Goal Coverage</h3>
                  <div class="text-3xl font-bold text-purple-600">{reportData().overallStats.avgGoalCompleteness.toFixed(1)}%</div>
                  <p class="text-sm text-[hsl(var(--muted-foreground))]">Average across seasons</p>
                </div>
              </div>

              {/* Quality Distribution */}
              <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 mb-6 border border-[hsl(var(--border))]">
                <h2 class="text-xl font-bold text-[hsl(var(--foreground))] mb-4">Data Quality Distribution</h2>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div class="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800/50">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-400">{reportData().overallStats.excellentSeasons}</div>
                    <div class="text-sm text-green-700 dark:text-green-300">🌟 Excellent (95%+)</div>
                  </div>
                  <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{reportData().overallStats.goodSeasons}</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">✅ Good (80-94%)</div>
                  </div>
                  <div class="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800/50">
                    <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{reportData().overallStats.partialSeasons}</div>
                    <div class="text-sm text-yellow-700 dark:text-yellow-300">🔄 Partial (50-79%)</div>
                  </div>
                  <div class="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800/50">
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">{reportData().overallStats.minimalSeasons}</div>
                    <div class="text-sm text-orange-700 dark:text-orange-300">⚠️ Minimal (1-49%)</div>
                  </div>
                  <div class="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800/50">
                    <div class="text-2xl font-bold text-red-600 dark:text-red-400">{reportData().overallStats.noDataSeasons}</div>
                    <div class="text-sm text-red-700 dark:text-red-300">❌ No Data (0%)</div>
                  </div>
                </div>
              </div>

              {/* Era Statistics */}
              <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 mb-6 border border-[hsl(var(--border))]">
                <h2 class="text-xl font-bold text-[hsl(var(--foreground))] mb-4">Coverage by Era</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <For each={reportData().eraStats}>
                    {(era) => (
                      <div class="border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--muted)/0.3)]">
                        <h3 class="font-semibold text-[hsl(var(--foreground))]">{era.name}</h3>
                        <p class="text-sm text-[hsl(var(--muted-foreground))] mb-2">{era.yearRange}</p>
                        <div class="space-y-1 text-sm text-[hsl(var(--foreground))]">
                          <div>Seasons: {era.seasonsWithData}/{era.seasonsTotal}</div>
                          <div>Goals: {formatNumber(era.totalGoals)}</div>
                          <div>Coverage: {era.avgGoalCompleteness.toFixed(1)}%</div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              {/* Season Data Table */}
              <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm overflow-hidden mb-6 border border-[hsl(var(--border))]">
                <div class="px-6 py-4 border-b border-[hsl(var(--border))]">
                  <h2 class="text-xl font-bold text-[hsl(var(--foreground))]">Season-by-Season Breakdown</h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-[hsl(var(--border))]">
                    <thead class="bg-[hsl(var(--muted)/0.5)]">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Season</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Matches</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Goals</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Players</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Goal Coverage</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Quality</th>
                      </tr>
                    </thead>
                    <tbody class="bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
                      <For each={reportData().seasonData}>
                        {(season) => (
                          <tr class="hover:bg-[hsl(var(--muted)/0.3)]">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm font-medium text-[hsl(var(--foreground))]">{season.year}</div>
                              <div class="text-sm text-[hsl(var(--muted-foreground))]">{season.name}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                              {formatNumber(season.totalMatches)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                              {formatNumber(season.totalGoals)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-[hsl(var(--foreground))]">
                              {formatNumber(season.uniquePlayers)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-[hsl(var(--foreground))]">{season.goalCompleteness.toFixed(1)}%</div>
                              <div class="w-full bg-[hsl(var(--muted))] rounded-full h-2 mt-1">
                                <div
                                  class="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                                  style={`width: ${Math.min(season.goalCompleteness, 100)}%`}
                                ></div>
                              </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor(season.qualityLevel)}`}>
                                {season.qualityIcon} {season.qualityLevel}
                              </span>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Best and Worst Seasons */}
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h2 class="text-xl font-bold text-[hsl(var(--foreground))] mb-4">🏆 Best Coverage</h2>
                  <div class="space-y-2">
                    <For each={reportData().bestSeasons}>
                      {(season) => (
                        <div class="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800/50">
                          <span class="font-medium text-[hsl(var(--foreground))]">{season.year} {season.name}</span>
                          <span class="text-green-600 dark:text-green-400 font-bold">{season.goalCompleteness.toFixed(1)}%</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h2 class="text-xl font-bold text-[hsl(var(--foreground))] mb-4">⚠️ Priority Improvements</h2>
                  <div class="space-y-2">
                    <For each={reportData().worstSeasons}>
                      {(season) => (
                        <div class="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800/50">
                          <span class="font-medium text-[hsl(var(--foreground))]">{season.year} {season.name}</span>
                          <span class="text-red-600 dark:text-red-400 font-bold">{season.goalCompleteness.toFixed(1)}%</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <Show when={reportData().recentActivity.length > 0}>
                <div class="bg-[hsl(var(--card))] rounded-lg shadow-sm p-6 border border-[hsl(var(--border))]">
                  <h2 class="text-xl font-bold text-[hsl(var(--foreground))] mb-4">Recent Data Activity</h2>
                  <div class="space-y-3">
                    <For each={reportData().recentActivity}>
                      {(activity) => (
                        <div class="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2">
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-medium text-[hsl(var(--foreground))]">{activity.activity}</p>
                              <p class="text-sm text-[hsl(var(--muted-foreground))]">{activity.details}</p>
                              <p class="text-xs text-[hsl(var(--muted-foreground))]">{activity.season} • {activity.source}</p>
                            </div>
                            <div class="text-right text-sm">
                              <div class="font-medium text-green-600 dark:text-green-400">+{activity.goalsAdded} goals</div>
                              <div class="text-[hsl(var(--muted-foreground))]">{formatDate(activity.date)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Footer */}
              <div class="text-center text-[hsl(var(--muted-foreground))] text-sm mt-8">
                Report generated at {formatDate(reportData().generatedAt)} •
                🎯 6 Sigma Data Quality Initiative
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  )
}

export default DataCompleteness
