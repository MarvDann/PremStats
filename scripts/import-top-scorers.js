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

async function importTopScorers() {
  const spinner = ora('Fetching top scorers for current season...').start()
  
  try {
    // Get current season ID (2024/25)
    const seasonResult = await pool.query(
      "SELECT id FROM seasons WHERE name = '2024/25'"
    )
    
    if (seasonResult.rows.length === 0) {
      throw new Error('2024/25 season not found')
    }
    
    const seasonId = seasonResult.rows[0].id
    
    // Fetch top scorers from API
    const scorers = await client.getTopScorers(PREMIER_LEAGUE_ID)
    spinner.succeed(`Found ${scorers.length} top scorers`)
    
    let totalGoals = 0
    
    for (const scorer of scorers) {
      spinner.start(`Processing ${scorer.player.name} (${scorer.goals} goals)...`)
      
      // Find player in database
      const playerResult = await pool.query(
        'SELECT id FROM players WHERE name = $1',
        [scorer.player.name]
      )
      
      if (playerResult.rows.length === 0) {
        spinner.warn(`Player not found: ${scorer.player.name} - skipping`)
        continue
      }
      
      const playerId = playerResult.rows[0].id
      
      // Find team in database
      const teamResult = await pool.query(
        'SELECT id FROM teams WHERE name LIKE $1',
        [`%${scorer.team.shortName}%`]
      )
      
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
            0, // Yellow cards not in this endpoint
            0, // Red cards not in this endpoint
          ]
        )
      } else {
        // Update existing stats
        await pool.query(
          `UPDATE player_stats 
           SET goals = $1, appearances = $2, assists = $3, updated_at = NOW()
           WHERE player_id = $4 AND season_id = $5`,
          [
            scorer.goals || 0,
            scorer.playedMatches || 0,
            scorer.assists || 0,
            playerId,
            seasonId
          ]
        )
      }
      
      totalGoals += scorer.goals || 0
      spinner.succeed(`Processed ${scorer.player.name}: ${scorer.goals} goals, ${scorer.assists || 0} assists`)
    }
    
    spinner.succeed(chalk.green(`✅ Successfully imported ${totalGoals} goals from ${scorers.length} players`))
    
    // Show top 5
    console.log(chalk.bold('\n🏆 Top 5 Scorers:'))
    scorers.slice(0, 5).forEach((scorer, index) => {
      console.log(`${index + 1}. ${scorer.player.name} - ${scorer.goals} goals (${scorer.assists || 0} assists)`)
    })
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to import top scorers: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

// Run the import
console.log(chalk.bold('⚽ Starting top scorers import from Football-Data.org...'))
importTopScorers().then(() => {
  console.log(chalk.bold('\n✨ Top scorers import complete'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Top scorers import failed:'), error.message)
  process.exit(1)
})