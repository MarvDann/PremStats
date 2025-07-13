#!/usr/bin/env node

import { FootballDataClient } from '../../agents/data/football-data-client.js'
import dotenv from 'dotenv'
import pkg from 'pg'
const { Pool } = pkg

// Load environment variables from .env file in project root
dotenv.config({ path: '../../.env' })

class FixedProfessionalImporter {
  constructor() {
    // Use existing football-data client with updated rate limiting for paid tier
    this.apiClient = new FootballDataClient()
    // Override rate limiting for 30 requests per minute (paid tier)
    this.apiClient.rateLimitMs = 3000 // 3 seconds between requests for stability
    
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
    // Rate limiting: 30 requests per minute = 3 second intervals for stability
    const now = Date.now()
    const timeSinceLastRequest = now - this.apiClient.lastRequestTime
    if (timeSinceLastRequest < this.apiClient.rateLimitMs) {
      const waitTime = this.apiClient.rateLimitMs - timeSinceLastRequest
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    return await this.apiClient.request(endpoint)
  }

  async importSeasonGoals(apiYear) {
    const client = await this.pool.connect()
    
    try {
      console.log(`🏆 IMPORTING PROFESSIONAL DATA FOR ${apiYear} SEASON`)
      console.log('=======================================================')
      
      // Map API year to our database season name
      const seasonName = `${apiYear}/${(parseInt(apiYear) + 1).toString().slice(-2)}`
      console.log(`📋 Mapping: API year ${apiYear} → Database season "${seasonName}"`)
      
      // Find the season in our database
      const seasonQuery = await client.query('SELECT id, name FROM seasons WHERE name = $1', [seasonName])
      if (seasonQuery.rows.length === 0) {
        console.log(`❌ Season "${seasonName}" not found in database`)
        return
      }
      
      const dbSeason = seasonQuery.rows[0]
      console.log(`✅ Found database season: ID ${dbSeason.id}, Name: ${dbSeason.name}`)
      
      // Get season matches from API
      const endpoint = `/competitions/PL/matches?season=${apiYear}`
      const matchesData = await this.enhancedRequest(endpoint)
      const matches = matchesData.matches || []
      
      console.log(`📊 Found ${matches.length} matches for ${apiYear} season from API`)
      
      let importedGoals = 0
      let processedMatches = 0
      let matchedMatches = 0
      let failedMatches = 0
      
      for (const apiMatch of matches) {
        try {
          // Get our internal match ID by matching teams and date
          const dbMatch = await this.findMatchInDatabase(client, apiMatch, dbSeason.id)
          
          if (!dbMatch) {
            console.log(`⚠️ No database match found: ${apiMatch.homeTeam?.name} vs ${apiMatch.awayTeam?.name} on ${new Date(apiMatch.utcDate).toDateString()}`)
            failedMatches++
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
            console.log(`📍 ${apiMatch.homeTeam?.name} ${matchDetail.score?.fullTime?.home || 0}-${matchDetail.score?.fullTime?.away || 0} ${apiMatch.awayTeam?.name} - no goals`)
          }
          
          processedMatches++
          
        } catch (error) {
          console.error(`❌ Error processing match ${apiMatch.id}:`, error.message)
          failedMatches++
        }
      }
      
      console.log(`\\n🎉 IMPORT COMPLETE!`)
      console.log(`📈 API matches found: ${matches.length}`)
      console.log(`🔗 Database matches matched: ${matchedMatches}`)
      console.log(`✅ Matches processed: ${processedMatches}`)
      console.log(`❌ Failed matches: ${failedMatches}`)
      console.log(`⚽ Goals imported: ${importedGoals}`)
      console.log(`🎯 Data source: football-data.org (verified professional data)`)
      
      // Run validation
      await this.validateImport(client, dbSeason.id, seasonName)
      
    } finally {
      client.release()
    }
  }

  async findMatchInDatabase(client, apiMatch, seasonId) {
    // Team name mapping for consistent matching
    const teamMappings = {
      'Manchester United FC': 'Manchester United',
      'Manchester City FC': 'Manchester City', 
      'Sheffield United FC': 'Sheffield United',
      'Brighton & Hove Albion FC': 'Brighton & Hove Albion',
      'AFC Bournemouth': 'Bournemouth',
      'West Ham United FC': 'West Ham United',
      'Tottenham Hotspur FC': 'Tottenham',
      'Wolverhampton Wanderers FC': 'Wolverhampton Wanderers',
      'Newcastle United FC': 'Newcastle United',
      'Nottingham Forest FC': 'Nottingham Forest',
      'Crystal Palace FC': 'Crystal Palace',
      'Luton Town FC': 'Luton Town',
      'Arsenal FC': 'Arsenal',
      'Chelsea FC': 'Chelsea',
      'Liverpool FC': 'Liverpool',
      'Everton FC': 'Everton',
      'Fulham FC': 'Fulham',
      'Aston Villa FC': 'Aston Villa',
      'Burnley FC': 'Burnley',
      'Brentford FC': 'Brentford'
    }
    
    const mapTeamName = (apiName) => teamMappings[apiName] || apiName.replace(' FC', '').replace('FC ', '')
    
    const homeTeamMapped = mapTeamName(apiMatch.homeTeam?.name)
    const awayTeamMapped = mapTeamName(apiMatch.awayTeam?.name)
    
    // Try exact team name matching with mapped names
    let query = `
      SELECT m.id, m.home_team_id, m.away_team_id, 
             ht.name as home_team, at.name as away_team,
             m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE ht.name = $1 AND at.name = $2
        AND m.season_id = $3
        AND m.match_date::date = $4::date
    `
    
    const matchDate = new Date(apiMatch.utcDate).toISOString().split('T')[0]
    let result = await client.query(query, [
      homeTeamMapped,
      awayTeamMapped, 
      seasonId,
      matchDate
    ])
    
    if (result.rows.length > 0) {
      return result.rows[0]
    }
    
    // Try with original API names
    result = await client.query(query, [
      apiMatch.homeTeam?.name,
      apiMatch.awayTeam?.name, 
      seasonId,
      matchDate
    ])
    
    if (result.rows.length > 0) {
      return result.rows[0]
    }
    
    console.log(`⚠️ No match found: ${apiMatch.homeTeam?.name} vs ${apiMatch.awayTeam?.name} on ${matchDate}`)
    console.log(`   Tried: ${homeTeamMapped} vs ${awayTeamMapped}`)
    
    return null
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
        
        // Determine team (home/away) - handle own goals correctly
        let teamId
        if (goal.type === 'OWN') {
          // For own goals, the goal should be attributed to the opposing team
          teamId = await this.determineOpposingTeamId(client, matchId, goal.team?.name)
          console.log(`🔄 Own goal: ${goal.scorer?.name} (${goal.team?.name}) → credited to opposing team`)
        } else {
          teamId = await this.determineTeamId(client, matchId, goal.team?.name)
        }
        
        // Insert goal with available columns
        await client.query(`
          INSERT INTO goals (
            match_id, player_id, team_id, minute, is_penalty, is_own_goal
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `, [
          matchId,
          player?.id,
          teamId,
          goal.minute,
          goal.type === 'Penalty',
          goal.type === 'OWN'
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
      'SELECT id, name, current_team_id FROM players WHERE name = $1',
      [scorerInfo.name]
    )
    
    if (existing.rows.length > 0) {
      return existing.rows[0]
    }
    
    // Try improved fuzzy matching - look for close name variants
    const nameVariants = [
      scorerInfo.name,
      scorerInfo.name.replace(/\./g, ''), // Remove dots
      scorerInfo.name.replace(/'/g, ''), // Remove apostrophes
      scorerInfo.name.replace(/-/g, ' '), // Replace hyphens with spaces
    ]
    
    for (const variant of nameVariants) {
      existing = await client.query(
        'SELECT id, name, current_team_id FROM players WHERE name ILIKE $1 LIMIT 1',
        [variant]
      )
      
      if (existing.rows.length > 0) {
        console.log(`🔗 Name variant matched: ${scorerInfo.name} → ${existing.rows[0].name}`)
        return existing.rows[0]
      }
    }
    
    // Try last name matching with higher accuracy requirement
    const lastName = scorerInfo.name.split(' ').pop()
    if (lastName.length > 3) {
      existing = await client.query(
        'SELECT id, name, current_team_id FROM players WHERE name ILIKE $1 ORDER BY name LIMIT 1',
        [`%${lastName}%`]
      )
      
      if (existing.rows.length > 0) {
        // Additional validation - check if first name initial matches
        const apiFirstInitial = scorerInfo.name.charAt(0).toLowerCase()
        const dbFirstInitial = existing.rows[0].name.charAt(0).toLowerCase()
        
        if (apiFirstInitial === dbFirstInitial) {
          console.log(`🔗 Last name + initial matched: ${scorerInfo.name} → ${existing.rows[0].name}`)
          return existing.rows[0]
        }
      }
    }
    
    // Only create new player if no reasonable match found
    const newPlayer = await client.query(`
      INSERT INTO players (name, position, nationality)
      VALUES ($1, $2, $3) RETURNING id
    `, [
      scorerInfo.name,
      null, // Position not available in goal data
      scorerInfo.nationality || null
    ])
    
    console.log(`👤 Created new player: ${scorerInfo.name} (no existing match found)`)
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

  async determineOpposingTeamId(client, matchId, teamName) {
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
    
    // For own goals, return the opposing team ID
    // If the player's team is home team, return away team ID, and vice versa
    if (matchData.home_team === teamName) {
      return matchData.away_team_id
    } else if (matchData.away_team === teamName) {
      return matchData.home_team_id
    }
    
    // Fuzzy match
    if (matchData.home_team.toLowerCase().includes(teamName.toLowerCase()) ||
        teamName.toLowerCase().includes(matchData.home_team.toLowerCase())) {
      return matchData.away_team_id // Return opposing team
    } else if (matchData.away_team.toLowerCase().includes(teamName.toLowerCase()) ||
               teamName.toLowerCase().includes(matchData.away_team.toLowerCase())) {
      return matchData.home_team_id // Return opposing team
    }
    
    console.warn(`⚠️ Own goal team mismatch: "${teamName}" not matched in ${matchData.home_team} vs ${matchData.away_team}`)
    return null
  }

  async validateImport(client, seasonId, seasonName) {
    console.log(`\\n🔍 VALIDATION REPORT FOR ${seasonName}`)
    console.log('========================================')
    
    // Get season statistics - FIXED SQL syntax
    const stats = await client.query(`
      SELECT 
        COUNT(m.id) as total_matches,
        SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)) as expected_goals,
        COUNT(g.id) as imported_goals,
        ROUND((COUNT(g.id)::numeric / NULLIF(SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)), 0)) * 100, 1) as completeness_pct
      FROM matches m
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.season_id = $1
    `, [seasonId])
    
    const stat = stats.rows[0]
    console.log(`📊 STATISTICS:`)
    console.log(`   Total matches: ${stat.total_matches}`)
    console.log(`   Expected goals: ${stat.expected_goals}`)
    console.log(`   Imported goals: ${stat.imported_goals}`)
    console.log(`   Completeness: ${stat.completeness_pct}%`)
    
    // Sample verification
    const sampleMatches = await client.query(`
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        COUNT(g.id) as goals_imported
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.season_id = $1
      GROUP BY m.id, ht.name, at.name, m.home_score, m.away_score
      ORDER BY m.match_date
      LIMIT 10
    `, [seasonId])
    
    console.log(`\\nSample matches with imported goals:`)
    for (const match of sampleMatches.rows) {
      const expectedGoals = (match.home_score || 0) + (match.away_score || 0)
      const status = match.goals_imported === expectedGoals ? '✅' : '⚠️'
      console.log(`${status} ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | Expected: ${expectedGoals}, Imported: ${match.goals_imported}`)
    }
    
    const completeness = parseFloat(stat.completeness_pct) || 0
    if (completeness >= 95) {
      console.log(`\\n🎉 EXCELLENT! Professional data quality achieved`)
    } else if (completeness >= 80) {
      console.log(`\\n✅ Good quality - minor gaps expected`)
    } else if (completeness >= 50) {
      console.log(`\\n⚠️ Moderate quality - needs investigation`)
    } else {
      console.log(`\\n❌ Poor quality - major issues detected`)
    }
  }

  async close() {
    await this.pool.end()
  }
}

export default FixedProfessionalImporter

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new FixedProfessionalImporter()
  
  const command = process.argv[2]
  const season = process.argv[3] || '2023'
  
  try {
    switch (command) {
      case 'import-2023':
        console.log('🏆 IMPORTING 2023/24 SEASON WITH PROFESSIONAL DATA')
        await importer.importSeasonGoals('2023')
        break
        
      case 'import-2024':
        console.log('🏆 IMPORTING 2024/25 SEASON WITH PROFESSIONAL DATA')
        await importer.importSeasonGoals('2024')
        break
        
      case 'import':
        await importer.importSeasonGoals(season)
        break
        
      default:
        console.log('Usage: node fixed-professional-importer.js [import-2023|import-2024|import] [year]')
        console.log('Examples:')
        console.log('  node fixed-professional-importer.js import-2023')
        console.log('  node fixed-professional-importer.js import-2024')
        console.log('  node fixed-professional-importer.js import 2023')
    }
  } catch (error) {
    console.error('❌ Import failed:', error.message)
  } finally {
    await importer.close()
  }
}