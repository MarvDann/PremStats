import type { Meta, StoryObj } from '@storybook/html'
import { render } from 'solid-js/web'
import { DataTable, type Column } from './DataTable'

interface Team {
  position: number
  name: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface Player {
  rank: number
  name: string
  team: string
  goals: number
  assists: number
  appearances: number
}

const teamData: Team[] = [
  { position: 1, name: 'Manchester City', played: 32, won: 24, drawn: 5, lost: 3, goalsFor: 78, goalsAgainst: 29, goalDifference: 49, points: 77 },
  { position: 2, name: 'Arsenal', played: 32, won: 23, drawn: 6, lost: 3, goalsFor: 72, goalsAgainst: 33, goalDifference: 39, points: 75 },
  { position: 3, name: 'Liverpool', played: 32, won: 20, drawn: 8, lost: 4, goalsFor: 71, goalsAgainst: 35, goalDifference: 36, points: 68 },
  { position: 4, name: 'Newcastle', played: 32, won: 17, drawn: 11, lost: 4, goalsFor: 61, goalsAgainst: 30, goalDifference: 31, points: 62 },
  { position: 5, name: 'Manchester United', played: 32, won: 18, drawn: 6, lost: 8, goalsFor: 51, goalsAgainst: 42, goalDifference: 9, points: 60 }
]

const playerData: Player[] = [
  { rank: 1, name: 'Erling Haaland', team: 'Manchester City', goals: 32, assists: 8, appearances: 30 },
  { rank: 2, name: 'Harry Kane', team: 'Tottenham', goals: 28, assists: 3, appearances: 32 },
  { rank: 3, name: 'Ivan Toney', team: 'Brentford', goals: 20, assists: 5, appearances: 32 },
  { rank: 4, name: 'Callum Wilson', team: 'Newcastle', goals: 18, assists: 2, appearances: 28 },
  { rank: 5, name: 'Marcus Rashford', team: 'Manchester United', goals: 17, assists: 5, appearances: 31 }
]

const leagueColumns: Column<Team>[] = [
  {
    key: 'position',
    header: 'Pos',
    accessor: (team) => team.position,
    sortable: true,
    align: 'center',
    width: '60px'
  },
  {
    key: 'name',
    header: 'Team',
    accessor: (team) => team.name,
    sortable: true,
    align: 'left'
  },
  {
    key: 'played',
    header: 'P',
    accessor: (team) => team.played,
    sortable: true,
    align: 'center',
    width: '50px'
  },
  {
    key: 'won',
    header: 'W',
    accessor: (team) => team.won,
    sortable: true,
    align: 'center',
    width: '50px'
  },
  {
    key: 'drawn',
    header: 'D',
    accessor: (team) => team.drawn,
    sortable: true,
    align: 'center',
    width: '50px'
  },
  {
    key: 'lost',
    header: 'L',
    accessor: (team) => team.lost,
    sortable: true,
    align: 'center',
    width: '50px'
  },
  {
    key: 'goalDifference',
    header: 'GD',
    accessor: (team) => team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference.toString(),
    sortable: true,
    align: 'center',
    width: '60px'
  },
  {
    key: 'points',
    header: 'Pts',
    accessor: (team) => team.points,
    sortable: true,
    align: 'center',
    width: '60px'
  }
]

const playerColumns: Column<Player>[] = [
  {
    key: 'rank',
    header: '#',
    accessor: (player) => player.rank,
    align: 'center',
    width: '50px'
  },
  {
    key: 'name',
    header: 'Player',
    accessor: (player) => player.name,
    sortable: true,
    align: 'left'
  },
  {
    key: 'team',
    header: 'Team',
    accessor: (player) => player.team,
    sortable: true,
    align: 'left'
  },
  {
    key: 'goals',
    header: 'Goals',
    accessor: (player) => player.goals,
    sortable: true,
    align: 'center',
    width: '80px'
  },
  {
    key: 'assists',
    header: 'Assists',
    accessor: (player) => player.assists,
    sortable: true,
    align: 'center',
    width: '80px'
  },
  {
    key: 'appearances',
    header: 'Apps',
    accessor: (player) => player.appearances,
    sortable: true,
    align: 'center',
    width: '80px'
  }
]

const meta: Meta = {
  title: 'Components/DataTable',
  parameters: {
    layout: 'fullscreen'
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'striped']
    },
    sortable: {
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const LeagueTable: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Premier League Table</h2>
          <DataTable
            data={teamData}
            columns={leagueColumns}
            sortable={true}
            {...args}
          />
        </div>
      ),
      container
    )
    return container
  }
}

export const TopScorers: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Top Scorers</h2>
          <DataTable
            data={playerData}
            columns={playerColumns}
            sortable={true}
            {...args}
          />
        </div>
      ),
      container
    )
    return container
  }
}

export const Striped: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Striped Table</h2>
          <DataTable
            variant="striped"
            data={teamData}
            columns={leagueColumns}
            sortable={true}
            {...args}
          />
        </div>
      ),
      container
    )
    return container
  }
}

export const NonSortable: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Non-Sortable Table</h2>
          <DataTable
            data={teamData}
            columns={leagueColumns}
            sortable={false}
            {...args}
          />
        </div>
      ),
      container
    )
    return container
  }
}

export const ResponsiveTable: Story = {
  render: (args) => {
    const container = document.createElement('div')
    render(
      () => (
        <div class="p-6">
          <h2 class="text-2xl font-bold mb-4">Responsive Table</h2>
          <div class="max-w-sm mx-auto border rounded">
            <DataTable
              data={teamData.slice(0, 3)}
              columns={leagueColumns}
              sortable={true}
              {...args}
            />
          </div>
        </div>
      ),
      container
    )
    return container
  }
}