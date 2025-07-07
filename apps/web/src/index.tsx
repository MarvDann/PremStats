import { render } from 'solid-js/web'
import { Router, Route } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import './index.css'
import Layout from './components/Layout'
import HomePage from './pages/Home'
import TeamsPage from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import PlayersPage from './pages/Players'
import MatchesPage from './pages/Matches'
import StatsPage from './pages/Stats'
import { initializeCurrentSeason } from './utils/seasonStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always consider data stale
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
})

// Initialize the current season when the app starts
initializeCurrentSeason()

const root = document.getElementById('root')

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?'
  )
}

render(() => (
  <QueryClientProvider client={queryClient}>
    <Router root={Layout}>
      <Route path="/" component={HomePage} />
      <Route path="/teams" component={TeamsPage} />
      <Route path="/teams/:id" component={TeamDetail} />
      <Route path="/players" component={PlayersPage} />
      <Route path="/matches" component={MatchesPage} />
      <Route path="/stats" component={StatsPage} />
    </Router>
  </QueryClientProvider>
), root!)