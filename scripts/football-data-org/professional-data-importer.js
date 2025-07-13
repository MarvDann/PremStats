#!/usr/bin/env node

import FootballDataOrgClient from './api-client.js'
import pkg from 'pg'
const { Pool } = pkg

class ProfessionalDataImporter {
  constructor() {
    this.apiClient = new FootballDataOrgClient()
    this.pool = new Pool({
      user: 'premstats',
      host: 'localhost',
      database: 'premstats',
      password: 'premstats',
      port: 5432,
    })
  }

  async importSeasonGoals(season) {
    const client = await this.pool.connect()
    
    try {
      console.log(`🏆 IMPORTING PROFESSIONAL DATA FOR ${season}`)
      console.log('==========================================')
      
      // Get season matches from API
      const matchesData = await this.apiClient.getSeasonMatches(season)
      const matches = matchesData.matches || []
      
      console.log(`📊 Found ${matches.length} matches for ${season} season`)
      
      let importedGoals = 0
      let processedMatches = 0
      
      for (const apiMatch of matches) {
        try {
          // Get our internal match ID
          const dbMatch = await this.findMatchInDatabase(client, apiMatch)
          
          if (!dbMatch) {
            console.log(`⚠️ Match not found in database: ${apiMatch.homeTeam?.name} vs ${apiMatch.awayTeam?.name}`)
            continue
          }
          
          // Get detailed match events from API
          const matchEvents = await this.apiClient.getMatchEvents(apiMatch.id)
          
          // Import goals for this match
          const goalCount = await this.importMatchGoals(client, dbMatch.id, matchEvents.goals)
          importedGoals += goalCount
          processedMatches++
          
          console.log(`✅ Match ${processedMatches}: ${apiMatch.homeTeam?.name} vs ${apiMatch.awayTeam?.name} - ${goalCount} goals`)
          
        } catch (error) {
          console.error(`❌ Error processing match ${apiMatch.id}:`, error.message)
        }
      }
      
      console.log(`\n🎉 IMPORT COMPLETE!`)
      console.log(`📈 Processed: ${processedMatches}/${matches.length} matches`)
      console.log(`⚽ Imported: ${importedGoals} professional-quality goals`)
      console.log(`🎯 Data source: football-data.org (verified)`)
      
    } finally {
      client.release()
    }
  }

