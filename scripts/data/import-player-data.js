#!/usr/bin/env node

import { FootballDataClient } from '../agents/data/football-data-client.js'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

const client = new FootballDataClient()

// Premier League competition ID
const PREMIER_LEAGUE_ID = 2021

async function importPlayers() {
  const spinner = ora('Fetching current season teams...').start()
  
  try {
    // Get current season teams
    const teams = await client.getTeams(PREMIER_LEAGUE_ID)
    spinner.succeed(`Found ${teams.length} teams`)
    
    let totalPlayers = 0
    
    for (const team of teams) {
      spinner.start(`Fetching squad for ${team.name}...`)
      
      try {
        // Get team details including squad
        const teamDetails = await client.getTeam(team.id)
        
        if (teamDetails.squad && teamDetails.squad.length > 0) {
          spinner.text = `Importing ${teamDetails.squad.length} players from ${team.name}...`
          
          for (const player of teamDetails.squad) {
            // Check if player exists
            const existingPlayer = await pool.query(
              'SELECT id FROM players WHERE name = $1',
              [player.name]
            )
            
            if (existingPlayer.rows.length === 0) {
              // Insert new player
              await pool.query(
                `INSERT INTO players (name, date_of_birth, nationality, position, created_at, updated_at) 
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [
                  player.name,
                  player.dateOfBirth || null,
                  player.nationality || null,
                  player.position || null
                ]
              )
              totalPlayers++
            }
          }
          
          spinner.succeed(`Imported players from ${team.name}`)
        }
        
        // Rate limiting - wait 6 seconds between requests (10 requests/minute limit)
        await new Promise(resolve => setTimeout(resolve, 6000))
        
      } catch (error) {
        spinner.warn(`Failed to fetch squad for ${team.name}: ${error.message}`)
      }
    }
    
    spinner.succeed(chalk.green(`✅ Successfully imported ${totalPlayers} new players`))
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to import players: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

// Run the import
console.log(chalk.bold('🏃 Starting player data import from Football-Data.org...'))
importPlayers().then(() => {
  console.log(chalk.bold('\n✨ Player import complete'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Player import failed:'), error.message)
  process.exit(1)
})