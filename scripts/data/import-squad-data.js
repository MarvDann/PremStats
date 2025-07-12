#!/usr/bin/env node

import 'dotenv/config'
import { FootballDataClient } from '../../agents/data/football-data-client.js'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

const client = new FootballDataClient()

async function importSquadData() {
  const spinner = ora('Starting squad data import...').start()
  
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
    
    // Get all Premier League teams
    spinner.start('Fetching Premier League teams...')
    const teams = await client.getTeams()
    spinner.succeed(`Found ${teams.length} teams`)
    
    let totalPlayersProcessed = 0
    let newPlayersAdded = 0
    let squadRecordsCreated = 0
    
    for (const [index, team] of teams.entries()) {
      spinner.start(`[${index + 1}/${teams.length}] Processing ${team.name}...`)
      
      try {
        // Check if team exists in our database (try multiple name variations)
        const teamName = team.name.replace(/ FC$/, '').replace(/ AFC$/, '')
        const teamResult = await pool.query(
          `SELECT id FROM teams WHERE 
           name = $1 OR 
           name = $2 OR 
           name ILIKE $3 OR
           name ILIKE $4`,
          [
            team.name,           // Exact match (e.g., "Manchester City FC")
            teamName,            // Without FC/AFC suffix (e.g., "Manchester City")
            `%${team.shortName || team.tla}%`, // Short name match
            `%${teamName}%`      // Partial match
          ]
        )
        
        if (teamResult.rows.length === 0) {
          spinner.warn(`Team not found in database: ${team.name} - skipping`)
          continue
        }
        
        const teamId = teamResult.rows[0].id
        
        // Get team details including squad
        const teamDetails = await client.getTeam(team.id)
        
        if (!teamDetails.squad || teamDetails.squad.length === 0) {
          spinner.warn(`No squad data for ${team.name}`)
          continue
        }
        
        spinner.text = `Processing ${teamDetails.squad.length} players from ${team.name}...`
        
        for (const player of teamDetails.squad) {
          totalPlayersProcessed++
          
          // Check if player exists
          let playerResult = await pool.query(
            'SELECT id FROM players WHERE name = $1',
            [player.name]
          )
          
          let playerId
          
          if (playerResult.rows.length === 0) {
            // Create new player
            const insertResult = await pool.query(
              `INSERT INTO players (name, date_of_birth, nationality, position, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
              [
                player.name,
                player.dateOfBirth || null,
                player.nationality || null,
                player.position || null
              ]
            )
            playerId = insertResult.rows[0].id
            newPlayersAdded++
          } else {
            playerId = playerResult.rows[0].id
            
            // Update player details if needed
            await pool.query(
              `UPDATE players 
               SET date_of_birth = COALESCE($1, date_of_birth),
                   nationality = COALESCE($2, nationality),
                   position = COALESCE($3, position),
                   updated_at = NOW()
               WHERE id = $4`,
              [
                player.dateOfBirth || null,
                player.nationality || null,
                player.position || null,
                playerId
              ]
            )
          }
          
          // Check if squad record exists for this season
          const squadResult = await pool.query(
            'SELECT id FROM player_stats WHERE player_id = $1 AND season_id = $2 AND team_id = $3',
            [playerId, seasonId, teamId]
          )
          
          if (squadResult.rows.length === 0) {
            // Create squad record (player_stats with zero stats = squad membership)
            await pool.query(
              `INSERT INTO player_stats 
               (player_id, season_id, team_id, appearances, goals, assists, yellow_cards, red_cards, created_at, updated_at)
               VALUES ($1, $2, $3, 0, 0, 0, 0, 0, NOW(), NOW())`,
              [playerId, seasonId, teamId]
            )
            squadRecordsCreated++
          }
        }
        
        spinner.succeed(`✅ ${team.name}: ${teamDetails.squad.length} players processed`)
        
        // Rate limiting - wait 6 seconds between teams (10 requests/minute limit)
        if (index < teams.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 6000))
        }
        
      } catch (error) {
        spinner.warn(`Failed to process ${team.name}: ${error.message}`)
      }
    }
    
    // Final summary
    spinner.succeed(chalk.green('🎉 Squad data import completed successfully!'))
    
    console.log(chalk.bold('\n📊 Import Summary:'))
    console.log(`• Total players processed: ${totalPlayersProcessed}`)
    console.log(`• New players added: ${newPlayersAdded}`)
    console.log(`• Squad records created: ${squadRecordsCreated}`)
    console.log(`• Teams processed: ${teams.length}`)
    
    // Show some statistics
    const statsResult = await pool.query(`
      SELECT 
        t.name as team_name,
        COUNT(*) as squad_size
      FROM player_stats ps
      JOIN teams t ON ps.team_id = t.id
      JOIN seasons s ON ps.season_id = s.id
      WHERE s.name = '2024/25'
      GROUP BY t.name, t.id
      ORDER BY COUNT(*) DESC
    `)
    
    console.log(chalk.bold('\n🏆 Squad Sizes (2024/25):'))
    statsResult.rows.forEach((row, index) => {
      const emoji = index < 3 ? '🥇🥈🥉'[index] : '⚽'
      console.log(`${emoji} ${row.team_name}: ${row.squad_size} players`)
    })
    
  } catch (error) {
    spinner.fail(chalk.red(`Squad import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

// Check if API key is available
if (!process.env.FOOTBALL_DATA_API_KEY) {
  console.log(chalk.yellow('⚠️  No FOOTBALL_DATA_API_KEY found in environment'))
  console.log(chalk.gray('   The script will use the free tier with limited requests'))
  console.log(chalk.gray('   To get an API key, visit: https://www.football-data.org/client/register'))
}

// Run the import
console.log(chalk.bold('🏃 Starting squad data import for 2024/25 season...'))
console.log(chalk.gray('📡 Using football-data.org API with rate limiting (10 requests/minute)'))

importSquadData().then(() => {
  console.log(chalk.bold('\n✨ Squad import complete! Players are now linked to teams for 2024/25 season'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Squad import failed:'), error.message)
  process.exit(1)
})