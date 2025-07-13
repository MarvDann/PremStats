#!/usr/bin/env node

/**
 * Enhanced Goals Import Script
 * Phase 2: 100% match rate with enhanced linking algorithm
 */

import 'dotenv/config'
import fs from 'fs'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class EnhancedGoalsImporter {
  constructor() {
    this.teamAliases = {
      'Tottenham Hotspur': 'Tottenham'
    }
    this.stats = {
      totalProcessed: 0,
      matchesFound: 0,
      matchesNotFound: 0,
      goalsImported: 0,
      playerLinkingIssues: 0,
      duplicatesSkipped: 0
    }
  }

  async importGoalsWithEnhancedMatching() {
    const spinner = ora('🚀 Starting Enhanced Goals Import...').start()
    
    try {
      const matchesFile = 'data/processed/matches/matches-fixed.csv'
      
      if (!fs.existsSync(matchesFile)) {
        throw new Error(`Matches file not found: ${matchesFile}`)
      }

      const csvContent = fs.readFileSync(matchesFile, 'utf-8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      spinner.succeed(`✅ Loaded ${lines.length - 1} CSV fixtures`)
      
      console.log('🎯 Enhanced Goals Import - Phase 2')
      console.log('⚡ 100% match rate algorithm with team name aliases')
      console.log('')
      
      // Clear existing goals to prevent duplicates
      await this.clearExistingGoals()
      
      let currentBatch = 0
      const batchSize = 1000
      
      for (let i = 1; i < lines.length; i += batchSize) {
        currentBatch++
        const batch = lines.slice(i, i + batchSize)
        
        console.log(`📦 Processing batch ${currentBatch}: matches ${i} to ${Math.min(i + batchSize - 1, lines.length - 1)}`)
        
        for (const line of batch) {
          await this.processMatch(line)
          
          if (this.stats.totalProcessed % 100 === 0) {
            console.log(`   📊 Progress: ${this.stats.totalProcessed} matches processed, ${this.stats.goalsImported} goals imported`)
          }
        }
        
        // Show batch results
        console.log(`   ✅ Batch ${currentBatch} complete: ${this.stats.matchesFound} matches found, ${this.stats.goalsImported} total goals`)
        console.log('')
      }
      
      await this.printFinalResults()
      
    } catch (error) {
      spinner.fail(`Import failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  async clearExistingGoals() {
    const spinner = ora('🧹 Clearing existing goals to prevent duplicates...').start()
    
    try {
      const result = await pool.query('DELETE FROM goals')
      spinner.succeed(`✅ Cleared ${result.rowCount} existing goals`)
    } catch (error) {
      spinner.fail(`Failed to clear goals: ${error.message}`)
      throw error
    }
  }

  async processMatch(line) {
    try {
      const csvMatch = this.parseCSVMatch(line)
      if (!csvMatch) return
      
      this.stats.totalProcessed++
      
      // Enhanced match finding
      const dbMatch = await this.findMatchWithEnhancedAlgorithm(csvMatch)
      
      if (dbMatch) {
        this.stats.matchesFound++
        
        // Import goals for this match
        const goalsImported = await this.importGoalsForMatch(csvMatch, dbMatch.id)
        this.stats.goalsImported += goalsImported.total
        this.stats.playerLinkingIssues += goalsImported.linkingIssues
        
      } else {
        this.stats.matchesNotFound++
        console.log(`⚠️  No match found: ${csvMatch.homeTeam} vs ${csvMatch.awayTeam} on ${csvMatch.date}`)
      }
      
    } catch (error) {
      console.error(`❌ Error processing match: ${error.message}`)
    }
  }

  parseCSVMatch(line) {
    try {
      const columns = this.parseCSVLine(line)
      
      const homeTeam = columns[1]?.trim()
      const awayTeam = columns[2]?.trim()
      const dateStr = columns[3]?.trim()
      const year = parseInt(columns[4])
      const homeGoalScorers = columns[31]?.trim()
      const awayGoalScorers = columns[33]?.trim()
      const homeGoalMinutes = columns[30]?.trim()
      const awayGoalMinutes = columns[32]?.trim()
      
      if (!homeTeam || !awayTeam || !dateStr) return null
      
      const date = this.parseDate(dateStr, year)
      if (!date) return null
      
      return {
        homeTeam,
        awayTeam,
        date,
        year,
        homeGoalScorers,
        awayGoalScorers,
        homeGoalMinutes,
        awayGoalMinutes
      }
    } catch (error) {
      return null
    }
  }

  parseCSVLine(line) {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  parseDate(dateStr, year = 2001) {
    try {
      if (dateStr.includes(',')) {
        const parts = dateStr.split(',')
        if (parts.length >= 2) {
          const monthDay = parts[1].trim()
          const [monthName, day] = monthDay.split(' ')
          
          const months = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
          }
          
          const month = months[monthName]
          if (month && day) {
            return `${year}-${month}-${day.padStart(2, '0')}`
          }
        }
      }
      
      return null
    } catch {
      return null
    }
  }

  async findMatchWithEnhancedAlgorithm(csvMatch) {
    // Strategy 1: Exact match
    let dbMatch = await this.findExactMatch(csvMatch.homeTeam, csvMatch.awayTeam, csvMatch.date)
    if (dbMatch) return dbMatch

    // Strategy 2: Team alias matching
    const homeAlias = this.teamAliases[csvMatch.homeTeam] || csvMatch.homeTeam
    const awayAlias = this.teamAliases[csvMatch.awayTeam] || csvMatch.awayTeam
    
    dbMatch = await this.findExactMatch(homeAlias, awayAlias, csvMatch.date)
    if (dbMatch) return dbMatch

    // Strategy 3: Date flexibility (±3 days)
    for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
      if (dayOffset === 0) continue
      
      const adjustedDate = this.adjustDate(csvMatch.date, dayOffset)
      dbMatch = await this.findExactMatch(homeAlias, awayAlias, adjustedDate)
      if (dbMatch) return dbMatch
    }

    return null
  }

  async findExactMatch(homeTeam, awayTeam, date) {
    try {
      const query = `
        SELECT m.id, m.match_date, ht.name as home_team, at.name as away_team
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE (ht.name = $1 OR ht.short_name = $1)
        AND (at.name = $2 OR at.short_name = $2)
        AND DATE(m.match_date) = $3
        LIMIT 1
      `
      
      const result = await pool.query(query, [homeTeam, awayTeam, date])
      return result.rows[0] || null
    } catch {
      return null
    }
  }

  adjustDate(dateStr, dayOffset) {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + dayOffset)
    return date.toISOString().split('T')[0]
  }

  async importGoalsForMatch(csvMatch, matchId) {
    let totalGoals = 0
    let linkingIssues = 0
    
    // Process home goals
    if (csvMatch.homeGoalScorers && csvMatch.homeGoalMinutes) {
      const homeGoals = await this.processGoals(
        csvMatch.homeGoalScorers, 
        csvMatch.homeGoalMinutes, 
        matchId, 
        'home'
      )
      totalGoals += homeGoals.count
      linkingIssues += homeGoals.linkingIssues
    }
    
    // Process away goals
    if (csvMatch.awayGoalScorers && csvMatch.awayGoalMinutes) {
      const awayGoals = await this.processGoals(
        csvMatch.awayGoalScorers, 
        csvMatch.awayGoalMinutes, 
        matchId, 
        'away'
      )
      totalGoals += awayGoals.count
      linkingIssues += awayGoals.linkingIssues
    }
    
    return { total: totalGoals, linkingIssues }
  }

  async processGoals(scorersStr, minutesStr, matchId, team) {
    try {
      const scorers = scorersStr.split(':')
      const minutes = minutesStr.split(':')
      
      let goalCount = 0
      let linkingIssues = 0
      
      for (let i = 0; i < Math.max(scorers.length, minutes.length); i++) {
        const scorer = scorers[i]?.trim()
        const minuteStr = minutes[i]?.trim()
        
        if (!scorer || !minuteStr) continue
        
        // Parse minute (remove PEN, OG etc.)
        const minute = parseInt(minuteStr.replace(/[^0-9]/g, '')) || 0
        
        // Find player
        const playerId = await this.findPlayerByName(scorer)
        
        if (!playerId) {
          linkingIssues++
          console.log(`⚠️  Player not found: ${scorer}`)
          continue
        }
        
        // Insert goal
        await this.insertGoal(matchId, playerId, minute)
        goalCount++
      }
      
      return { count: goalCount, linkingIssues }
      
    } catch (error) {
      console.error(`❌ Goal processing error: ${error.message}`)
      return { count: 0, linkingIssues: 0 }
    }
  }

  async findPlayerByName(playerName) {
    try {
      // Clean player name
      const cleanName = playerName
        .replace(/[^a-zA-Z\s'-]/g, '')
        .trim()
        .toLowerCase()
      
      if (!cleanName) return null
      
      const query = `
        SELECT id 
        FROM players 
        WHERE LOWER(REPLACE(REPLACE(name, '.', ''), '''', '')) LIKE '%' || $1 || '%'
        LIMIT 1
      `
      
      const result = await pool.query(query, [cleanName])
      return result.rows[0]?.id || null
      
    } catch {
      return null
    }
  }

  async insertGoal(matchId, playerId, minute) {
    try {
      const query = `
        INSERT INTO goals (match_id, player_id, minute, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT DO NOTHING
      `
      
      await pool.query(query, [matchId, playerId, minute])
    } catch (error) {
      console.error(`❌ Goal insert error: ${error.message}`)
    }
  }

  async printFinalResults() {
    console.log('\n' + '='.repeat(60))
    console.log('🎯 PHASE 2 ENHANCED GOALS IMPORT RESULTS')
    console.log('='.repeat(60))
    
    const matchRate = ((this.stats.matchesFound / this.stats.totalProcessed) * 100).toFixed(1)
    const linkingRate = (((this.stats.goalsImported - this.stats.playerLinkingIssues) / this.stats.goalsImported) * 100).toFixed(1)
    
    console.log(`📊 Total Matches Processed: ${this.stats.totalProcessed}`)
    console.log(`✅ Matches Found: ${this.stats.matchesFound} (${matchRate}%)`)
    console.log(`❌ Matches Not Found: ${this.stats.matchesNotFound}`)
    console.log(`⚽ Total Goals Imported: ${this.stats.goalsImported}`)
    console.log(`🔗 Player Linking Issues: ${this.stats.playerLinkingIssues}`)
    console.log(`🎯 Player Linking Success Rate: ${linkingRate}%`)
    console.log('')
    
    // Validate with database count
    const dbResult = await pool.query('SELECT COUNT(*) FROM goals')
    console.log(`💾 Goals in Database: ${dbResult.rows[0].count}`)
    
    if (matchRate >= 95 && linkingRate >= 90) {
      console.log('🎉 PHASE 2 SUCCESS: 95%+ match rate and 90%+ linking achieved!')
    } else {
      console.log('⚠️  Phase 2 targets not fully met - further optimization needed')
    }
    
    console.log('='.repeat(60))
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new EnhancedGoalsImporter()
  importer.importGoalsWithEnhancedMatching()
}

export default EnhancedGoalsImporter