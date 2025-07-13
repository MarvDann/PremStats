#!/usr/bin/env node

import { FootballDataClient } from '../../agents/data/football-data-client.js'
import dotenv from 'dotenv'
import pkg from 'pg'
const { Pool } = pkg

// Load environment variables from .env file in project root
dotenv.config({ path: '../../.env' })

class EnhancedDataImporter {
  constructor() {
    // Use existing football-data client with updated rate limiting for paid tier
    this.apiClient = new FootballDataClient()
    // Override rate limiting for 30 requests per minute (paid tier)
    this.apiClient.rateLimitMs = 2100 // 2.1 seconds between requests for safety
    
    this.pool = new Pool({
      user: 'premstats',
      host: 'localhost',
      database: 'premstats',
      password: 'premstats',
      port: 5432,
    })
  }

  // Override the request method to use proper rate limiting for paid tier
  async enhancedRequest(endpoint) {
    // Rate limiting: 30 requests per minute = 2 second intervals
    const now = Date.now()
    const timeSinceLastRequest = now - this.apiClient.lastRequestTime
    if (timeSinceLastRequest < this.apiClient.rateLimitMs) {
      const waitTime = this.apiClient.rateLimitMs - timeSinceLastRequest
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    return await this.apiClient.request(endpoint)
  }

  async testConnection() {
    try {
      console.log('🧪 Testing football-data.org API connection with existing key...')
      const competition = await this.apiClient.getCompetition()
      console.log(`✅ Connected! Premier League: ${competition.name}`)
      console.log(`📅 Current season: ${competition.currentSeason?.startDate} - ${competition.currentSeason?.endDate}`)
      
      // Test recent matches with enhanced rate limiting
      const recentMatches = await this.enhancedRequest('/competitions/PL/matches?status=FINISHED&limit=5')
      console.log(`📊 Recent matches available: ${recentMatches.matches?.length || 0}`)
      
      if (recentMatches.matches?.length > 0) {
        console.log('Sample match:', recentMatches.matches[0].homeTeam.name, 'vs', recentMatches.matches[0].awayTeam.name)
      }
      
      return true
    } catch (error) {
      console.error('❌ API connection failed:', error.message)
      return false
    }
  }

  async getHistoricalSeasons() {
    try {
      console.log('📅 Fetching available historical seasons...')
      const competition = await this.apiClient.getCompetition()
      
      if (competition.seasons) {
        console.log(`Found ${competition.seasons.length} seasons available:`)
        for (const season of competition.seasons) {
          const startYear = new Date(season.startDate).getFullYear()
          const endYear = new Date(season.endDate).getFullYear()
          console.log(`  ${startYear}/${endYear} - ID: ${season.id}`)
        }
        return competition.seasons
      }
      
      return []
    } catch (error) {
      console.error('❌ Error fetching seasons:', error.message)
      return []
    }
  }

  async importSeasonGoals(seasonYear) {
    const client = await this.pool.connect()
    
    try {
      console.log(`🏆 IMPORTING PROFESSIONAL DATA FOR ${seasonYear} SEASON`)
      console.log('=======================================================')
      
      // Get matches for this season
      const endpoint = `/competitions/PL/matches?season=${seasonYear}`
      const matchesData = await this.enhancedRequest(endpoint)
      const matches = matchesData.matches || []
      
      console.log(`📊 Found ${matches.length} matches for ${seasonYear} season`)
      
      let importedGoals = 0
      let processedMatches = 0
      let matchedMatches = 0
      
      for (const apiMatch of matches) {
        try {
          // Get our internal match ID by matching teams and date
          const dbMatch = await this.findMatchInDatabase(client, apiMatch)
          
          if (!dbMatch) {
            console.log(`⚠️ No database match found: ${apiMatch.homeTeam?.name} vs ${apiMatch.awayTeam?.name} on ${new Date(apiMatch.utcDate).toDateString()}`)
            continue
          }
          
          matchedMatches++
          
          // Get detailed match information which includes goals
          const matchDetail = await this.enhancedRequest(`/matches/${apiMatch.id}`)
          
          // Import goals from the detailed match data
          if (matchDetail.goals && matchDetail.goals.length > 0) {
            const goalCount = await this.importMatchGoals(client, dbMatch.id, matchDetail.goals)
            importedGoals += goalCount
            console.log(`✅ ${apiMatch.homeTeam?.name} ${matchDetail.score?.fullTime?.home}-${matchDetail.score?.fullTime?.away} ${apiMatch.awayTeam?.name} - ${goalCount} goals`)
          } else {
            console.log(`📍 ${apiMatch.homeTeam?.name} ${matchDetail.score?.fullTime?.home}-${matchDetail.score?.fullTime?.away} ${apiMatch.awayTeam?.name} - no goals`)
          }
          
          processedMatches++
          
        } catch (error) {
          console.error(`❌ Error processing match ${apiMatch.id}:`, error.message)
        }
      }
      
      console.log(`\\n🎉 IMPORT COMPLETE!`)
      console.log(`📈 API matches found: ${matches.length}`)
      console.log(`🔗 Database matches matched: ${matchedMatches}`)
      console.log(`✅ Matches processed: ${processedMatches}`)
      console.log(`⚽ Goals imported: ${importedGoals}`)
      console.log(`🎯 Data source: football-data.org (verified professional data)`)
      
      // Run validation
      await this.validateImport(client, seasonYear)
      
    } finally {
      client.release()
    }
  }

  async findMatchInDatabase(client, apiMatch) {
    // Try exact team name matching first
    let query = `
      SELECT m.id, m.home_team_id, m.away_team_id, 
             ht.name as home_team, at.name as away_team,
             m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE ht.name = $1 AND at.name = $2
        AND m.match_date::date = $3::date
    `
    
    const matchDate = new Date(apiMatch.utcDate).toISOString().split('T')[0]
    let result = await client.query(query, [
      apiMatch.homeTeam?.name,
      apiMatch.awayTeam?.name, 
      matchDate
    ])
    
    if (result.rows.length > 0) {
      return result.rows[0]
    }
    
    // Try fuzzy matching for team names (handle slight variations)
    query = `
      SELECT m.id, m.home_team_id, m.away_team_id, 
             ht.name as home_team, at.name as away_team,
             m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE (ht.name ILIKE $1 OR ht.name ILIKE $2) 
        AND (at.name ILIKE $3 OR at.name ILIKE $4)
        AND ABS(EXTRACT(EPOCH FROM (m.match_date::date - $5::date))/86400) <= 1
    `
    
    result = await client.query(query, [
      `%${apiMatch.homeTeam?.name.split(' ')[0]}%`,
      `%${apiMatch.homeTeam?.shortName || apiMatch.homeTeam?.tla}%`,
      `%${apiMatch.awayTeam?.name.split(' ')[0]}%`, 
      `%${apiMatch.awayTeam?.shortName || apiMatch.awayTeam?.tla}%`,
      matchDate
    ])
    
    return result.rows[0] || null
  }

  async importMatchGoals(client, matchId, apiGoals) {
    if (!apiGoals || apiGoals.length === 0) {
      return 0
    }

    let importedCount = 0

    for (const goal of apiGoals) {
      try {
        // Find or create player
        const player = await this.findOrCreatePlayer(client, goal.scorer)
        
        // Determine team (home/away) 
        const teamId = await this.determineTeamId(client, matchId, goal.team?.name)
        
        // Insert goal with professional data quality
        await client.query(`
          INSERT INTO goals (
            match_id, player_id, team_id, minute, 
            is_penalty, import_source, data_quality,
            import_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT DO NOTHING
        `, [
          matchId,
          player?.id,
          teamId,
          goal.minute,
          goal.type === 'Penalty',
          'football-data.org',
          'verified'
        ])
        
        importedCount++
        
      } catch (error) {
        console.error(`❌ Error importing goal:`, error.message)
      }
    }

    return importedCount
  }

  async findOrCreatePlayer(client, scorerInfo) {
    if (!scorerInfo?.name) return null
    
    // Try to find existing player (exact match)
    let existing = await client.query(
      'SELECT id FROM players WHERE name = $1',
      [scorerInfo.name]
    )
    
    if (existing.rows.length > 0) {
      return existing.rows[0]
    }
    
    // Try fuzzy match for similar names
    existing = await client.query(
      'SELECT id, name FROM players WHERE name ILIKE $1 ORDER BY name LIMIT 1',
      [`%${scorerInfo.name.split(' ').pop()}%`] // Match on last name
    )
    
    if (existing.rows.length > 0) {
      console.log(`🔗 Fuzzy matched: ${scorerInfo.name} → ${existing.rows[0].name}`)
      return existing.rows[0]
    }
    
    // Create new player
    const newPlayer = await client.query(`
      INSERT INTO players (name, position, nationality, import_source)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [
      scorerInfo.name,
      null, // Position not available in goal data
      scorerInfo.nationality || null,
      'football-data.org'
    ])
    
    console.log(`👤 Created new player: ${scorerInfo.name}`)
    return newPlayer.rows[0]
  }

  async determineTeamId(client, matchId, teamName) {
    const match = await client.query(`
      SELECT m.home_team_id, m.away_team_id,
             ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [matchId])
    
    if (match.rows.length === 0) return null
    
    const matchData = match.rows[0]
    
    // Exact match
    if (matchData.home_team === teamName) {
      return matchData.home_team_id
    } else if (matchData.away_team === teamName) {
      return matchData.away_team_id
    }
    
    // Fuzzy match
    if (matchData.home_team.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(matchData.home_team.toLowerCase())) {
      return matchData.home_team_id
    } else if (matchData.away_team.toLowerCase().includes(teamName.toLowerCase()) ||
               teamName.toLowerCase().includes(matchData.away_team.toLowerCase())) {
      return matchData.away_team_id
    }
    
    console.warn(`⚠️ Team name mismatch: "${teamName}" not matched in ${matchData.home_team} vs ${matchData.away_team}`)
    return null
  }

  async validateImport(client, seasonYear) {
    console.log(`\\n🔍 VALIDATION REPORT FOR ${seasonYear}`)
    console.log('========================================')
    
    // Get season statistics
    const stats = await client.query(`
      SELECT 
        COUNT(m.id) as total_matches,
        SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)) as expected_goals,
        COUNT(g.id) as imported_goals,
        ROUND((COUNT(g.id)::numeric / NULLIF(SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)), 0)) * 100, 1) as completeness_pct
      FROM matches m
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id AND g.import_source = 'football-data.org'
      WHERE EXTRACT(YEAR FROM s.start_date) = $1
    `, [seasonYear])
    
    const stat = stats.rows[0]
    console.log(`📊 STATISTICS:`)
    console.log(`   Total matches: ${stat.total_matches}`)
    console.log(`   Expected goals: ${stat.expected_goals}`)
    console.log(`   Imported goals: ${stat.imported_goals}`)
    console.log(`   Completeness: ${stat.completeness_pct}%`)
    
    const completeness = parseFloat(stat.completeness_pct) || 0
    if (completeness >= 95) {
      console.log(`🎉 EXCELLENT! Professional data quality achieved`)
    } else if (completeness >= 80) {
      console.log(`✅ Good quality - some gaps expected for older seasons`)
    } else if (completeness >= 50) {
      console.log(`⚠️ Moderate quality - needs investigation`)
    } else {
      console.log(`❌ Poor quality - major issues detected`)
    }
  }

  async close() {
    await this.pool.end()
  }
}

export default EnhancedDataImporter

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new EnhancedDataImporter()
  
  const command = process.argv[2]
  const season = process.argv[3] || '2023'
  
  try {
    switch (command) {
      case 'test':
        console.log('🧪 Testing API connection with existing credentials...')
        const connected = await importer.testConnection()
        if (connected) {
          console.log('✅ Ready to import professional data!')
        }
        break
        
      case 'seasons':
        await importer.getHistoricalSeasons()
        break
        
      case 'import':
        await importer.importSeasonGoals(season)
        break
        
      case 'import-1992':
        console.log('🏆 IMPORTING HISTORIC 1992/93 SEASON')
        await importer.importSeasonGoals(1992)
        break
        
      default:
        console.log('Usage: node enhanced-data-importer.js [test|seasons|import|import-1992] [season]')
        console.log('Examples:')
        console.log('  node enhanced-data-importer.js test')
        console.log('  node enhanced-data-importer.js seasons')
        console.log('  node enhanced-data-importer.js import 2023')
        console.log('  node enhanced-data-importer.js import-1992')
    }
  } catch (error) {
    console.error('❌ Import failed:', error.message)
  } finally {
    await importer.close()
  }
}