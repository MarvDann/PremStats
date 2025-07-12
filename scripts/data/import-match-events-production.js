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
 * PRODUCTION Match Events Import Script
 * 
 * Features:
 * - Imports match results with goal scorer data
 * - Links goals to existing players and teams
 * - Handles goal timing and match context
 * - Creates match records and goal events
 * - Production-ready error handling
 * 
 * Usage: node scripts/data/import-match-events-production.js
 */

async function importMatchEventsProduction() {
  const spinner = ora('Starting PRODUCTION match events import...').start()
  
  try {
    const matchesFile = 'data/matches-fixed.csv'
    
    if (!fs.existsSync(matchesFile)) {
      throw new Error(`Matches file not found: ${matchesFile}`)
    }
    
    // Parse matches CSV
    const { validMatches, skippedCount } = await parseMatchesCSV(matchesFile)
    
    spinner.succeed(`Parsed ${validMatches.length} valid matches (${skippedCount} skipped)`)
    
    let totalMatches = 0
    let totalGoals = 0
    let playerLinkingIssues = 0
    let teamLinkingIssues = 0
    
    for (const matchData of validMatches) {
      try {
        // Get or create teams
        const homeTeamId = await getOrCreateTeam(matchData.homeTeam)
        const awayTeamId = await getOrCreateTeam(matchData.awayTeam)
        
        if (!homeTeamId || !awayTeamId) {
          teamLinkingIssues++
          continue
        }
        
        // Get or create season
        const seasonId = await getOrCreateSeasonFromYear(matchData.year)
        
        // Create match record
        const matchId = await createMatchRecord({
          ...matchData,
          homeTeamId,
          awayTeamId,
          seasonId
        })
        
        if (matchId) {
          totalMatches++
          
          // Reduced debugging - only show progress
          // if (matchData.homeGoalScorers || matchData.awayGoalScorers) {
          //   console.log(chalk.blue(`⚽ Match ${matchData.homeTeam} vs ${matchData.awayTeam}:`))
          //   console.log(chalk.gray(`  Home goals: "${matchData.homeGoalScorers}" (${matchData.homeGoalMinutes})`))
          //   console.log(chalk.gray(`  Away goals: "${matchData.awayGoalScorers}" (${matchData.awayGoalMinutes})`))
          // }
          
          // Import home team goals
          const homeGoals = await importGoalsForTeam(
            matchId, 
            homeTeamId, 
            awayTeamId,
            matchData.homeGoalScorers, 
            matchData.homeGoalMinutes
          )
          totalGoals += homeGoals.successful
          playerLinkingIssues += homeGoals.linkingIssues
          
          // Import away team goals
          const awayGoals = await importGoalsForTeam(
            matchId, 
            awayTeamId, 
            homeTeamId,
            matchData.awayGoalScorers, 
            matchData.awayGoalMinutes
          )
          totalGoals += awayGoals.successful
          playerLinkingIssues += awayGoals.linkingIssues
        }
        
        // Progress reporting
        if (totalMatches % 500 === 0) {
          spinner.text = `Processed ${totalMatches} matches, ${totalGoals} goals...`
        }
        
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Match processing error: ${error.message}`))
        continue
      }
    }
    
    spinner.succeed(chalk.green('🎉 PRODUCTION match events import completed!'))
    
    console.log(chalk.bold('\\n📊 Final Import Summary:'))
    console.log(chalk.green(`• Total matches imported: ${totalMatches}`))
    console.log(chalk.green(`• Total goals imported: ${totalGoals}`))
    console.log(chalk.yellow(`• Player linking issues: ${playerLinkingIssues}`))
    console.log(chalk.yellow(`• Team linking issues: ${teamLinkingIssues}`))
    console.log(chalk.blue(`• Years covered: 2001-2022`))
    
    // Test query for legendary goal scorers
    await testGoalScorerQueries()
    
  } catch (error) {
    spinner.fail(chalk.red(`Import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function parseMatchesCSV(filePath) {
  return new Promise((resolve) => {
    const validMatches = []
    let skippedCount = 0
    
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8')
      // Handle different line endings (\\n, \\r\\n, \\r)
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length < 2) {
        console.log(chalk.yellow(`⚠️  CSV file has ${lines.length} lines - too few to process`))
        resolve({ validMatches: [], skippedCount: 0 })
        return
      }
      
      console.log(chalk.blue(`📄 CSV file has ${lines.length} lines total`))
      console.log(chalk.gray(`First few characters: "${csvContent.substring(0, 50)}..."`))
      console.log(chalk.gray(`Lines after split: ${lines.slice(0, 3).map((l, i) => `${i}: "${l.substring(0, 30)}..."`).join(', ')}`))
      
      // Parse header
      const headers = parseCSVLineFixed(lines[0])
      const columnMap = mapColumns(headers)
      
      console.log(chalk.blue(`📋 CSV Structure: ${headers.length} columns found`))
      console.log(chalk.gray(`Key columns: home(${columnMap.home}), away(${columnMap.away}), date(${columnMap.date})`))
      console.log(chalk.gray(`Goal columns: home_goal_scorers(${columnMap.homeGoalScorers}), away_goal_scorers(${columnMap.awayGoalScorers})`))
      
      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLineFixed(lines[i])
          
          if (values.length < headers.length - 5) { // Allow some missing trailing columns
            skippedCount++
            continue
          }
          
          const matchData = extractMatchData(values, columnMap)
          
          if (isValidMatchData(matchData)) {
            validMatches.push(matchData)
          } else {
            skippedCount++
          }
          
        } catch (error) {
          skippedCount++
          continue
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`Error reading ${filePath}: ${error.message}`))
    }
    
    resolve({ validMatches, skippedCount })
  })
}