  async findMatchInDatabase(client, apiMatch) {
    // Match by team names and date
    const query = `
      SELECT m.id, m.home_team_id, m.away_team_id, 
             ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE ht.name = $1 AND at.name = $2
        AND m.match_date::date = $3::date
    `
    
    const matchDate = new Date(apiMatch.utcDate).toISOString().split('T')[0]
    const result = await client.query(query, [
      apiMatch.homeTeam?.name,
      apiMatch.awayTeam?.name, 
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
        // Find player in our database
        const player = await this.findOrCreatePlayer(client, goal.scorer)
        
        // Determine team (home/away)
        const teamId = await this.determineTeamId(client, matchId, goal.team?.name)
        
        // Insert goal with professional data
        await client.query(`
          INSERT INTO goals (
            match_id, player_id, team_id, minute, 
            is_penalty, import_source, data_quality,
            football_data_org_id, import_timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          matchId,
          player?.id,
          teamId,
          goal.minute,
          goal.type === 'Penalty',
          'football-data.org',
          'verified',
          goal.id || null
        ])
        
        importedCount++
        
      } catch (error) {
        console.error(`❌ Error importing goal:`, error.message, goal)
      }
    }

    return importedCount
  }

  async findOrCreatePlayer(client, scorerInfo) {
    if (!scorerInfo?.name) return null
    
    // Try to find existing player
    const existing = await client.query(
      'SELECT id FROM players WHERE name = $1',
      [scorerInfo.name]
    )
    
    if (existing.rows.length > 0) {
      return existing.rows[0]
    }
    
    // Create new player
    const newPlayer = await client.query(`
      INSERT INTO players (name, position, nationality, import_source)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [
      scorerInfo.name,
      null, // Position not in goal data
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
    
    if (matchData.home_team === teamName) {
      return matchData.home_team_id
    } else if (matchData.away_team === teamName) {
      return matchData.away_team_id
    }
    
    console.warn(`⚠️ Team name mismatch: ${teamName} not found in ${matchData.home_team} vs ${matchData.away_team}`)
    return null
  }

  async validateImport(season) {
    const client = await this.pool.connect()
    
    try {
      console.log(`\n🔍 VALIDATING IMPORTED DATA FOR ${season}`)
      console.log('==========================================')
      
      // Get matches for this season from our database
      const seasonMatches = await client.query(`
        SELECT m.id, ht.name as home_team, at.name as away_team,
               m.home_score, m.away_score, m.match_date,
               COUNT(g.id) as goals_imported
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN seasons s ON m.season_id = s.id
        LEFT JOIN goals g ON m.id = g.match_id AND g.import_source = 'football-data.org'
        WHERE s.name = $1
        GROUP BY m.id, ht.name, at.name, m.home_score, m.away_score, m.match_date
        ORDER BY m.match_date
        LIMIT 10
      `, [season])
      
      console.log(`\nSample matches with imported goals:`)
      for (const match of seasonMatches.rows) {
        const expectedGoals = (match.home_score || 0) + (match.away_score || 0)
        const status = match.goals_imported === expectedGoals ? '✅' : '⚠️'
        console.log(`${status} ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | Expected: ${expectedGoals}, Imported: ${match.goals_imported}`)
      }
      
      // Overall statistics
      const stats = await client.query(`
        SELECT 
          COUNT(m.id) as total_matches,
          SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)) as expected_goals,
          COUNT(g.id) as imported_goals,
          ROUND((COUNT(g.id)::numeric / NULLIF(SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)), 0)) * 100, 1) as completeness_pct
        FROM matches m
        JOIN seasons s ON m.season_id = s.id
        LEFT JOIN goals g ON m.id = g.match_id AND g.import_source = 'football-data.org'
        WHERE s.name = $1
      `, [season])
      
      const stat = stats.rows[0]
      console.log(`\n📊 SEASON STATISTICS:`)
      console.log(`Total matches: ${stat.total_matches}`)
      console.log(`Expected goals: ${stat.expected_goals}`)
      console.log(`Imported goals: ${stat.imported_goals}`)
      console.log(`Completeness: ${stat.completeness_pct}%`)
      
      if (parseFloat(stat.completeness_pct) > 90) {
        console.log(`🎉 EXCELLENT! Professional data quality achieved`)
      } else if (parseFloat(stat.completeness_pct) > 70) {
        console.log(`✅ Good quality - minor gaps expected`)
      } else {
        console.log(`⚠️ Quality below expectations - investigate`)
      }
      
    } finally {
      client.release()
    }
  }

  async close() {
    await this.pool.end()
  }
}

export default ProfessionalDataImporter

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new ProfessionalDataImporter()
  
  const command = process.argv[2]
  const season = process.argv[3] || '2023'
  
  try {
    switch (command) {
      case 'import':
        await importer.importSeasonGoals(season)
        break
      case 'validate':
        await importer.validateImport(season)
        break
      case 'test':
        console.log('🧪 Testing API connection...')
        const connected = await importer.apiClient.testConnection()
        if (connected) {
          console.log('✅ Ready to import professional data!')
        }
        break
      default:
        console.log('Usage: node professional-data-importer.js [import|validate|test] [season]')
        console.log('Examples:')
        console.log('  node professional-data-importer.js test')
        console.log('  node professional-data-importer.js import 2023')
        console.log('  node professional-data-importer.js validate 2023')
    }
  } catch (error) {
    console.error('❌ Import failed:', error.message)
  } finally {
    await importer.close()
  }
}