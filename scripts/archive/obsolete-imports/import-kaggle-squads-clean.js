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

async function importKaggleSquadDataClean() {
  const spinner = ora('Starting CLEAN Kaggle Premier League squad data import...').start()
  
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
    let corruptedRecordsSkipped = 0
    
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
          
          // Parse CSV with validation
          const { validPlayers, corruptedCount, corruptedDetails } = await parseTeamCSVWithValidation(teamFilePath)
          seasonCorrupted += corruptedCount
          
          // Report corruption details for this team
          if (corruptedCount > 0) {
            console.log(chalk.yellow(`\n  ⚠️  ${teamName} - ${corruptedCount} corrupted records:`))
            corruptedDetails.slice(0, 5).forEach((detail, index) => { // Show first 5 corrupted records
              console.log(chalk.gray(`    ${index + 1}. Line ${detail.line}: ${detail.reason}`))
              if (detail.nameValue) {
                console.log(chalk.gray(`       Name value: "${detail.nameValue}"`))
              }
              if (detail.allValues) {
                console.log(chalk.gray(`       First 5 columns: [${detail.allValues.map(v => `"${v}"`).join(', ')}]`))
              }
              console.log(chalk.gray(`       Raw data: ${detail.rawData}`))
              console.log('') // Empty line for readability
            })
            if (corruptedDetails.length > 5) {
              console.log(chalk.gray(`    ... and ${corruptedDetails.length - 5} more corrupted records`))
            }
          }
          
          for (const playerData of validPlayers) {
            // Create or get player
            const playerId = await createOrGetPlayer(playerData)
            
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
        corruptedRecordsSkipped += seasonCorrupted
        
        const corruptedNote = seasonCorrupted > 0 ? chalk.red(` (${seasonCorrupted} corrupted skipped)`) : ''
        spinner.succeed(`✅ ${seasonName}: ${seasonPlayers} players, ${seasonSquadRecords} squad records${corruptedNote}`)
        
      } catch (error) {
        spinner.warn(`Failed to process ${seasonName}: ${error.message}`)
      }
    }
    
    spinner.succeed(chalk.green('🎉 Clean Kaggle squad data import completed successfully!'))
    
    console.log(chalk.bold('\n📊 Import Summary:'))
    console.log(`• Total players processed: ${totalPlayersProcessed}`)
    console.log(`• Total squad records created: ${totalSquadRecords}`)
    console.log(`• Corrupted records skipped: ${corruptedRecordsSkipped}`)
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

async function parseTeamCSVWithValidation(filePath) {
  return new Promise((resolve) => {
    const validPlayers = []
    let corruptedCount = 0
    const corruptedDetails = []
    
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        resolve({ validPlayers: [], corruptedCount: 0, corruptedDetails: [] })
        return
      }
      
      // Parse header
      const headers = parseCSVLine(lines[0])
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name')
      const positionIndex = headers.findIndex(h => h.toLowerCase() === 'position')
      const nationalityIndex = headers.findIndex(h => h.toLowerCase() === 'nationality')
      const dateOfBirthIndex = headers.findIndex(h => h.toLowerCase().includes('dateofbirth'))
      
      if (nameIndex === -1) {
        console.log(chalk.yellow(`Warning: No 'name' column found in ${filePath}`))
        console.log(chalk.gray(`Available headers: ${headers.join(', ')}`))
        resolve({ validPlayers: [], corruptedCount: 0, corruptedDetails: [] })
        return
      }
      
      console.log(chalk.blue(`  📋 CSV Structure: name at index ${nameIndex}, total columns: ${headers.length}`))
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i])
          
          if (values.length <= nameIndex) {
            corruptedCount++
            corruptedDetails.push({
              line: i + 1,
              reason: `Insufficient columns (${values.length} vs expected ${nameIndex + 1})`,
              rawData: lines[i].substring(0, 100) + (lines[i].length > 100 ? '...' : ''),
              parsedValues: values.slice(0, 5) // First 5 values for debugging
            })
            continue
          }
          
          const name = values[nameIndex]?.trim()
          
          // Validate player name with detailed reasons
          const validation = validatePlayerNameDetailed(name)
          if (!validation.valid) {
            corruptedCount++
            corruptedDetails.push({
              line: i + 1,
              reason: validation.reason,
              nameValue: name,
              allValues: values.slice(0, 5), // First 5 values for context
              rawData: lines[i].substring(0, 100) + (lines[i].length > 100 ? '...' : '')
            })
            continue
          }
          
          validPlayers.push({
            name: name,
            position: values[positionIndex]?.trim() || null,
            nationality: cleanNationality(values[nationalityIndex]) || null,
            dateOfBirth: values[dateOfBirthIndex]?.trim() || null
          })
          
        } catch (error) {
          corruptedCount++
          corruptedDetails.push({
            line: i + 1,
            reason: `Parse error: ${error.message}`,
            rawData: lines[i].substring(0, 100) + (lines[i].length > 100 ? '...' : '')
          })
          continue
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`Error reading ${filePath}: ${error.message}`))
    }
    
    resolve({ validPlayers, corruptedCount, corruptedDetails })
  })
}