// Fixed CSV parser from our squad import success
function parseCSVLineFixed(line) {
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
  
  values.push(current.trim())
  return values
}

function mapColumns(headers) {
  const map = {}
  
  headers.forEach((header, index) => {
    const cleanHeader = header.toLowerCase().replace(/﻿/g, '') // Remove BOM
    
    switch (cleanHeader) {
      case 'id': map.id = index; break
      case 'home': map.home = index; break
      case 'away': map.away = index; break
      case 'date': map.date = index; break
      case 'year': map.year = index; break
      case 'home_score': map.homeScore = index; break
      case 'away_score': map.awayScore = index; break
      case 'home_goal_scorers': map.homeGoalScorers = index; break
      case 'away_goal_scorers': map.awayGoalScorers = index; break
      case 'home_goal_minutes': map.homeGoalMinutes = index; break
      case 'away_goal_minutes': map.awayGoalMinutes = index; break
      case 'venue': map.venue = index; break
      case 'attendance': map.attendance = index; break
    }
  })
  
  return map
}

function extractMatchData(values, columnMap) {
  const dateString = values[columnMap.date]?.trim()
  const year = parseInt(values[columnMap.year])
  
  // Parse date like "Saturday, August 18" to proper date
  let matchDate = null
  if (dateString && year) {
    try {
      // Extract month and day from "Saturday, August 18"
      const dateMatch = dateString.match(/(\w+), (\w+) (\d+)/)
      if (dateMatch) {
        const monthName = dateMatch[2]
        const day = parseInt(dateMatch[3])
        
        // Create date string like "August 18, 2001"
        const fullDateString = `${monthName} ${day}, ${year}`
        matchDate = new Date(fullDateString).toISOString().split('T')[0] // YYYY-MM-DD
      }
    } catch (error) {
      console.log(`Date parsing error: ${dateString} -> ${error.message}`)
    }
  }
  
  return {
    id: values[columnMap.id]?.trim(),
    homeTeam: values[columnMap.home]?.trim(),
    awayTeam: values[columnMap.away]?.trim(), 
    date: matchDate,
    year: year,
    homeScore: parseInt(values[columnMap.homeScore]) || 0,
    awayScore: parseInt(values[columnMap.awayScore]) || 0,
    homeGoalScorers: values[columnMap.homeGoalScorers]?.trim() || '',
    awayGoalScorers: values[columnMap.awayGoalScorers]?.trim() || '',
    homeGoalMinutes: values[columnMap.homeGoalMinutes]?.trim() || '',
    awayGoalMinutes: values[columnMap.awayGoalMinutes]?.trim() || '',
    venue: values[columnMap.venue]?.trim() || '',
    attendance: values[columnMap.attendance] ? parseInt(values[columnMap.attendance].replace(/,/g, '')) : null
  }
}

