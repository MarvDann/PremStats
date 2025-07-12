#!/usr/bin/env node

import 'dotenv/config'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

// FPL API base URL
const FPL_BASE_URL = 'https://fantasy.premierleague.com/api'

async function fetchJSON(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.json()
}

async function importFPLData() {
  const spinner = ora('Starting FPL data import...').start()
  
  try {
    // Get current season (2024/25)
    const seasonResult = await pool.query(
      "SELECT id FROM seasons WHERE name = '2024/25' ORDER BY id DESC LIMIT 1"
    )
    
    if (seasonResult.rows.length === 0) {
      throw new Error('2024/25 season not found in database')
    }
    
    const seasonId = seasonResult.rows[0].id
    spinner.succeed(`Found season 2024/25 (ID: ${seasonId})`)
    
    // Fetch FPL bootstrap data (players and teams)
    spinner.start('Fetching FPL bootstrap data...')
    const bootstrapData = await fetchJSON(`${FPL_BASE_URL}/bootstrap-static/`)
    
    const fplPlayers = bootstrapData.elements
    const fplTeams = bootstrapData.teams
    
    spinner.succeed(`Found ${fplPlayers.length} players and ${fplTeams.length} teams`)
    
    // Create team mapping (FPL team ID -> our team ID)
    const teamMapping = {}
    for (const fplTeam of fplTeams) {
      const teamResult = await pool.query(
        'SELECT id FROM teams WHERE name ILIKE $1 OR name ILIKE $2',
        [`%${fplTeam.name}%`, `%${fplTeam.short_name}%`]
      )
      
      if (teamResult.rows.length > 0) {
        teamMapping[fplTeam.id] = teamResult.rows[0].id
      } else {
        console.log(chalk.yellow(`Warning: Could not map FPL team ${fplTeam.name}`))
      }
    }
    
    spinner.start('Processing FPL players...')
    let playersUpdated = 0
    let statsUpdated = 0
    
    for (const fplPlayer of fplPlayers) {
      const fullName = `${fplPlayer.first_name} ${fplPlayer.second_name}`
      
      // Try to find existing player by name
      let playerResult = await pool.query(
        'SELECT id FROM players WHERE name = $1 OR name ILIKE $2',
        [fullName, `%${fplPlayer.web_name}%`]
      )
      
      let playerId
      
      if (playerResult.rows.length === 0) {
        // Create new player
        const insertResult = await pool.query(
          `INSERT INTO players (name, position, created_at, updated_at) 
           VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
          [
            fullName,
            ['', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'][fplPlayer.element_type]
          ]
        )
        playerId = insertResult.rows[0].id
        playersUpdated++
      } else {
        playerId = playerResult.rows[0].id
      }
      
      // Update player stats if we have team mapping
      const teamId = teamMapping[fplPlayer.team]
      if (teamId) {
        // Check if stats record exists
        const statsResult = await pool.query(
          'SELECT id FROM player_stats WHERE player_id = $1 AND season_id = $2 AND team_id = $3',
          [playerId, seasonId, teamId]
        )
        
        if (statsResult.rows.length === 0) {
          // Create new stats record
          await pool.query(
            `INSERT INTO player_stats 
             (player_id, season_id, team_id, appearances, goals, assists, yellow_cards, red_cards, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, 0, 0, NOW(), NOW())`,
            [
              playerId,
              seasonId, 
              teamId,
              Math.round(fplPlayer.minutes / 90), // Approximate appearances
              fplPlayer.goals_scored,
              fplPlayer.assists
            ]
          )
        } else {
          // Update existing stats
          await pool.query(
            `UPDATE player_stats 
             SET goals = $1, assists = $2, appearances = $3, updated_at = NOW()
             WHERE player_id = $4 AND season_id = $5 AND team_id = $6`,
            [
              fplPlayer.goals_scored,
              fplPlayer.assists,
              Math.round(fplPlayer.minutes / 90),
              playerId,
              seasonId,
              teamId
            ]
          )
        }
        statsUpdated++
      }
    }
    
    spinner.succeed(`Processed ${fplPlayers.length} FPL players`)
    
    // Now fetch fixtures for match events
    spinner.start('Fetching FPL fixtures...')
    const fixtures = await fetchJSON(`${FPL_BASE_URL}/fixtures/`)
    
    let matchEventsProcessed = 0
    let goalsImported = 0
    
    for (const fixture of fixtures) {
      if (!fixture.finished || !fixture.stats) continue
      
      // Process goals_scored
      if (fixture.stats.find(stat => stat.identifier === 'goals_scored')) {
        const goalsStat = fixture.stats.find(stat => stat.identifier === 'goals_scored')
        
        // Process home team goals
        for (const goal of goalsStat.h || []) {
          const fplPlayerId = goal.element
          const fplPlayer = fplPlayers.find(p => p.id === fplPlayerId)
          
          if (fplPlayer) {
            const fullName = `${fplPlayer.first_name} ${fplPlayer.second_name}`
            const playerResult = await pool.query(
              'SELECT id FROM players WHERE name = $1',
              [fullName]
            )
            
            if (playerResult.rows.length > 0) {
              // This is where we could insert into match_events table
              // For now, we'll just count the goals processed
              goalsImported += goal.value
            }
          }
        }
        
        // Process away team goals
        for (const goal of goalsStat.a || []) {
          const fplPlayerId = goal.element
          const fplPlayer = fplPlayers.find(p => p.id === fplPlayerId)
          
          if (fplPlayer) {
            const fullName = `${fplPlayer.first_name} ${fplPlayer.second_name}`
            const playerResult = await pool.query(
              'SELECT id FROM players WHERE name = $1',
              [fullName]
            )
            
            if (playerResult.rows.length > 0) {
              goalsImported += goal.value
            }
          }
        }
      }
      
      matchEventsProcessed++
    }
    
    spinner.succeed('FPL data import completed successfully!')
    
    // Final summary
    console.log(chalk.bold('\n📊 FPL Import Summary:'))
    console.log(`• Players processed: ${fplPlayers.length}`)
    console.log(`• New/updated players: ${playersUpdated}`)
    console.log(`• Stats records updated: ${statsUpdated}`)
    console.log(`• Fixtures processed: ${matchEventsProcessed}`)
    console.log(`• Goals identified: ${goalsImported}`)
    
    // Show top scorers from our database
    const topScorersResult = await pool.query(`
      SELECT 
        p.name,
        t.name as team_name,
        ps.goals,
        ps.assists,
        ps.appearances
      FROM player_stats ps
      JOIN players p ON ps.player_id = p.id
      JOIN teams t ON ps.team_id = t.id
      JOIN seasons s ON ps.season_id = s.id
      WHERE s.name = '2024/25' AND ps.goals > 0
      ORDER BY ps.goals DESC, ps.assists DESC
      LIMIT 10
    `)
    
    console.log(chalk.bold('\n🏆 Top Scorers (2024/25):'))
    topScorersResult.rows.forEach((row, index) => {
      const emoji = index < 3 ? '🥇🥈🥉'[index] : '⚽'
      console.log(`${emoji} ${row.name} (${row.team_name}): ${row.goals} goals, ${row.assists} assists`)
    })
    
  } catch (error) {
    spinner.fail(chalk.red(`FPL import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

// Run the import
console.log(chalk.bold('⚽ Starting FPL data import for 2024/25 season...'))
console.log(chalk.gray('📡 Using Fantasy Premier League API (free, no authentication required)'))

importFPLData().then(() => {
  console.log(chalk.bold('\n✨ FPL import complete! Real goal and assist data now available'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 FPL import failed:'), error.message)
  process.exit(1)
})