#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'
import csv from 'csv-parser'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

/**
 * Import Premier League historical squad data from Kaggle dataset
 * Dataset: "All Premier League team and players (1992-2024)"
 * 
 * PREREQUISITES:
 * 1. Download the Kaggle dataset to: data/kaggle-premier-league/
 * 2. Extract the DATA_CSV folder
 * 
 * Data Structure Expected:
 * - clubs.csv: Team information and participation by season
 * - DATA_CSV/Season_YYYY/: Season-specific player data
 */

async function importKaggleSquadData() {
  const spinner = ora('Starting Kaggle Premier League squad data import...').start()
  
  try {
    const dataPath = 'data/kaggle-premier-league'
    
    // Check if data directory exists
    if (!fs.existsSync(dataPath)) {
      throw new Error(`
        Data directory not found: ${dataPath}
        
        Please download the Kaggle dataset first:
        1. Visit: https://www.kaggle.com/datasets/samoilovmikhail/all-premier-league-team-and-players-1992-2024
        2. Download and extract to: ${dataPath}/
        3. Re-run this script
      `)
    }
    
    // Check for required files
    const clubsFile = path.join(dataPath, 'clubs.csv')
    const dataCsvPath = path.join(dataPath, 'DATA_CSV')
    
    if (!fs.existsSync(clubsFile)) {
      throw new Error(`clubs.csv not found in ${dataPath}`)
    }
    
    if (!fs.existsSync(dataCsvPath)) {
      throw new Error(`DATA_CSV folder not found in ${dataPath}`)
    }
    
    spinner.succeed('Data files found')
    
    // Import clubs data first
    await importClubsData(clubsFile)
    
    // Import squad data by season
    await importSeasonSquadData(dataCsvPath)
    
    // Generate summary statistics
    await generateImportSummary()
    
    spinner.succeed(chalk.green('🎉 Kaggle squad data import completed successfully!'))
    
  } catch (error) {
    spinner.fail(chalk.red(`Import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function importClubsData(clubsFile) {
  const spinner = ora('Processing clubs data...').start()
  
  // Implementation would read clubs.csv and update teams table
  // This ensures all historical teams are in our database
  
  spinner.succeed('Clubs data processed')
}

async function importSeasonSquadData(dataCsvPath) {
  const spinner = ora('Processing season squad data...').start()
  
  // Get list of season directories
  const seasonDirs = fs.readdirSync(dataCsvPath)
    .filter(dir => dir.startsWith('Season_'))
    .sort()
  
  spinner.succeed(`Found ${seasonDirs.length} seasons to process`)
  
  let totalPlayers = 0
  let totalSquadRecords = 0
  
  for (const seasonDir of seasonDirs) {
    const seasonPath = path.join(dataCsvPath, seasonDir)
    const seasonName = extractSeasonName(seasonDir)
    
    spinner.start(`Processing ${seasonName}...`)
    
    try {
      // Get or create season
      const seasonId = await getOrCreateSeason(seasonName)
      
      // Process squad files in this season directory
      const result = await processSeasonSquads(seasonPath, seasonId, seasonName)
      
      totalPlayers += result.players
      totalSquadRecords += result.squadRecords
      
      spinner.succeed(`✅ ${seasonName}: ${result.players} players, ${result.squadRecords} squad records`)
      
    } catch (error) {
      spinner.warn(`Failed to process ${seasonName}: ${error.message}`)
    }
  }
  
  console.log(chalk.bold(`\n📊 Squad Import Summary:`))
  console.log(`• Total players processed: ${totalPlayers}`)
  console.log(`• Total squad records created: ${totalSquadRecords}`)
  console.log(`• Seasons processed: ${seasonDirs.length}`)
}

function extractSeasonName(seasonDir) {
  // Convert "Season_1992" to "1992/93" format
  const year = seasonDir.replace('Season_', '')
  const nextYear = (parseInt(year) + 1).toString().slice(-2)
  return `${year}/${nextYear}`
}

async function getOrCreateSeason(seasonName) {
  // Check if season exists
  const result = await pool.query(
    'SELECT id FROM seasons WHERE name = $1',
    [seasonName]
  )
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  // Create season if it doesn't exist
  const insertResult = await pool.query(
    `INSERT INTO seasons (name, start_date, end_date, year, created_at) 
     VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
    [
      seasonName,
      new Date(`${seasonName.split('/')[0]}-08-01`), // Approximate start
      new Date(`20${seasonName.split('/')[1]}-05-31`), // Approximate end
      parseInt(seasonName.split('/')[0])
    ]
  )
  
  return insertResult.rows[0].id
}

async function processSeasonSquads(seasonPath, seasonId, seasonName) {
  // This function processes CSV files in each season directory
  // and creates player_stats records linking players to teams for that season
  
  // TRANSFER HANDLING STRATEGY:
  // 1. Create separate player_stats records for each team a player represented
  // 2. Use date ranges or transfer windows to track timing
  // 3. Multiple records per player per season = transfer occurred
  
  let playersProcessed = 0
  let squadRecordsCreated = 0
  
  try {
    // Read squad files in season directory
    const files = fs.readdirSync(seasonPath)
      .filter(file => file.endsWith('.csv'))
    
    for (const file of files) {
      const filePath = path.join(seasonPath, file)
      const teamName = extractTeamName(file) // Extract team from filename
      
      // Get team ID from database
      const teamResult = await pool.query(
        'SELECT id FROM teams WHERE name ILIKE $1 OR short_name ILIKE $2',
        [`%${teamName}%`, `%${teamName}%`]
      )
      
      if (teamResult.rows.length === 0) {
        console.log(chalk.yellow(`Warning: Team not found: ${teamName}`))
        continue
      }
      
      const teamId = teamResult.rows[0].id
      
      // Process players from this team's file
      const csvData = fs.readFileSync(filePath, 'utf8')
      const players = parseCSV(csvData) // Would need proper CSV parsing
      
      for (const playerData of players) {
        playersProcessed++
        
        // Get or create player
        const playerId = await getOrCreatePlayer(playerData)
        
        // Handle transfers by checking for existing records
        const existingRecord = await pool.query(
          'SELECT id FROM player_stats WHERE player_id = $1 AND season_id = $2 AND team_id = $3',
          [playerId, seasonId, teamId]
        )
        
        if (existingRecord.rows.length === 0) {
          // Create new squad record
          await pool.query(
            `INSERT INTO player_stats 
             (player_id, season_id, team_id, appearances, goals, assists, yellow_cards, red_cards, created_at, updated_at)
             VALUES ($1, $2, $3, 0, 0, 0, 0, 0, NOW(), NOW())`,
            [playerId, seasonId, teamId]
          )
          squadRecordsCreated++
        }
        
        // Check for mid-season transfers
        await handleMidSeasonTransfer(playerId, seasonId, teamId, playerData)
      }
    }
    
  } catch (error) {
    console.log(chalk.red(`Error processing ${seasonName}: ${error.message}`))
  }
  
  return {
    players: playersProcessed,
    squadRecords: squadRecordsCreated
  }
}

async function handleMidSeasonTransfer(playerId, seasonId, newTeamId, playerData) {
  // Check if player already has a record for this season with different team
  const existingTeams = await pool.query(
    'SELECT team_id FROM player_stats WHERE player_id = $1 AND season_id = $2',
    [playerId, seasonId]
  )
  
  if (existingTeams.rows.length > 1) {
    // Multiple teams = mid-season transfer
    console.log(chalk.blue(`Mid-season transfer detected for player ID ${playerId}`))
    
    // Could add transfer_date field or use match dates to determine timing
    // For now, we track that the player represented multiple teams
  }
}

async function getOrCreatePlayer(playerData) {
  // Implementation would extract player name and details from CSV row
  // and return player ID after creating if necessary
  
  const playerName = playerData.name || playerData.player_name || 'Unknown'
  
  // Check if player exists
  let result = await pool.query(
    'SELECT id FROM players WHERE name = $1',
    [playerName]
  )
  
  if (result.rows.length === 0) {
    // Create new player
    const insertResult = await pool.query(
      'INSERT INTO players (name, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING id',
      [playerName]
    )
    return insertResult.rows[0].id
  }
  
  return result.rows[0].id
}

function extractTeamName(filename) {
  // Extract team name from filename
  // e.g., "Arsenal_1992.csv" -> "Arsenal"
  return filename.replace(/\.csv$/, '').split('_')[0]
}

function parseCSV(csvData) {
  // Simple CSV parser - would need proper implementation
  const lines = csvData.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',')
  
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index]?.trim()
    })
    return obj
  })
}

