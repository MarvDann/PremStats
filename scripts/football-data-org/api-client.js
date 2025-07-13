#!/usr/bin/env node

// Using native fetch (Node.js 18+)

class FootballDataOrgClient {
  constructor() {
    this.baseUrl = 'https://api.football-data.org/v4'
    this.apiKey = process.env.FOOTBALL_DATA_ORG_API_KEY
    this.rateLimit = 30 // requests per minute
    this.requestQueue = []
    this.isProcessing = false
    
    if (!this.apiKey) {
      throw new Error('FOOTBALL_DATA_ORG_API_KEY environment variable is required')
    }
  }

  async apiCall(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, options, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.requestQueue.length > 0) {
      const { endpoint, options, resolve, reject } = this.requestQueue.shift()
      
      try {
        const response = await this.makeRequest(endpoint, options)
        resolve(response)
      } catch (error) {
        reject(error)
      }

      // Rate limiting: 30 requests per minute = 2 second intervals
      await this.sleep(2100) // Slightly over 2 seconds for safety
    }

    this.isProcessing = false
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const config = {
      method: 'GET',
      headers: {
        'X-Auth-Token': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    console.log(`🌐 API Request: ${endpoint}`)
    
    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ API Success: ${endpoint}`)
      return data
      
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error.message)
      throw error
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get Premier League competition info
  async getPremierLeagueCompetition() {
    return await this.apiCall('/competitions/PL')
  }

  // Get all seasons for Premier League
  async getPremierLeagueSeasons() {
    const competition = await this.getPremierLeagueCompetition()
    return competition.seasons || []
  }

  // Get matches for a specific season
  async getSeasonMatches(seasonId) {
    return await this.apiCall(`/competitions/PL/matches?season=${seasonId}`)
  }

  // Get detailed match information including events
  async getMatchDetails(matchId) {
    return await this.apiCall(`/matches/${matchId}`)
  }

  // Get current season matches
  async getCurrentSeasonMatches() {
    return await this.apiCall('/competitions/PL/matches')
  }

  // Get match events and statistics
  async getMatchEvents(matchId) {
    const match = await this.getMatchDetails(matchId)
    return {
      match: match,
      goals: match.goals || [],
      bookings: match.bookings || [],
      substitutions: match.substitutions || []
    }
  }

  // Test API connection and permissions
  async testConnection() {
    try {
      console.log('🧪 Testing football-data.org API connection...')
      const competition = await this.getPremierLeagueCompetition()
      console.log(`✅ Connected! Premier League: ${competition.name}`)
      console.log(`📅 Current season: ${competition.currentSeason?.startDate} - ${competition.currentSeason?.endDate}`)
      
      // Test recent matches
      const recentMatches = await this.apiCall('/competitions/PL/matches?status=FINISHED&limit=5')
      console.log(`📊 Recent matches available: ${recentMatches.matches?.length || 0}`)
      
      return true
    } catch (error) {
      console.error('❌ API connection failed:', error.message)
      return false
    }
  }

  // Get available historical seasons
  async getAvailableSeasons() {
    try {
      const seasons = await this.getPremierLeagueSeasons()
      return seasons.map(season => ({
        id: season.id,
        startDate: season.startDate,
        endDate: season.endDate,
        currentMatchday: season.currentMatchday
      }))
    } catch (error) {
      console.error('Error fetching seasons:', error.message)
      return []
    }
  }
}

export default FootballDataOrgClient

// CLI usage for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new FootballDataOrgClient()
  
  const command = process.argv[2]
  
  switch (command) {
    case 'test':
      await client.testConnection()
      break
    case 'seasons':
      const seasons = await client.getAvailableSeasons()
      console.log('Available seasons:', seasons)
      break
    case 'recent':
      const matches = await client.getCurrentSeasonMatches()
      console.log(`Recent matches: ${matches.matches?.length || 0}`)
      if (matches.matches?.length > 0) {
        console.log('Sample match:', matches.matches[0])
      }
      break
    default:
      console.log('Usage: node api-client.js [test|seasons|recent]')
  }
}