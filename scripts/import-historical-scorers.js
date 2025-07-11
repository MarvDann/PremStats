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

async function importHistoricalScorers(seasonYear = 2023) {
  const spinner = ora(`Fetching top scorers for ${seasonYear}/${seasonYear+1} season...`).start()
  
  try {
    // Get season ID
    const seasonResult = await pool.query(
      "SELECT id FROM seasons WHERE name = $1",
      [`${seasonYear}/${(seasonYear+1).toString().slice(-2)}`]
    )
    
    if (seasonResult.rows.length === 0) {
      throw new Error(`Season ${seasonYear}/${seasonYear+1} not found`)
    }
    
    const seasonId = seasonResult.rows[0].id
    
    // Fetch top scorers from API for specific season
    const url = `https://api.football-data.org/v4/competitions/PL/scorers?season=${seasonYear}`
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY || ''
      }
    })
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    const scorers = data.scorers || []
    
    spinner.succeed(`Found ${scorers.length} top scorers for ${seasonYear}/${seasonYear+1}`)
    
    let totalGoals = 0
    let importedPlayers = 0
    
    for (const scorer of scorers) {
      spinner.start(`Processing ${scorer.player.name} (${scorer.goals} goals)...`)
      
      // Check if player exists, if not create them
      let playerResult = await pool.query(
        'SELECT id FROM players WHERE name = $1',
        [scorer.player.name]
      )
      
      if (playerResult.rows.length === 0) {
        // Insert new player
        const insertResult = await pool.query(
          `INSERT INTO players (name, date_of_birth, nationality, position, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING id`,
          [
            scorer.player.name,
            scorer.player.dateOfBirth || null,
            scorer.player.nationality || null,
            scorer.player.position || null
          ]
        )
        playerResult = { rows: [{ id: insertResult.rows[0].id }] }
        spinner.text = `Created new player: ${scorer.player.name}`
      }
      
      const playerId = playerResult.rows[0].id
      
      // Find team in database - try multiple matching strategies
      let teamResult = await pool.query(
        'SELECT id FROM teams WHERE name = $1 OR short_name = $2',
        [scorer.team.name, scorer.team.shortName]
      )
      
      if (teamResult.rows.length === 0) {
        // Try partial match
        teamResult = await pool.query(
          'SELECT id FROM teams WHERE name ILIKE $1',
          [`%${scorer.team.shortName}%`]
        )
      }
      
      if (teamResult.rows.length === 0) {
        spinner.warn(`Team not found: ${scorer.team.name} - skipping`)
        continue
      }
      
      const teamId = teamResult.rows[0].id
      
      // Update player stats table
      const existingStats = await pool.query(
        'SELECT id FROM player_stats WHERE player_id = $1 AND season_id = $2',
        [playerId, seasonId]
      )
      
      if (existingStats.rows.length === 0) {
        // Insert new stats
        await pool.query(
          `INSERT INTO player_stats (player_id, season_id, team_id, appearances, goals, assists, yellow_cards, red_cards, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          [
            playerId,
            seasonId,
            teamId,
            scorer.playedMatches || 0,
            scorer.goals || 0,
            scorer.assists || 0,
            scorer.penalties || 0, // Store penalties in yellow_cards for now
            0, // Red cards not in this endpoint
          ]
        )
      } else {
        // Update existing stats
        await pool.query(
          `UPDATE player_stats 
           SET goals = $1, appearances = $2, assists = $3, yellow_cards = $4, updated_at = NOW()
           WHERE player_id = $5 AND season_id = $6`,
          [
            scorer.goals || 0,
            scorer.playedMatches || 0,
            scorer.assists || 0,
            scorer.penalties || 0,
            playerId,
            seasonId
          ]
        )
      }
      
      totalGoals += scorer.goals || 0
      importedPlayers++
      spinner.succeed(`Processed ${scorer.player.name}: ${scorer.goals} goals, ${scorer.assists || 0} assists`)
    }
    
    spinner.succeed(chalk.green(`✅ Successfully imported ${totalGoals} goals from ${importedPlayers} players`))
    
    // Show top 5
    if (scorers.length > 0) {
      console.log(chalk.bold(`\n🏆 Top 5 Scorers for ${seasonYear}/${seasonYear+1}:`))
      scorers.slice(0, 5).forEach((scorer, index) => {
        console.log(`${index + 1}. ${scorer.player.name} (${scorer.team.shortName}) - ${scorer.goals} goals (${scorer.assists || 0} assists)`)
      })
    }
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to import top scorers: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

// Get season year from command line or default to 2023
const seasonYear = parseInt(process.argv[2]) || 2023

// Run the import
console.log(chalk.bold(`⚽ Starting top scorers import for ${seasonYear}/${seasonYear+1} season...`))
importHistoricalScorers(seasonYear).then(() => {
  console.log(chalk.bold('\n✨ Top scorers import complete'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Top scorers import failed:'), error.message)
  process.exit(1)
})