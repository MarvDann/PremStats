#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

/**
 * Import goals to EXISTING matches only
 * Links goals by matching teams + date, not by ID
 */

async function importGoalsToExistingMatches() {
  const spinner = ora('Starting goals import to existing matches...').start()
  
  try {
    const matchesFile = 'data/matches-fixed.csv'
    
    if (!fs.existsSync(matchesFile)) {
      throw new Error(`Matches file not found: ${matchesFile}`)
    }
    
    // Parse matches CSV
    const { validMatches, skippedCount } = await parseMatchesCSV(matchesFile)
    
    spinner.succeed(`Parsed ${validMatches.length} valid matches (${skippedCount} skipped)`)
    
    // DEBUG: Show first match details
    console.log(`📋 First match:`, validMatches[0])
    
    let totalMatches = 0
    let matchesFound = 0
    let matchesNotFound = 0
    let totalGoals = 0
    let playerLinkingIssues = 0
    
    // Process first 500 matches to build up goal data  
    const testMatches = validMatches.slice(0, 500)
    console.log(`🚀 Processing ${testMatches.length} matches for debugging`)
    
    for (const matchData of testMatches) {
      try {
        totalMatches++
        
        // Find existing match by teams and date
        const existingMatch = await findExistingMatch(matchData)
        
        if (!existingMatch) {
          matchesNotFound++
          console.log(chalk.yellow(`⚠️  Match not found: ${matchData.homeTeam} vs ${matchData.awayTeam} on ${matchData.date}`))
          continue
        }
        
        if (matchesFound <= 3) {
          console.log(chalk.green(`✅ Match found: ${matchData.homeTeam} vs ${matchData.awayTeam} -> DB ID ${existingMatch.id}`))
        }
        
        matchesFound++
        const matchId = existingMatch.id
        
        // Import goals for this existing match
        if (matchData.homeGoalScorers || matchData.awayGoalScorers) {
          if (totalGoals < 20 || totalGoals % 50 === 0) {
            console.log(`⚽ Processing goals for match ${matchId}: ${matchData.homeTeam} vs ${matchData.awayTeam}`)
          }
          
          const homeGoals = await importGoalsForTeam(
            matchId, 
            existingMatch.home_team_id,
            existingMatch.away_team_id, 
            matchData.homeGoalScorers, 
            matchData.homeGoalMinutes
          )
          totalGoals += homeGoals.successful
          playerLinkingIssues += homeGoals.linkingIssues
          
          const awayGoals = await importGoalsForTeam(
            matchId, 
            existingMatch.away_team_id,
            existingMatch.home_team_id,
            matchData.awayGoalScorers, 
            matchData.awayGoalMinutes
          )
          totalGoals += awayGoals.successful
          playerLinkingIssues += awayGoals.linkingIssues
          
          if (totalGoals < 20 || totalGoals % 50 === 0) {
            console.log(`✅ Imported ${homeGoals.successful + awayGoals.successful} goals, ${homeGoals.linkingIssues + awayGoals.linkingIssues} linking issues`)
          }
        }
        
        // Progress reporting
        if (matchesFound % 500 === 0) {
          spinner.text = `Found ${matchesFound} matches, imported ${totalGoals} goals...`
        }
        
      } catch (error) {
        console.log(chalk.yellow(`⚠️  Match processing error: ${error.message}`))
        continue
      }
    }
    
    spinner.succeed(chalk.green('🎉 Goals import to existing matches completed!'))
    
    console.log(chalk.bold('\\n📊 Final Import Summary:'))
    console.log(chalk.green(`• Total CSV matches processed: ${totalMatches}`))
    console.log(chalk.green(`• Existing matches found: ${matchesFound}`))
    console.log(chalk.yellow(`• Matches not found in DB: ${matchesNotFound}`))
    console.log(chalk.green(`• Total goals imported: ${totalGoals}`))
    console.log(chalk.yellow(`• Player linking issues: ${playerLinkingIssues}`))
    console.log(chalk.blue(`• Match rate: ${((matchesFound/totalMatches)*100).toFixed(1)}%`))
    
  } catch (error) {
    spinner.fail(chalk.red(`Import failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

async function parseMatchesCSV(filePath) {
  // Reuse existing CSV parsing logic
  return new Promise((resolve) => {
    const validMatches = []
    let skippedCount = 0
    
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8')
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim())
      
      if (lines.length < 2) {
        resolve({ validMatches: [], skippedCount: 0 })
        return
      }
      
      const headers = parseCSVLineFixed(lines[0])
      const columnMap = mapColumns(headers)
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLineFixed(lines[i])
          
          if (values.length < headers.length - 5) {
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

// Reuse existing helper functions
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
    const cleanHeader = header.toLowerCase().replace(/﻿/g, '')
    
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
    }
  })
  
  // Debug: Log actual goal column positions found
  console.log('Goal column mapping:', {
    homeGoalMinutes: map.homeGoalMinutes,
    homeGoalScorers: map.homeGoalScorers,
    awayGoalMinutes: map.awayGoalMinutes,
    awayGoalScorers: map.awayGoalScorers
  })
  
  return map
}

function extractMatchData(values, columnMap) {
  const dateString = values[columnMap.date]?.trim()
  const year = parseInt(values[columnMap.year])
  
  let matchDate = null
  if (dateString && year) {
    try {
      const dateMatch = dateString.match(/(\w+), (\w+) (\d+)/)
      if (dateMatch) {
        const monthName = dateMatch[2]
        const day = parseInt(dateMatch[3])
        const fullDateString = `${monthName} ${day}, ${year}`
        // Create date in UTC to avoid timezone conversion issues
        const tempDate = new Date(fullDateString + ' UTC')
        matchDate = tempDate.toISOString().split('T')[0]
      }
    } catch (error) {
      // Skip invalid dates
    }
  }
  
  const result = {
    homeTeam: values[columnMap.home]?.trim(),
    awayTeam: values[columnMap.away]?.trim(), 
    date: matchDate,
    year: year,
    homeScore: parseInt(values[columnMap.homeScore]) || 0,
    awayScore: parseInt(values[columnMap.awayScore]) || 0,
    homeGoalScorers: values[columnMap.homeGoalScorers]?.trim() || '',
    awayGoalScorers: values[columnMap.awayGoalScorers]?.trim() || '',
    homeGoalMinutes: values[columnMap.homeGoalMinutes]?.trim() || '',
    awayGoalMinutes: values[columnMap.awayGoalMinutes]?.trim() || ''
  }
  
  // Debug first few matches with goal data
  if (result.homeGoalScorers || result.awayGoalScorers) {
    console.log('🎯 Found match with goals:', {
      teams: `${result.homeTeam} vs ${result.awayTeam}`,
      homeGoalScorers: result.homeGoalScorers,
      homeGoalMinutes: result.homeGoalMinutes,
      awayGoalScorers: result.awayGoalScorers,
      awayGoalMinutes: result.awayGoalMinutes
    })
  }
  
  return result
}

function isValidMatchData(matchData) {
  return (
    matchData.homeTeam && 
    matchData.awayTeam && 
    matchData.date &&
    matchData.year >= 2001 && 
    matchData.year <= 2022 &&
    typeof matchData.homeScore === 'number' &&
    typeof matchData.awayScore === 'number'
  )
}

async function findExistingMatch(matchData) {
  // Team name mappings
  const teamMappings = {
    'Arsenal': 'Arsenal',
    'Aston Villa': 'Aston Villa', 
    'Chelsea': 'Chelsea',
    'Everton': 'Everton',
    'Liverpool': 'Liverpool',
    'Manchester City': 'Manchester City',
    'Manchester United': 'Manchester United',
    'Newcastle United': 'Newcastle United',
    'Tottenham Hotspur': 'Tottenham',
    'West Ham United': 'West Ham United',
    'Blackburn Rovers': 'Blackburn Rovers',
    'Bolton Wanderers': 'Bolton Wanderers',
    'Derby County': 'Derby County',
    'Leeds United': 'Leeds United',
    'Leicester City': 'Leicester City',
    'Middlesbrough': 'Middlesbrough',
    'Southampton': 'Southampton',
    'Sunderland': 'Sunderland',
    'Charlton Athletic': 'Charlton Athletic',
    'Fulham': 'Fulham',
    'Ipswich Town': 'Ipswich Town'
  }
  
  const mappedHomeTeam = teamMappings[matchData.homeTeam] || matchData.homeTeam
  const mappedAwayTeam = teamMappings[matchData.awayTeam] || matchData.awayTeam
  
  const result = await pool.query(`
    SELECT m.id, m.home_team_id, m.away_team_id 
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ht.name = $1 
      AND at.name = $2 
      AND m.match_date = $3
    LIMIT 1
  `, [mappedHomeTeam, mappedAwayTeam, matchData.date])
  
  return result.rows.length > 0 ? result.rows[0] : null
}

async function importGoalsForTeam(matchId, scoringTeamId, opponentTeamId, goalScorersText, goalMinutesText) {
  let successful = 0
  let linkingIssues = 0
  
  if (!goalScorersText || !goalMinutesText) {
    return { successful, linkingIssues }
  }
  
  try {
    const scorers = goalScorersText.split(':').map(s => s.trim()).filter(s => s.length > 0)
    const minutes = goalMinutesText.split(':').map(m => m.trim()).filter(m => m.length > 0)
    
    for (let i = 0; i < Math.min(scorers.length, minutes.length); i++) {
      const playerName = cleanPlayerName(scorers[i])
      const minute = parseGoalMinute(minutes[i])
      
      if (playerName && minute !== null) {
        const playerId = await findPlayerId(playerName, scoringTeamId)
        
        if (playerId) {
          const goalCreated = await createGoalRecord(matchId, playerId, scoringTeamId, minute)
          if (goalCreated) {
            successful++
          }
        } else {
          linkingIssues++
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
  
  let cleaned = name.replace(/\s*PEN\s*:?/gi, '').trim()
  cleaned = cleaned.replace(/^[:\s]+|[:\s]+$/g, '').trim()
  
  return cleaned.length > 0 ? cleaned : null
}

function parseGoalMinute(minuteText) {
  if (!minuteText || typeof minuteText !== 'string') return null
  
  const match = minuteText.match(/^(\d+)/)
  return match ? parseInt(match[1]) : null
}

async function findPlayerId(playerName, teamId) {
  // Try exact match first
  let result = await pool.query(`
    SELECT DISTINCT p.id 
    FROM players p 
    JOIN player_stats ps ON p.id = ps.player_id 
    WHERE p.name = $1 AND ps.team_id = $2
  `, [playerName, teamId])
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  // Try fuzzy match
  result = await pool.query(`
    SELECT DISTINCT p.id 
    FROM players p 
    JOIN player_stats ps ON p.id = ps.player_id 
    WHERE p.name ILIKE $1 AND ps.team_id = $2
  `, [`%${playerName}%`, teamId])
  
  if (result.rows.length > 0) {
    return result.rows[0].id
  }
  
  // Try without team constraint
  result = await pool.query(`
    SELECT id FROM players WHERE name ILIKE $1 LIMIT 1
  `, [`%${playerName}%`])
  
  return result.rows.length > 0 ? result.rows[0].id : null
}

async function createGoalRecord(matchId, playerId, scoringTeamId, minute) {
  try {
    const isPenalty = minute && minute.toString().includes('PEN')
    
    await pool.query(`
      INSERT INTO goals 
      (match_id, player_id, team_id, minute, is_penalty, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [matchId, playerId, scoringTeamId, parseInt(minute) || minute, isPenalty])
    
    return true
    
  } catch (error) {
    console.log(chalk.yellow(`Goal record creation error: ${error.message}`))
    return false
  }
}

console.log(chalk.bold('🎯 Import Goals to Existing Matches'))
console.log(chalk.gray('✨ Links by teams + date, not ID'))

importGoalsToExistingMatches().then(() => {
  console.log(chalk.bold('\\n🎉 Goals import to existing matches complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\\n💥 Goals import failed:'), error.message)
  process.exit(1)
})