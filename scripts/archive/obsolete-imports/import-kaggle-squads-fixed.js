#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'
import csvParser from 'csv-parser'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function importKaggleSquadData() {
  const spinner = ora('Starting Kaggle Premier League squad data import...').start()
  
  try {
    const dataPath = 'data/kaggle-premier-league/DATA_CSV'
    
    if (!fs.existsSync(dataPath)) {
      throw new Error(`Data directory not found: ${dataPath}`)
    }
    
    // Get all season directories
    const seasonDirs = fs.readdirSync(dataPath)
      .filter(dir => dir.startsWith('Season_'))
      .sort()
    
    spinner.succeed(`Found ${seasonDirs.length} seasons to process`)
    
    let totalPlayersProcessed = 0
    let totalSquadRecords = 0
    
    for (const seasonDir of seasonDirs) {
      const seasonPath = path.join(dataPath, seasonDir)
      const seasonYear = seasonDir.replace('Season_', '')
      const seasonName = `${seasonYear}/${(parseInt(seasonYear) + 1).toString().slice(-2)}`
      
      spinner.start(`Processing ${seasonName}...`)
      
      try {
        // Get or create season
        const seasonId = await getOrCreateSeason(seasonName, parseInt(seasonYear))
        
        // Process all team files in this season
        const teamFiles = fs.readdirSync(seasonPath)
          .filter(file => file.endsWith('.csv'))
        
        let seasonPlayers = 0
        let seasonSquadRecords = 0
        
        for (const teamFile of teamFiles) {
          const teamFilePath = path.join(seasonPath, teamFile)
          const teamName = extractTeamName(teamFile)
          
          // Get team ID
          const teamId = await getTeamId(teamName)
          if (!teamId) {
            console.log(chalk.yellow(`Warning: Team not found: ${teamName}`))
            continue
          }
          
          // Parse CSV and import players
          const players = await parseTeamCSV(teamFilePath)
          
          for (const playerData of players) {
            // Create or get player
            const playerId = await createOrGetPlayer(playerData)
            
            // Create squad record (player_stats with 0 stats = squad membership)
            const squadRecordCreated = await createSquadRecord(playerId, seasonId, teamId)
            if (squadRecordCreated) {
              seasonSquadRecords++
            }
            
            seasonPlayers++
          }
        }
        
        totalPlayersProcessed += seasonPlayers
        totalSquadRecords += seasonSquadRecords
        
        spinner.succeed(`✅ ${seasonName}: ${seasonPlayers} players, ${seasonSquadRecords} squad records`)
        
      } catch (error) {
        spinner.warn(`Failed to process ${seasonName}: ${error.message}`)
      }
    }
    
    spinner.succeed(chalk.green('🎉 Kaggle squad data import completed successfully!'))
    
    console.log(chalk.bold('\n📊 Import Summary:'))
    console.log(`• Total players processed: ${totalPlayersProcessed}`)
    console.log(`• Total squad records created: ${totalSquadRecords}`)
    console.log(`• Seasons processed: ${seasonDirs.length}`)
    
    // Test query for legendary players
    await testLegendaryPlayers()
    
  } catch (error) {
    spinner.fail(chalk.red(`Import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function parseTeamCSV(filePath) {
  return new Promise((resolve, reject) => {
    const players = []
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.name && row.name.trim()) {
          players.push({
            name: row.name.trim(),
            position: row.position || null,
            nationality: row.nationality || null,
            dateOfBirth: row.dateOfBirth || null,
            height: row.height || null
          })
        }
      })
      .on('end', () => {
        resolve(players)
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

function extractTeamName(filename) {
  // Extract team name from filename like "Manchester_United_985_1998.csv"
  // Split by underscore and take everything except the last two parts (ID and year)
  const parts = filename.replace('.csv', '').split('_')
  const teamParts = parts.slice(0, -2) // Remove ID and year
  
  // Handle special cases
  let teamName = teamParts.join(' ')
  
  // Clean up team names to match our database
  const teamMappings = {
    'Manchester United': 'Manchester United',
    'Manchester City': 'Manchester City', 
    'AFC Bournemouth': 'Bournemouth',
    'Brighton and Hove Albion': 'Brighton & Hove Albion',
    'Tottenham Hotspur': 'Tottenham',
    'West Bromwich Albion': 'West Bromwich Albion',
    'West Ham United': 'West Ham United',
    'Wolverhampton Wanderers': 'Wolverhampton Wanderers',
    'Sheffield United': 'Sheffield United',
    'Sheffield Wednesday': 'Sheffield Wednesday',
    'Queens Park Rangers': 'Queens Park Rangers',
    'Crystal Palace': 'Crystal Palace',
    'Nottingham Forest': 'Nottingham Forest',
    'Leicester City': 'Leicester City',
    'Norwich City': 'Norwich City',
    'Birmingham City': 'Birmingham City',
    'Blackburn Rovers': 'Blackburn Rovers',
    'Bolton Wanderers': 'Bolton Wanderers',
    'Charlton Athletic': 'Charlton Athletic',
    'Hull City': 'Hull City',
    'Stoke City': 'Stoke City',
    'Swansea City': 'Swansea City',
    'Cardiff City': 'Cardiff City',
    'Burnley FC': 'Burnley',
    'Watford FC': 'Watford',
    'Fulham FC': 'Fulham',
    'Arsenal FC': 'Arsenal',
    'Chelsea FC': 'Chelsea',
    'Liverpool FC': 'Liverpool',
    'Everton FC': 'Everton',
    'Southampton FC': 'Southampton',
    'Middlesbrough FC': 'Middlesbrough',
    'Portsmouth FC': 'Portsmouth',
    'Reading FC': 'Reading',
    'Sunderland AFC': 'Sunderland',
    'Wigan Athletic': 'Wigan Athletic',
    'Huddersfield Town': 'Huddersfield Town',
    'Ipswich Town': 'Ipswich Town',
    'Leeds United': 'Leeds United',
    'Newcastle United': 'Newcastle United',
    'Coventry City': 'Coventry City',
    'Derby County': 'Derby County',
    'Oldham Athletic': 'Oldham Athletic',
    'Wimbledon FC (- 2004)': 'Wimbledon',
    'Bradford City': 'Bradford City',
    'Blackpool FC': 'Blackpool',
    'Barnsley FC': 'Barnsley',
    'Luton Town': 'Luton Town',
    'Brentford': 'Brentford'
  }
  
  return teamMappings[teamName] || teamName
}

async function getTeamId(teamName) {
  const result = await pool.query(
    'SELECT id FROM teams WHERE name = $1 OR name ILIKE $2',
    [teamName, `%${teamName}%`]
  )
  
  return result.rows.length > 0 ? result.rows[0].id : null
}

async function getOrCreateSeason(seasonName, year) {
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
      new Date(`${year}-08-01`),
      new Date(`${year + 1}-05-31`),
      year
    ]
  )
  
  return insertResult.rows[0].id
}

async function createOrGetPlayer(playerData) {
  // Check if player exists
  const result = await pool.query(
    'SELECT id FROM players WHERE name = $1',
    [playerData.name]
  )
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  // Create new player
  const insertResult = await pool.query(
    `INSERT INTO players (name, position, nationality, date_of_birth, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
    [
      playerData.name,
      playerData.position,
      playerData.nationality,
      playerData.dateOfBirth
    ]
  )
  
  return insertResult.rows[0].id
}

async function createSquadRecord(playerId, seasonId, teamId) {
  // Check if squad record already exists
  const existing = await pool.query(
    'SELECT id FROM player_stats WHERE player_id = $1 AND season_id = $2 AND team_id = $3',
    [playerId, seasonId, teamId]
  )
  
  if (existing.rows.length > 0) {
    return false // Already exists
  }
  
  // Create squad record
  await pool.query(
    `INSERT INTO player_stats 
     (player_id, season_id, team_id, appearances, goals, assists, yellow_cards, red_cards, created_at, updated_at)
     VALUES ($1, $2, $3, 0, 0, 0, 0, 0, NOW(), NOW())`,
    [playerId, seasonId, teamId]
  )
  
  return true // Created new record
}

async function testLegendaryPlayers() {
  const spinner = ora('Testing for legendary players...').start()
  
  const legends = ['Paul Scholes', 'David Beckham', 'Ryan Giggs', 'Frank Lampard', 'Steven Gerrard', 'Thierry Henry']
  
  for (const legend of legends) {
    const result = await pool.query(
      `SELECT p.name, COUNT(ps.*) as seasons_played, 
              STRING_AGG(DISTINCT t.name, ', ') as teams,
              STRING_AGG(DISTINCT s.name, ', ') as seasons
       FROM players p 
       LEFT JOIN player_stats ps ON p.id = ps.player_id 
       LEFT JOIN teams t ON ps.team_id = t.id 
       LEFT JOIN seasons s ON ps.season_id = s.id 
       WHERE p.name ILIKE $1 
       GROUP BY p.name`,
      [`%${legend}%`]
    )
    
    if (result.rows.length > 0) {
      const player = result.rows[0]
      spinner.succeed(`✅ Found ${player.name}: ${player.seasons_played} seasons with ${player.teams}`)
    } else {
      spinner.warn(`❌ ${legend} not found`)
    }
  }
  
  spinner.succeed('Legendary player test completed')
}

console.log(chalk.bold('🚀 Starting FIXED Kaggle squad data import...'))

// csv-parser dependency is already imported above

importKaggleSquadData().then(() => {
  console.log(chalk.bold('\n✨ Fixed squad data import complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Fixed squad import failed:'), error.message)
  process.exit(1)
})