function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  // Add the last value
  values.push(current.trim())
  
  return values
}

function validatePlayerNameDetailed(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Name is null, undefined, or not a string' }
  }
  
  const originalName = name
  // Remove quotes if present
  name = name.replace(/^"|"$/g, '').trim()
  
  // Skip if empty
  if (name.length === 0) {
    return { valid: false, reason: 'Name is empty after cleaning' }
  }
  
  // Skip obvious date patterns
  if (/^[A-Z][a-z]{2} \d{1,2}/.test(name)) {
    return { valid: false, reason: `Date pattern detected: "${name}" (likely "Aug 14" etc.)` }
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(name)) {
    return { valid: false, reason: `Date format detected: "${name}" (MM/DD/YYYY)` }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(name)) {
    return { valid: false, reason: `Date format detected: "${name}" (YYYY-MM-DD)` }
  }
  
  // Skip numbers only
  if (/^\d+$/.test(name)) {
    return { valid: false, reason: `Numbers only: "${name}"` }
  }
  
  // Must contain at least one letter
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) {
    return { valid: false, reason: `No letters found: "${name}"` }
  }
  
  // Skip single words that are too short (but allow valid single names)
  if (name.length < 2) {
    return { valid: false, reason: `Name too short: "${name}" (${name.length} characters)` }
  }
  
  // Additional validation for obvious non-names
  if (/^[\s\-_.,;:]+$/.test(name)) {
    return { valid: false, reason: `Only punctuation/whitespace: "${name}"` }
  }
  
  return { valid: true, reason: 'Valid player name' }
}

// Keep the old function for backward compatibility
function isValidPlayerName(name) {
  return validatePlayerNameDetailed(name).valid
}

function cleanNationality(nationality) {
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

async function createOrGetPlayer(playerData) {
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
      playerData.nationality,
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

async function testLegendaryPlayers() {
  const spinner = ora('Testing for legendary players...').start()
  
  const legends = ['Paul Scholes', 'David Beckham', 'Ryan Giggs', 'Frank Lampard', 'Steven Gerrard', 'Thierry Henry']
  
  for (const legend of legends) {
    const result = await pool.query(
      `SELECT p.name, COUNT(ps.*) as seasons_played 
       FROM players p 
       LEFT JOIN player_stats ps ON p.id = ps.player_id 
       WHERE p.name ILIKE $1 
       GROUP BY p.name`,
      [`%${legend}%`]
    )
    
    if (result.rows.length > 0) {
      const player = result.rows[0]
      spinner.succeed(`✅ Found ${player.name}: ${player.seasons_played} seasons`)
    } else {
      spinner.warn(`❌ ${legend} not found`)
    }
  }
  
  spinner.succeed('Legendary player test completed')
}

console.log(chalk.bold('🚀 Starting CLEAN Kaggle squad data import...'))
console.log(chalk.gray('🧹 With improved CSV parsing and data validation'))

importKaggleSquadDataClean().then(() => {
  console.log(chalk.bold('\n✨ Clean squad data import complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Clean squad import failed:'), error.message)
  process.exit(1)
})