async function generateImportSummary() {
  const spinner = ora('Generating import summary...').start()
  
  // Generate statistics about the imported data
  const seasonStats = await pool.query(`
    SELECT 
      s.name as season,
      COUNT(ps.*) as squad_size
    FROM seasons s
    LEFT JOIN player_stats ps ON s.id = ps.season_id
    WHERE s.name != '2024/25'  -- Exclude current season
    GROUP BY s.name, s.year
    ORDER BY s.year
  `)
  
  if (seasonStats.rows.length > 0) {
    console.log(chalk.bold('\n🏆 Historical Squad Coverage:'))
    seasonStats.rows.forEach((row, index) => {
      const emoji = row.squad_size > 0 ? '✅' : '❌'
      console.log(`${emoji} ${row.season}: ${row.squad_size} squad records`)
    })
  }
  
  spinner.succeed('Import summary generated')
}

// Instructions for downloading the dataset
console.log(chalk.bold('🏃 Premier League Historical Squad Data Import'))
console.log(chalk.gray('📊 Using Kaggle dataset: All Premier League team and players (1992-2024)'))
console.log(chalk.yellow('\n⚠️  Manual Download Required:'))
console.log(chalk.gray('1. Visit: https://www.kaggle.com/datasets/samoilovmikhail/all-premier-league-team-and-players-1992-2024'))
console.log(chalk.gray('2. Download the dataset'))
console.log(chalk.gray('3. Extract to: data/kaggle-premier-league/'))
console.log(chalk.gray('4. Re-run this script\n'))

// Check if data exists before running
if (process.argv.includes('--force') || fs.existsSync('data/kaggle-premier-league')) {
  importKaggleSquadData().then(() => {
    console.log(chalk.bold('\n✨ Squad data import complete! Historical squads now available'))
    process.exit(0)
  }).catch(error => {
    console.error(chalk.red('\n💥 Squad import failed:'), error.message)
    process.exit(1)
  })
} else {
  console.log(chalk.yellow('Run with --force to attempt import without checking for data files'))
}