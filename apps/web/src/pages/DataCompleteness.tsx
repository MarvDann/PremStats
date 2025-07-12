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
      case 'Excellent': return 'text-green-600 bg-green-100'
      case 'Good': return 'text-blue-600 bg-blue-100'
      case 'Partial': return 'text-yellow-600 bg-yellow-100'
      case 'Minimal': return 'text-orange-600 bg-orange-100'
      case 'No Data': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  return (
    <div class="min-h-screen bg-gray-50 p-6">
      <div class="max-w-7xl mx-auto">
        {/* Header */}
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Data Completeness Report</h1>
              <p class="text-gray-600 mt-2">Live monitoring of Premier League data coverage across all seasons</p>
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
                class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                {loading() ? 'Refreshing...' : 'Refresh Now'}
              </button>
            </div>
          </div>
          <Show when={lastRefresh()}>
            <p class="text-sm text-gray-500 mt-2">
              Last updated: {lastRefresh()?.toLocaleString()}
            </p>
          </Show>
        </div>

        <Show when={error()}>
          <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error()}
          </div>
        </Show>

        <Show when={loading() && !report()}>
          <div class="bg-white rounded-lg shadow-sm p-12 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading data completeness report...</p>
          </div>
        </Show>

        <Show when={report()}>
          {(reportData) => (
            <>
              {/* Overall Statistics */}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Seasons</h3>
                  <div class="text-3xl font-bold text-primary">{reportData().overallStats.totalSeasons}</div>
                  <p class="text-sm text-gray-600">Seasons with data: {reportData().overallStats.seasonsWithData}</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Matches</h3>
                  <div class="text-3xl font-bold text-blue-600">{formatNumber(reportData().overallStats.totalMatches)}</div>
                  <p class="text-sm text-gray-600">Across all seasons</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Total Goals</h3>
                  <div class="text-3xl font-bold text-green-600">{formatNumber(reportData().overallStats.totalGoals)}</div>
                  <p class="text-sm text-gray-600">Historical goal data</p>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">Goal Coverage</h3>
                  <div class="text-3xl font-bold text-purple-600">{reportData().overallStats.avgGoalCompleteness.toFixed(1)}%</div>
                  <p class="text-sm text-gray-600">Average across seasons</p>
                </div>
              </div>

              {/* Quality Distribution */}
              <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">Data Quality Distribution</h2>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div class="text-center p-4 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">{reportData().overallStats.excellentSeasons}</div>
                    <div class="text-sm text-green-700">🌟 Excellent (95%+)</div>
                  </div>
                  <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{reportData().overallStats.goodSeasons}</div>
                    <div class="text-sm text-blue-700">✅ Good (80-94%)</div>
                  </div>
                  <div class="text-center p-4 bg-yellow-50 rounded-lg">
                    <div class="text-2xl font-bold text-yellow-600">{reportData().overallStats.partialSeasons}</div>
                    <div class="text-sm text-yellow-700">🔄 Partial (50-79%)</div>
                  </div>
                  <div class="text-center p-4 bg-orange-50 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">{reportData().overallStats.minimalSeasons}</div>
                    <div class="text-sm text-orange-700">⚠️ Minimal (1-49%)</div>
                  </div>
                  <div class="text-center p-4 bg-red-50 rounded-lg">
                    <div class="text-2xl font-bold text-red-600">{reportData().overallStats.noDataSeasons}</div>
                    <div class="text-sm text-red-700">❌ No Data (0%)</div>
                  </div>
                </div>
              </div>

              {/* Era Statistics */}
              <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">Coverage by Era</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <For each={reportData().eraStats}>
                    {(era) => (
                      <div class="border rounded-lg p-4">
                        <h3 class="font-semibold text-gray-900">{era.name}</h3>
                        <p class="text-sm text-gray-600 mb-2">{era.yearRange}</p>
                        <div class="space-y-1 text-sm">
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
              <div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h2 class="text-xl font-bold text-gray-900">Season-by-Season Breakdown</h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Players</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal Coverage</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <For each={reportData().seasonData}>
                        {(season) => (
                          <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm font-medium text-gray-900">{season.year}</div>
                              <div class="text-sm text-gray-500">{season.name}</div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(season.totalMatches)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(season.totalGoals)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatNumber(season.uniquePlayers)}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                              <div class="text-sm text-gray-900">{season.goalCompleteness.toFixed(1)}%</div>
                              <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  class="bg-blue-600 h-2 rounded-full" 
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
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h2 class="text-xl font-bold text-gray-900 mb-4">🏆 Best Coverage</h2>
                  <div class="space-y-2">
                    <For each={reportData().bestSeasons}>
                      {(season) => (
                        <div class="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span class="font-medium">{season.year} {season.name}</span>
                          <span class="text-green-600 font-bold">{season.goalCompleteness.toFixed(1)}%</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h2 class="text-xl font-bold text-gray-900 mb-4">⚠️ Priority Improvements</h2>
                  <div class="space-y-2">
                    <For each={reportData().worstSeasons}>
                      {(season) => (
                        <div class="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span class="font-medium">{season.year} {season.name}</span>
                          <span class="text-red-600 font-bold">{season.goalCompleteness.toFixed(1)}%</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <Show when={reportData().recentActivity.length > 0}>
                <div class="bg-white rounded-lg shadow-sm p-6">
                  <h2 class="text-xl font-bold text-gray-900 mb-4">Recent Data Activity</h2>
                  <div class="space-y-3">
                    <For each={reportData().recentActivity}>
                      {(activity) => (
                        <div class="border-l-4 border-blue-500 pl-4 py-2">
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-medium text-gray-900">{activity.activity}</p>
                              <p class="text-sm text-gray-600">{activity.details}</p>
                              <p class="text-xs text-gray-500">{activity.season} • {activity.source}</p>
                            </div>
                            <div class="text-right text-sm">
                              <div class="font-medium text-green-600">+{activity.goalsAdded} goals</div>
                              <div class="text-gray-500">{formatDate(activity.date)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>

              {/* Footer */}
              <div class="text-center text-gray-500 text-sm mt-8">
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