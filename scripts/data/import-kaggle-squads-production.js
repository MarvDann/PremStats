#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

/**
 * PRODUCTION Kaggle Squad Data Import Script
 * 
 * Features:
 * - Fixed CSV parser for quoted fields with commas
 * - Automatic nationality cleaning (removes brackets/quotes)
 * - Robust data validation
 * - Transfer handling (multiple teams per player per season)
 * - Detailed progress reporting
 * 
 * Usage: node scripts/data/import-kaggle-squads-production.js
 */

async function importKaggleSquadDataProduction() {
  const spinner = ora('Starting PRODUCTION Kaggle squad data import...').start()
  
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
    let totalCorruptedSkipped = 0
    
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
        let seasonCorrupted = 0
        
        for (const teamFile of teamFiles) {
          const teamFilePath = path.join(seasonPath, teamFile)
          const teamName = extractTeamName(teamFile)
          
          // Get team ID
          const teamId = await getTeamId(teamName)
          if (!teamId) {
            console.log(chalk.yellow(`Warning: Team not found: ${teamName}`))
            continue
          }
          
          // Parse CSV with validation and nationality cleaning
          const { validPlayers, corruptedCount } = await parseTeamCSVProduction(teamFilePath)
          seasonCorrupted += corruptedCount
          
          for (const playerData of validPlayers) {
            // Create or get player with cleaned data
            const playerId = await createOrGetPlayerProduction(playerData)
            
            // Create squad record
            const squadRecordCreated = await createSquadRecord(playerId, seasonId, teamId)
            if (squadRecordCreated) {
              seasonSquadRecords++
            }
            
            seasonPlayers++
          }
        }
        
        totalPlayersProcessed += seasonPlayers
        totalSquadRecords += seasonSquadRecords
        totalCorruptedSkipped += seasonCorrupted
        
        const corruptedNote = seasonCorrupted > 0 ? chalk.red(` (${seasonCorrupted} corrupted)`) : ''
        spinner.succeed(`✅ ${seasonName}: ${seasonPlayers} players, ${seasonSquadRecords} squad records${corruptedNote}`)
        
      } catch (error) {
        spinner.warn(`Failed to process ${seasonName}: ${error.message}`)
      }
    }
    
    spinner.succeed(chalk.green('🎉 PRODUCTION squad data import completed!'))
    
    console.log(chalk.bold('\n📊 Final Import Summary:'))
    console.log(chalk.green(`• Total players processed: ${totalPlayersProcessed}`))
    console.log(chalk.green(`• Total squad records created: ${totalSquadRecords}`))
    console.log(chalk.red(`• Corrupted records skipped: ${totalCorruptedSkipped}`))
    console.log(chalk.blue(`• Seasons processed: ${seasonDirs.length}`))
    
    // Test query for legendary players with clean nationalities
    await testLegendaryPlayersWithNationalities()
    
  } catch (error) {
    spinner.fail(chalk.red(`Import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function parseTeamCSVProduction(filePath) {
  return new Promise((resolve) => {
    const validPlayers = []
    let corruptedCount = 0
    
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        resolve({ validPlayers: [], corruptedCount: 0 })
        return
      }
      
      // Parse header with FIXED CSV parser
      const headers = parseCSVLineFixed(lines[0])
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name')
      const positionIndex = headers.findIndex(h => h.toLowerCase() === 'position')
      const nationalityIndex = headers.findIndex(h => h.toLowerCase() === 'nationality')
      const dateOfBirthIndex = headers.findIndex(h => h.toLowerCase().includes('dateofbirth'))
      
      if (nameIndex === -1) {
        resolve({ validPlayers: [], corruptedCount: 0 })
        return
      }
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLineFixed(lines[i])
          
          if (values.length <= nameIndex) {
            corruptedCount++
            continue
          }
          
          const name = values[nameIndex]?.trim()
          
          // Validate player name
          if (!isValidPlayerName(name)) {
            corruptedCount++
            continue
          }
          
          validPlayers.push({
            name: name,
            position: values[positionIndex]?.trim() || null,
            nationality: cleanNationalityProduction(values[nationalityIndex]) || null,
            dateOfBirth: values[dateOfBirthIndex]?.trim() || null
          })
          
        } catch (error) {
          corruptedCount++
          continue
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`Error reading ${filePath}: ${error.message}`))
    }
    
    resolve({ validPlayers, corruptedCount })
  })
}

// FIXED CSV parser that properly handles quoted fields with commas
function parseCSVLineFixed(line) {
  const values = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      // Toggle quote state but don't include the quote in output
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      // Only split on comma if we're not inside quotes
      values.push(current.trim())
      current = ''
    } else {
      // Add all other characters (including commas inside quotes)
      current += char
    }
    
    i++
  }
  
  // Add the final value
  values.push(current.trim())
  return values
}

// PRODUCTION nationality cleaner - handles all formats
function cleanNationalityProduction(nationality) {
  if (!nationality || typeof nationality !== 'string') return null
  
  // Remove surrounding brackets and quotes
  let cleaned = nationality.replace(/^\[|\]$/g, '').trim()
  
  // Split by comma and clean each nationality
  const nationalities = cleaned.split(',').map(nat => {
    // Remove quotes and extra whitespace
    return nat.replace(/['"]/g, '').trim()
  }).filter(nat => nat.length > 0) // Remove empty entries
  
  // Join back with comma and space for multi-nationalities
  const result = nationalities.join(', ')
  
  return result || null
}

function isValidPlayerName(name) {
  if (!name || typeof name !== 'string') return false
  
  name = name.trim()
  
  // Skip if empty
  if (name.length === 0) return false
  
  // Skip obvious date patterns
  if (/^[A-Z][a-z]{2} \d{1,2}/.test(name)) return false
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(name)) return false
  if (/^\d{4}-\d{2}-\d{2}/.test(name)) return false
  
  // Skip numbers only or years
  if (/^\d+$/.test(name)) return false
  
  // Must contain at least one letter
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false
  
  // Skip if too short
  if (name.length < 2) return false
  
  return true
}

function extractTeamName(filename) {
  // Extract team name from filename like "Manchester_United_985_1998.csv"
  const parts = filename.replace('.csv', '').split('_')
  const teamParts = parts.slice(0, -2) // Remove ID and year
  
  let teamName = teamParts.join(' ')
  
  // Team name mappings to match our database
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
  const result = await pool.query(
    'SELECT id FROM seasons WHERE name = $1',
    [seasonName]
  )
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
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

async function createOrGetPlayerProduction(playerData) {
  const result = await pool.query(
    'SELECT id FROM players WHERE name = $1',
    [playerData.name]
  )
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  const insertResult = await pool.query(
    `INSERT INTO players (name, position, nationality, date_of_birth, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
    [
      playerData.name,
      playerData.position,
      playerData.nationality, // Already cleaned by cleanNationalityProduction
      playerData.dateOfBirth
    ]
  )
  
  return insertResult.rows[0].id
}

async function createSquadRecord(playerId, seasonId, teamId) {
  const existing = await pool.query(
    'SELECT id FROM player_stats WHERE player_id = $1 AND season_id = $2 AND team_id = $3',
    [playerId, seasonId, teamId]
  )
  
  if (existing.rows.length > 0) {
    return false // Already exists
  }
  
  await pool.query(
    `INSERT INTO player_stats 
     (player_id, season_id, team_id, appearances, goals, assists, yellow_cards, red_cards, created_at, updated_at)
     VALUES ($1, $2, $3, 0, 0, 0, 0, 0, NOW(), NOW())`,
    [playerId, seasonId, teamId]
  )
  
  return true // Created new record
}

async function testLegendaryPlayersWithNationalities() {
  const spinner = ora('Testing legendary players with clean nationalities...').start()
  
  const testPlayers = ['Paul Scholes', 'David Beckham', 'Thierry Henry', 'Frank Lampard']
  
  for (const playerName of testPlayers) {
    const result = await pool.query(
      `SELECT p.name, p.nationality, COUNT(ps.*) as seasons_played 
       FROM players p 
       LEFT JOIN player_stats ps ON p.id = ps.player_id 
       WHERE p.name ILIKE $1 
       GROUP BY p.name, p.nationality`,
      [`%${playerName}%`]
    )
    
    if (result.rows.length > 0) {
      const player = result.rows[0]
      spinner.succeed(`✅ ${player.name} (${player.nationality}): ${player.seasons_played} seasons`)
    } else {
      spinner.warn(`❌ ${playerName} not found`)
    }
  }
  
  spinner.succeed('Nationality test completed')
}

console.log(chalk.bold('🏭 PRODUCTION Kaggle Squad Data Import'))
console.log(chalk.gray('✨ Features: Fixed CSV parser + Auto nationality cleaning + Transfer support'))

importKaggleSquadDataProduction().then(() => {
  console.log(chalk.bold('\n🎉 PRODUCTION squad import complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 PRODUCTION squad import failed:'), error.message)
  process.exit(1)
})