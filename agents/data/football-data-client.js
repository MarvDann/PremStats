import fetch from 'node-fetch'
import chalk from 'chalk'

export class FootballDataClient {
  constructor(apiKey = null) {
    this.baseUrl = 'https://api.football-data.org/v4'
    this.apiKey = apiKey || process.env.FOOTBALL_DATA_API_KEY
    this.premierLeagueCode = 'PL'
    this.requestCount = 0
    this.lastRequestTime = Date.now()
  }

  async request(endpoint) {
    // Rate limiting: 10 requests per minute for free tier
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < 6000) { // 6 seconds between requests
      const waitTime = 6000 - timeSinceLastRequest
      console.log(chalk.gray(`Rate limiting: waiting ${waitTime}ms`))
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log(chalk.gray(`API Request: ${url}`))

    const headers = {
      'X-Auth-Token': this.apiKey || ''
    }

    try {
      const response = await fetch(url, { headers })
      this.lastRequestTime = Date.now()
      this.requestCount++

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API Error (${response.status}): ${error}`)
      }

      return await response.json()
    } catch (error) {
      console.error(chalk.red(`API Request failed: ${error.message}`))
      throw error
    }
  }

  // Get Premier League competition info
  async getCompetition() {
    return await this.request(`/competitions/${this.premierLeagueCode}`)
  }

  // Get current season standings
  async getStandings() {
    const data = await this.request(`/competitions/${this.premierLeagueCode}/standings`)
    return data.standings?.[0]?.table || []
  }

  // Get teams in Premier League
  async getTeams() {
    const data = await this.request(`/competitions/${this.premierLeagueCode}/teams`)
    return data.teams || []
  }

  // Get matches (with optional matchday filter)
  async getMatches(matchday = null) {
    let endpoint = `/competitions/${this.premierLeagueCode}/matches`
    if (matchday) {
      endpoint += `?matchday=${matchday}`
    }
    const data = await this.request(endpoint)
    return data.matches || []
  }

  // Get specific match details
  async getMatch(matchId) {
    return await this.request(`/matches/${matchId}`)
  }

  // Get team details including squad
  async getTeam(teamId) {
    return await this.request(`/teams/${teamId}`)
  }

  // Get top scorers
  async getTopScorers() {
    const data = await this.request(`/competitions/${this.premierLeagueCode}/scorers`)
    return data.scorers || []
  }

  // Transform API data to our database format
  transformTeam(apiTeam) {
    return {
      external_id: apiTeam.id,
      name: apiTeam.name,
      short_name: apiTeam.tla || apiTeam.shortName,
      stadium: apiTeam.venue,
      founded: apiTeam.founded,
      crest_url: apiTeam.crest,
      website: apiTeam.website,
      colors: apiTeam.clubColors
    }
  }

  transformMatch(apiMatch) {
    return {
      external_id: apiMatch.id,
      home_team_id: apiMatch.homeTeam.id,
      away_team_id: apiMatch.awayTeam.id,
      date: apiMatch.utcDate,
      matchday: apiMatch.matchday,
      status: apiMatch.status,
      home_score: apiMatch.score?.fullTime?.home,
      away_score: apiMatch.score?.fullTime?.away,
      half_time_home: apiMatch.score?.halfTime?.home,
      half_time_away: apiMatch.score?.halfTime?.away,
      referee: apiMatch.referees?.[0]?.name,
      attendance: apiMatch.attendance
    }
  }

  transformStanding(standing, seasonId) {
    return {
      team_id: standing.team.id,
      season_id: seasonId,
      position: standing.position,
      played: standing.playedGames,
      won: standing.won,
      drawn: standing.draw,
      lost: standing.lost,
      goals_for: standing.goalsFor,
      goals_against: standing.goalsAgainst,
      goal_difference: standing.goalDifference,
      points: standing.points,
      form: standing.form,
      date: new Date().toISOString()
    }
  }

  transformPlayer(apiPlayer, teamId) {
    return {
      external_id: apiPlayer.id,
      name: apiPlayer.name,
      position: apiPlayer.position,
      date_of_birth: apiPlayer.dateOfBirth,
      nationality: apiPlayer.nationality,
      shirt_number: apiPlayer.shirtNumber,
      team_id: teamId
    }
  }
}