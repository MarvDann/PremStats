#!/usr/bin/env node

import { AgentWorker } from '../base/agent-worker.js'
import chalk from 'chalk'
import { FootballDataClient } from './football-data-client.js'
import { HistoricalCSVScraper } from './historical-csv-scraper.js'
import { TimHoareScraper } from './timhoare-scraper.js'
import pg from 'pg'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname })

// Initialize database connection
const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

// Initialize API client and scrapers
const apiClient = new FootballDataClient()
const historicalScraper = new HistoricalCSVScraper(pool)
const timHoareScraper = new TimHoareScraper(pool)

// Task handler for data collection
async function handleDataTask(task) {
  console.log(chalk.blue(`Data Agent processing: ${task.task}`))
  
  // Parse task type
  const taskLower = task.task.toLowerCase()
  
  if (taskLower.includes('scrape')) {
    if (taskLower.includes('1992-93') || taskLower.includes('1992/93')) {
      // Handle 1992/93 season specifically with TimHoare scraper
      return await scrape1992Season()
    } else if (taskLower.includes('historical')) {
      // Handle other historical data scraping
      const yearMatch = task.task.match(/(\d{4})/)
      if (yearMatch) {
        const year = parseInt(yearMatch[1])
        return await scrapeHistoricalSeason(year)
      } else {
        return await scrapeHistoricalSeason(1993) // Default to 1993 (first available from CSV)
      }
    } else if (taskLower.includes('teams')) {
      return await scrapeTeams()
    } else if (taskLower.includes('fixtures') || taskLower.includes('matches')) {
      return await scrapeMatches()
    } else if (taskLower.includes('table') || taskLower.includes('standings')) {
      return await scrapeStandings()
    } else if (taskLower.includes('players') || taskLower.includes('stats')) {
      return await scrapePlayerStats()
    } else {
      return await scrapeLatest()
    }
  }
  
  throw new Error(`Unknown task type: ${task.task}`)
}

// Fetch and store match data
async function scrapeMatches() {
  console.log(chalk.gray('Fetching match data from football-data.org...'))
  
  try {
    const matches = await apiClient.getMatches()
    console.log(chalk.green(`Fetched ${matches.length} matches`))
    
    // Store matches in database
    let stored = 0
    for (const match of matches) {
      const transformed = apiClient.transformMatch(match)
      
      // Only store completed matches
      if (transformed.status === 'FINISHED' && transformed.home_score !== null) {
        try {
          await pool.query(`
            INSERT INTO matches (
              external_id, home_team_id, away_team_id, date, matchday,
              home_score, away_score, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (external_id) DO UPDATE SET
              home_score = EXCLUDED.home_score,
              away_score = EXCLUDED.away_score,
              status = EXCLUDED.status
          `, [
            transformed.external_id,
            transformed.home_team_id,
            transformed.away_team_id,
            transformed.date,
            transformed.matchday,
            transformed.home_score,
            transformed.away_score,
            transformed.status
          ])
          stored++
        } catch (dbError) {
          console.error(chalk.yellow(`Failed to store match ${match.id}: ${dbError.message}`))
        }
      }
    }
    
    return {
      matches: matches.length,
      stored: stored,
      source: 'football-data.org',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Failed to fetch matches: ${error.message}`))
    throw error
  }
}

async function scrapeStandings() {
  console.log(chalk.gray('Fetching league standings from football-data.org...'))
  
  try {
    const standings = await apiClient.getStandings()
    console.log(chalk.green(`Fetched standings for ${standings.length} teams`))
    
    // Get current season ID (you may need to create/fetch this)
    const seasonResult = await pool.query(`
      SELECT id FROM seasons WHERE year = $1 LIMIT 1
    `, [new Date().getFullYear()])
    
    const seasonId = seasonResult.rows[0]?.id || 1 // Default to 1 if not found
    
    // Store standings in database
    let stored = 0
    for (const standing of standings) {
      const transformed = apiClient.transformStanding(standing, seasonId)
      
      try {
        // First get the internal team ID from external ID
        const teamResult = await pool.query(`
          SELECT id FROM teams WHERE external_id = $1
        `, [standing.team.id])
        
        if (teamResult.rows.length === 0) {
          console.error(chalk.yellow(`Team not found for external_id ${standing.team.id}`))
          continue
        }
        
        const teamId = teamResult.rows[0].id
        
        await pool.query(`
          INSERT INTO standings (
            team_id, season_id, position, played, won, drawn, lost,
            goals_for, goals_against, goal_difference, points, date, team_external_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (season_id, team_id, date) DO UPDATE SET
            position = EXCLUDED.position,
            played = EXCLUDED.played,
            won = EXCLUDED.won,
            drawn = EXCLUDED.drawn,
            lost = EXCLUDED.lost,
            goals_for = EXCLUDED.goals_for,
            goals_against = EXCLUDED.goals_against,
            goal_difference = EXCLUDED.goal_difference,
            points = EXCLUDED.points
        `, [
          teamId,
          transformed.season_id,
          transformed.position,
          transformed.played,
          transformed.won,
          transformed.drawn,
          transformed.lost,
          transformed.goals_for,
          transformed.goals_against,
          transformed.goal_difference,
          transformed.points,
          transformed.date.split('T')[0], // Use date only, not time
          standing.team.id // Store external ID for reference
        ])
        stored++
      } catch (dbError) {
        console.error(chalk.yellow(`Failed to store standing: ${dbError.message}`))
      }
    }
    
    return {
      standings: standings.length,
      stored: stored,
      source: 'football-data.org',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Failed to fetch standings: ${error.message}`))
    throw error
  }
}

