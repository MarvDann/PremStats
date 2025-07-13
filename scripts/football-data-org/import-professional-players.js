#!/usr/bin/env node

import { FootballDataClient } from '../../agents/data/football-data-client.js'
import dotenv from 'dotenv'
import pkg from 'pg'
const { Pool } = pkg

// Load environment variables from .env file in project root
dotenv.config({ path: '../../.env' })

class ProfessionalPlayerImporter {
  constructor() {
    this.apiClient = new FootballDataClient()
    // Conservative rate limiting for stability
    this.apiClient.rateLimitMs = 3000 // 3 seconds between requests
    
    this.pool = new Pool({
      user: 'premstats',
      host: 'localhost',
      database: 'premstats',
      password: 'premstats',
      port: 5432,
    })
  }

  async enhancedRequest(endpoint) {
    // Rate limiting: 20 requests per minute = 3 second intervals
    const now = Date.now()
    const timeSinceLastRequest = now - this.apiClient.lastRequestTime
    if (timeSinceLastRequest < this.apiClient.rateLimitMs) {
      const waitTime = this.apiClient.rateLimitMs - timeSinceLastRequest
      console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    return await this.apiClient.request(endpoint)
  }

  async importAllCurrentPlayers(season = '2023') {
    const client = await this.pool.connect()
    
    try {
      console.log(`👥 IMPORTING ALL PREMIER LEAGUE PLAYERS FOR ${season} SEASON`)
      console.log('=============================================================')
      
      // Get all Premier League teams for the season
      const teamsData = await this.enhancedRequest(`/competitions/PL/teams?season=${season}`)
      const teams = teamsData.teams || []
      
      console.log(`🏆 Found ${teams.length} Premier League teams`)
      
      let totalPlayersImported = 0
      let totalPlayersUpdated = 0
      let teamsProcessed = 0
      
      for (const apiTeam of teams) {
        try {
          console.log(`\\n🔍 Processing ${apiTeam.name}...`)
          
          // Find corresponding team in our database
          const dbTeam = await this.findTeamInDatabase(client, apiTeam)
          if (!dbTeam) {
            console.log(`⚠️ Team not found in database: ${apiTeam.name}`)
            continue
          }
          
          console.log(`✅ Matched: ${apiTeam.name} → ${dbTeam.name} (ID: ${dbTeam.id})`)
          
          // Get detailed team information including squad
          const teamDetail = await this.enhancedRequest(`/teams/${apiTeam.id}`)
          const squad = teamDetail.squad || []
          
          console.log(`👥 Squad size: ${squad.length} players`)
          
          let playersImported = 0
          let playersUpdated = 0
          
          for (const player of squad) {
            try {
              const result = await this.importOrUpdatePlayer(client, player, dbTeam.id, apiTeam.name)
              if (result === 'imported') {
                playersImported++
                totalPlayersImported++
              } else if (result === 'updated') {
                playersUpdated++
                totalPlayersUpdated++
              }
            } catch (error) {
              console.error(`❌ Error processing player ${player.name}:`, error.message)
            }
          }
          
          console.log(`   📈 ${apiTeam.name}: ${playersImported} new, ${playersUpdated} updated`)
          teamsProcessed++
          
        } catch (error) {
          console.error(`❌ Error processing team ${apiTeam.name}:`, error.message)
        }
      }
      
      console.log(`\\n🎉 PLAYER IMPORT COMPLETE!`)
      console.log(`📊 Teams processed: ${teamsProcessed}/${teams.length}`)
      console.log(`👤 Players imported: ${totalPlayersImported}`)
      console.log(`🔄 Players updated: ${totalPlayersUpdated}`)
      console.log(`🎯 Data source: football-data.org (professional player database)`)
      
      // Validation
      await this.validatePlayerImport(client)
      
    } finally {
      client.release()
    }
  }
  
  async findTeamInDatabase(client, apiTeam) {
    // Define explicit mapping for teams with known naming differences
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
    
    // Check explicit mapping first
    if (teamMappings[apiTeam.name]) {
      const result = await client.query('SELECT id, name FROM teams WHERE name = $1', [teamMappings[apiTeam.name]])
      if (result.rows.length > 0) {
        return result.rows[0]
      }
    }
    
    // Try exact name match
    let result = await client.query('SELECT id, name FROM teams WHERE name = $1', [apiTeam.name])
    if (result.rows.length > 0) {
      return result.rows[0]
    }
    
    // Try without FC suffix
    const nameWithoutFC = apiTeam.name.replace(' FC', '').replace('FC ', '')
    result = await client.query('SELECT id, name FROM teams WHERE name = $1', [nameWithoutFC])
    if (result.rows.length > 0) {
      console.log(`🔗 Mapped team: ${apiTeam.name} → ${result.rows[0].name}`)
      return result.rows[0]
    }
    
    // Try short name if available
    if (apiTeam.shortName) {
      result = await client.query('SELECT id, name FROM teams WHERE name = $1', [apiTeam.shortName])
      if (result.rows.length > 0) {
        console.log(`🔗 Mapped team: ${apiTeam.name} → ${result.rows[0].name} (via shortName)`)
        return result.rows[0]
      }
    }
    
    console.log(`❌ No team mapping found for: ${apiTeam.name} (Short: ${apiTeam.shortName}, TLA: ${apiTeam.tla})`)
    return null
  }
  
  async importOrUpdatePlayer(client, apiPlayer, teamId, teamName) {
    // Check if player already exists
    let existing = await client.query('SELECT id, name, current_team_id FROM players WHERE name = $1', [apiPlayer.name])
    
    if (existing.rows.length > 0) {
      const existingPlayer = existing.rows[0]
      
      // Update team assignment and other details
      await client.query(`
        UPDATE players 
        SET current_team_id = $1, 
            position = $2, 
            nationality = $3,
            date_of_birth = $4,
            updated_at = NOW()
        WHERE id = $5
      `, [
        teamId,
        apiPlayer.position || null,
        apiPlayer.nationality || null,
        apiPlayer.dateOfBirth || null,
        existingPlayer.id
      ])
      
      if (existingPlayer.current_team_id !== teamId) {
        console.log(`🔄 Updated ${apiPlayer.name}: moved to ${teamName}`)
      }
      
      return 'updated'
    } else {
      // Create new player
      await client.query(`
        INSERT INTO players (name, position, nationality, date_of_birth, current_team_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        apiPlayer.name,
        apiPlayer.position || null,
        apiPlayer.nationality || null,
        apiPlayer.dateOfBirth || null,
        teamId
      ])
      
      console.log(`👤 Created ${apiPlayer.name} (${apiPlayer.position || 'Unknown'}) - ${teamName}`)
      return 'imported'
    }
  }
  
  async validatePlayerImport(client) {
    console.log(`\\n🔍 PLAYER DATABASE VALIDATION`)
    console.log('===============================')
    
    // Get player statistics
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_players,
        COUNT(CASE WHEN current_team_id IS NOT NULL THEN 1 END) as players_with_teams,
        COUNT(CASE WHEN position IS NOT NULL THEN 1 END) as players_with_positions,
        COUNT(CASE WHEN nationality IS NOT NULL THEN 1 END) as players_with_nationality,
        COUNT(DISTINCT current_team_id) as teams_represented
      FROM players
    `)
    
    const stat = stats.rows[0]
    console.log(`📊 STATISTICS:`)
    console.log(`   Total players: ${stat.total_players}`)
    console.log(`   Players with teams: ${stat.players_with_teams}`)
    console.log(`   Players with positions: ${stat.players_with_positions}`)
    console.log(`   Players with nationality: ${stat.players_with_nationality}`)
    console.log(`   Teams represented: ${stat.teams_represented}`)
    
    // Show sample of recent imports
    const recent = await client.query(`
      SELECT p.name, p.position, p.nationality, t.name as team_name
      FROM players p
      LEFT JOIN teams t ON p.current_team_id = t.id
      WHERE p.updated_at > NOW() - INTERVAL '1 hour'
      ORDER BY p.updated_at DESC
      LIMIT 10
    `)
    
    console.log(`\\nRecent player imports/updates:`)
    for (const player of recent.rows) {
      console.log(`   ${player.name} (${player.position || 'Unknown'}) - ${player.team_name || 'No team'} [${player.nationality || 'Unknown'}]`)
    }
    
    const completeness = Math.round((stat.players_with_teams / stat.total_players) * 100)
    if (completeness >= 95) {
      console.log(`\\n🎉 EXCELLENT! Player database is ${completeness}% complete`)
    } else if (completeness >= 80) {
      console.log(`\\n✅ Good quality - ${completeness}% of players have team assignments`)
    } else {
      console.log(`\\n⚠️ Moderate quality - only ${completeness}% of players have team assignments`)
    }
  }

  async close() {
    await this.pool.end()
  }
}

export default ProfessionalPlayerImporter

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new ProfessionalPlayerImporter()
  
  const command = process.argv[2]
  const season = process.argv[3] || '2023'
  
  try {
    switch (command) {
      case 'import-2023':
        console.log('👥 IMPORTING ALL 2023/24 PREMIER LEAGUE PLAYERS')
        await importer.importAllCurrentPlayers('2023')
        break
        
      case 'import-2024':
        console.log('👥 IMPORTING ALL 2024/25 PREMIER LEAGUE PLAYERS')
        await importer.importAllCurrentPlayers('2024')
        break
        
      case 'import':
        await importer.importAllCurrentPlayers(season)
        break
        
      default:
        console.log('Usage: node import-professional-players.js [import-2023|import-2024|import] [season]')
        console.log('Examples:')
        console.log('  node import-professional-players.js import-2023')
        console.log('  node import-professional-players.js import-2024')
        console.log('  node import-professional-players.js import 2023')
    }
  } catch (error) {
    console.error('❌ Player import failed:', error.message)
  } finally {
    await importer.close()
  }
}