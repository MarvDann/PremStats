import type { Component } from 'solid-js'
import { Route, Routes } from '@solidjs/router'
import Layout from './components/Layout'
import HomePage from './pages/Home'
import TeamsPage from './pages/Teams'
import PlayersPage from './pages/Players'
import MatchesPage from './pages/Matches'
import StatsPage from './pages/Stats'

const App: Component = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" component={HomePage} />
        <Route path="/teams" component={TeamsPage} />
        <Route path="/players" component={PlayersPage} />
        <Route path="/matches" component={MatchesPage} />
        <Route path="/stats" component={StatsPage} />
      </Routes>
    </Layout>
  )
}

export default App