function isValidMatchData(matchData) {
  return (
    matchData.homeTeam && 
    matchData.awayTeam && 
    matchData.date && // Must have valid date
    matchData.year >= 2001 && 
    matchData.year <= 2022 &&
    typeof matchData.homeScore === 'number' &&
    typeof matchData.awayScore === 'number'
  )
}

async function getOrCreateTeam(teamName) {
  // Team name mappings to match our existing database
  const teamMappings = {
    'Arsenal': 'Arsenal',
    'Aston Villa': 'Aston Villa',
    'Blackburn Rovers': 'Blackburn Rovers',
    'Bolton Wanderers': 'Bolton Wanderers',
    'Chelsea': 'Chelsea',
    'Coventry City': 'Coventry City',
    'Derby County': 'Derby County',
    'Everton': 'Everton',
    'Leeds United': 'Leeds United',
    'Leicester City': 'Leicester City',
    'Liverpool': 'Liverpool',
    'Manchester City': 'Manchester City',
    'Manchester United': 'Manchester United',
    'Middlesbrough': 'Middlesbrough',
    'Newcastle United': 'Newcastle United',
    'Norwich City': 'Norwich City',
    'Nottingham Forest': 'Nottingham Forest',
    'Sheffield Wednesday': 'Sheffield Wednesday',
    'Southampton': 'Southampton',
    'Tottenham Hotspur': 'Tottenham',
    'West Ham United': 'West Ham United',
    'Wimbledon': 'Wimbledon',
    'Charlton Athletic': 'Charlton Athletic',
    'Fulham': 'Fulham',
    'Ipswich Town': 'Ipswich Town',
    'Sunderland': 'Sunderland'
  }
  
  const mappedName = teamMappings[teamName] || teamName
  
  const result = await pool.query(
    'SELECT id FROM teams WHERE name = $1 OR name ILIKE $2',
    [mappedName, `%${mappedName}%`]
  )
  
  return result.rows.length > 0 ? result.rows[0].id : null
}