async function scrapePlayerStats() {
  console.log(chalk.gray('Fetching player statistics from football-data.org...'))
  
  try {
    const scorers = await apiClient.getTopScorers()
    console.log(chalk.green(`Fetched ${scorers.length} top scorers`))
    
    return {
      topScorers: scorers.slice(0, 10).map(scorer => ({
        player: scorer.player.name,
        team: scorer.team.name,
        goals: scorer.goals || 0,
        assists: scorer.assists || 0,
        penalties: scorer.penalties || 0
      })),
      source: 'football-data.org',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Failed to fetch player stats: ${error.message}`))
    throw error
  }
}

async function scrapeLatest() {
  console.log(chalk.gray('Fetching all latest data...'))
  
  const results = {
    timestamp: new Date().toISOString(),
    source: 'football-data.org'
  }
  
  try {
    // Fetch teams first (needed for other data)
    console.log(chalk.blue('Step 1: Fetching teams...'))
    results.teams = await scrapeTeams()
    
    // Then fetch matches
    console.log(chalk.blue('Step 2: Fetching matches...'))
    results.matches = await scrapeMatches()
    
    // Then standings
    console.log(chalk.blue('Step 3: Fetching standings...'))
    results.standings = await scrapeStandings()
    
    // Finally player stats
    console.log(chalk.blue('Step 4: Fetching player stats...'))
    results.playerStats = await scrapePlayerStats()
    
    console.log(chalk.green('All data fetched successfully!'))
    return results
  } catch (error) {
    console.error(chalk.red(`Failed during scrapeLatest: ${error.message}`))
    results.error = error.message
    return results
  }
}

// Fetch and store team data
async function scrapeTeams() {
  console.log(chalk.gray('Fetching team data from football-data.org...'))
  
  try {
    const teams = await apiClient.getTeams()
    console.log(chalk.green(`Fetched ${teams.length} teams`))
    
    // Get current season
    const seasonResult = await pool.query(`
      SELECT id, name, team_count FROM seasons WHERE year = $1 LIMIT 1
    `, [2025]) // Current season is 2025/26
    
    const season = seasonResult.rows[0]
    if (!season) {
      throw new Error('No current season found in database')
    }
    const { id: seasonId, name: seasonName, team_count: expectedTeamCount } = season
    
    // Validate team count for historical accuracy
    if (expectedTeamCount && teams.length !== expectedTeamCount) {
      console.log(chalk.yellow(`Warning: Expected ${expectedTeamCount} teams for ${seasonName} but got ${teams.length}`))
    }
    
    // Store teams in database
    let stored = 0
    let teamSeasons = 0
    for (const team of teams) {
      const transformed = apiClient.transformTeam(team)
      
      try {
        // First, insert or update the team
        const teamResult = await pool.query(`
          INSERT INTO teams (
            external_id, name, short_name, stadium, founded, crest_url
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (external_id) DO UPDATE SET
            name = EXCLUDED.name,
            short_name = EXCLUDED.short_name,
            stadium = EXCLUDED.stadium,
            crest_url = EXCLUDED.crest_url
          RETURNING id
        `, [
          transformed.external_id,
          transformed.name,
          transformed.short_name,
          transformed.stadium,
          transformed.founded,
          transformed.crest_url
        ])
        stored++
        
        // Then, link the team to the current season
        const teamId = teamResult.rows[0].id
        await pool.query(`
          INSERT INTO team_seasons (team_id, season_id, division)
          VALUES ($1, $2, 'Premier League')
          ON CONFLICT (team_id, season_id) DO NOTHING
        `, [teamId, seasonId])
        teamSeasons++
        
      } catch (dbError) {
        console.error(chalk.yellow(`Failed to store team ${team.name}: ${dbError.message}`))
      }
    }
    
    return {
      teams: teams.length,
      stored: stored,
      teamSeasons: teamSeasons,
      season: '2025/26',
      source: 'football-data.org',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Failed to fetch teams: ${error.message}`))
    throw error
  }
}