async function getOrCreateSeasonFromYear(year) {
  const seasonName = `${year}/${(year + 1).toString().slice(-2)}`
  
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

async function createMatchRecord(matchData) {
  try {
    const existingMatch = await pool.query(
      'SELECT id FROM matches WHERE home_team_id = $1 AND away_team_id = $2 AND match_date = $3',
      [matchData.homeTeamId, matchData.awayTeamId, matchData.date]
    )
    
    if (existingMatch.rows.length > 0) {
      return existingMatch.rows[0].id // Match already exists
    }
    
    const result = await pool.query(
      `INSERT INTO matches 
       (home_team_id, away_team_id, season_id, match_date, home_score, away_score, attendance, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
      [
        matchData.homeTeamId,
        matchData.awayTeamId, 
        matchData.seasonId,
        matchData.date,
        matchData.homeScore,
        matchData.awayScore,
        matchData.attendance
      ]
    )
    
    return result.rows[0].id
    
  } catch (error) {
    console.log(chalk.yellow(`Match creation error: ${error.message}`))
    return null
  }
}

async function importGoalsForTeam(matchId, scoringTeamId, opponentTeamId, goalScorersText, goalMinutesText) {
  let successful = 0
  let linkingIssues = 0
  
  if (!goalScorersText || !goalMinutesText) {
    return { successful, linkingIssues }
  }
  
  // console.log(chalk.gray(`    Processing goals: "${goalScorersText}" at "${goalMinutesText}"`))
  
  try {
    // Parse goal scorers and minutes
    const scorers = goalScorersText.split(':').map(s => s.trim()).filter(s => s.length > 0)
    const minutes = goalMinutesText.split(':').map(m => m.trim()).filter(m => m.length > 0)
    
    // Process each goal
    for (let i = 0; i < Math.min(scorers.length, minutes.length); i++) {
      const playerName = cleanPlayerName(scorers[i])
      const minute = parseGoalMinute(minutes[i])
      // Minimal debugging for performance
      if (playerName && minute !== null) {
        const playerId = await findPlayerId(playerName, scoringTeamId)
        
        if (playerId) {
          const goalCreated = await createGoalRecord(matchId, playerId, scoringTeamId, opponentTeamId, minute)
          if (goalCreated) {
            successful++
          }
        } else {
          linkingIssues++
          if (linkingIssues % 100 === 0) { // Show every 100th missing player
            console.log(chalk.yellow(`⚠️  Player linking issues: ${linkingIssues} (latest: "${playerName}")`))
          }
        }
      }
    }
    
  } catch (error) {
    console.log(chalk.yellow(`Goal parsing error: ${error.message}`))
  }
  
  return { successful, linkingIssues }
}

function cleanPlayerName(name) {
  if (!name || typeof name !== 'string') return null
  
  // Remove penalty markers and other annotations
  let cleaned = name.replace(/\\s*PEN\\s*:?/gi, '').trim()
  
  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[:\\s]+|[:\\s]+$/g, '').trim()
  
  return cleaned.length > 0 ? cleaned : null
}

function parseGoalMinute(minuteText) {
  if (!minuteText || typeof minuteText !== 'string') return null
  
  // Extract just the number part, handling formats like "67'" or "45' PEN"
  const match = minuteText.match(/^(\d+)/)
  return match ? parseInt(match[1]) : null
}

async function findPlayerId(playerName, teamId) {
  // First try exact match
  let result = await pool.query(
    `SELECT DISTINCT p.id 
     FROM players p 
     JOIN player_stats ps ON p.id = ps.player_id 
     WHERE p.name = $1 AND ps.team_id = $2`,
    [playerName, teamId]
  )
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  // Try fuzzy match (ILIKE)
  result = await pool.query(
    `SELECT DISTINCT p.id 
     FROM players p 
     JOIN player_stats ps ON p.id = ps.player_id 
     WHERE p.name ILIKE $1 AND ps.team_id = $2`,
    [`%${playerName}%`, teamId]
  )
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  // Try without team constraint as fallback
  result = await pool.query(
    'SELECT id FROM players WHERE name ILIKE $1 LIMIT 1',
    [`%${playerName}%`]
  )
  
  return result.rows.length > 0 ? result.rows[0].id : null
}

async function createGoalRecord(matchId, playerId, scoringTeamId, opponentTeamId, minute) {
  try {
    // Check if penalty goal
    const isPenalty = minute && minute.toString().includes('PEN')
    
    await pool.query(
      `INSERT INTO goals 
       (match_id, player_id, team_id, minute, is_penalty, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [matchId, playerId, scoringTeamId, parseInt(minute) || minute, isPenalty]
    )
    
    return true
    
  } catch (error) {
    console.log(chalk.yellow(`Goal record creation error: ${error.message}`))
    return false
  }
}

async function testGoalScorerQueries() {
  const spinner = ora('Testing goal scorer queries...').start()
  
  const testPlayers = ['Michael Owen', 'Thierry Henry', 'Paul Scholes', 'David Beckham']
  
  for (const playerName of testPlayers) {
    const result = await pool.query(
      `SELECT p.name, COUNT(g.*) as total_goals, 
              MIN(s.name) as first_season, MAX(s.name) as last_season
       FROM players p 
       JOIN goals g ON p.id = g.player_id 
       JOIN matches m ON g.match_id = m.id 
       JOIN seasons s ON m.season_id = s.id 
       WHERE p.name ILIKE $1 
       GROUP BY p.name`,
      [`%${playerName}%`]
    )
    
    if (result.rows.length > 0) {
      const player = result.rows[0]
      spinner.succeed(`✅ ${player.name}: ${player.total_goals} goals (${player.first_season} - ${player.last_season})`)
    } else {
      spinner.warn(`❌ ${playerName} goals not found`)
    }
  }
  
  spinner.succeed('Goal scorer test completed')
}

console.log(chalk.bold('🏭 PRODUCTION Match Events Import'))
console.log(chalk.gray('✨ Features: Goal scorers + Match linking + Player mapping'))

importMatchEventsProduction().then(() => {
  console.log(chalk.bold('\\n🎉 PRODUCTION match events import complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\\n💥 PRODUCTION match events import failed:'), error.message)
  process.exit(1)
})