// Scrape 1992/93 season using TimHoare data
async function scrape1992Season() {
  console.log(chalk.blue('Scraping 1992/93 season using TimHoare repository data'))
  
  try {
    const result = await timHoareScraper.scrape1992Season()
    
    // Calculate and store standings after importing matches
    console.log(chalk.gray('Calculating final standings...'))
    const seasonResult = await pool.query('SELECT id FROM seasons WHERE name = $1', ['1992/93'])
    if (seasonResult.rows.length > 0) {
      const seasonId = seasonResult.rows[0].id
      await calculateAndStoreStandings(seasonId)
    }
    
    return {
      season: '1992/93',
      year: 1992,
      ...result,
      source: 'TimHoare/Premier_League_Data',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Failed to scrape 1992/93 season: ${error.message}`))
    throw error
  }
}

// Scrape historical season data
async function scrapeHistoricalSeason(year) {
  const seasonName = `${year}/${(year + 1).toString().substr(2)}`
  console.log(chalk.blue(`Scraping historical data for season ${seasonName}`))
  
  try {
    // First ensure we have all teams for that season
    console.log(chalk.gray('Step 1: Checking teams...'))
    const teamsResult = await pool.query(`
      SELECT COUNT(DISTINCT t.id) as team_count
      FROM teams t
      JOIN team_seasons ts ON t.id = ts.team_id
      JOIN seasons s ON ts.season_id = s.id
      WHERE s.name = $1
    `, [seasonName])
    
    if (teamsResult.rows[0].team_count < 20) {
      console.log(chalk.yellow(`Warning: Only ${teamsResult.rows[0].team_count} teams found for ${seasonName}`))
    }
    
    // Scrape the season
    console.log(chalk.gray('Step 2: Downloading and parsing CSV data...'))
    const result = await historicalScraper.scrapeSeason(seasonName)
    
    // Calculate and store standings after importing matches
    console.log(chalk.gray('Step 3: Calculating final standings...'))
    const seasonResult = await pool.query('SELECT id FROM seasons WHERE name = $1', [seasonName])
    if (seasonResult.rows.length > 0) {
      const seasonId = seasonResult.rows[0].id
      await calculateAndStoreStandings(seasonId)
    }
    
    return {
      season: seasonName,
      year: year,
      ...result,
      source: 'football-data.co.uk',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Failed to scrape historical season ${seasonName}: ${error.message}`))
    throw error
  }
}

// Calculate and store final standings for a season
async function calculateAndStoreStandings(seasonId) {
  try {
    // Get the last match date of the season
    const lastMatchResult = await pool.query(`
      SELECT MAX(match_date) as last_date FROM matches WHERE season_id = $1
    `, [seasonId])
    
    const lastDate = lastMatchResult.rows[0]?.last_date
    if (!lastDate) {
      console.log(chalk.yellow('No matches found for season'))
      return
    }
    
    // Calculate final table
    const standings = await pool.query(`
      SELECT * FROM calculate_table_at_date($1, $2::date)
    `, [seasonId, lastDate])
    
    // Store standings
    for (const standing of standings.rows) {
      await pool.query(`
        INSERT INTO standings (
          season_id, team_id, position, played, won, drawn, lost,
          goals_for, goals_against, goal_difference, points, date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (season_id, team_id, date) DO UPDATE SET
          position = EXCLUDED.position,
          played = EXCLUDED.played,
          won = EXCLUDED.won,
          drawn = EXCLUDED.drawn,
          lost = EXCLUDED.lost,
          goals_for = EXCLUDED.goals_for,
          goals_against = EXCLUDED.goals_against,
          goal_difference = EXCLUDED.goal_difference,
          points = EXCLUDED.points
      `, [
        seasonId, standing.team_id, standing.position, standing.played,
        standing.won, standing.drawn, standing.lost, standing.goals_for,
        standing.goals_against, standing.goal_difference, standing.points,
        lastDate
      ])
    }
    
    console.log(chalk.green(`Stored standings for ${standings.rows.length} teams`))
  } catch (error) {
    console.error(chalk.red(`Failed to calculate standings: ${error.message}`))
  }
}

// Create and start the agent
const agent = new AgentWorker(
  'Data Collection Agent',
  'data',
  handleDataTask
)

// Start the agent
agent.start().catch(error => {
  console.error(chalk.red(`Failed to start agent: ${error}`))
  process.exit(1)
})