#!/usr/bin/env node

/**
 * Priority Target Importer
 * Phase 4: Focus on high-impact missing matches for maximum coverage improvement
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

class PriorityTargetImporter {
  constructor() {
    this.stats = {
      targetMatches: 0,
      processedMatches: 0,
      goalsAdded: 0,
      highImpactMatches: 0,
      coverageImprovement: 0
    }
    this.teamAliases = {
      'Tottenham Hotspur': 'Tottenham'
    }
  }

  async importPriorityTargets() {
    const spinner = ora('🎯 Starting priority target import...').start()
    
    try {
      console.log('🎯 Phase 4: Priority Target Import')
      console.log('⚡ Focusing on high-scoring matches with missing goals')
      console.log('')
      
      // Get priority targets from database
      spinner.text = 'Identifying priority target matches...'
      const priorityTargets = await this.getPriorityTargets()
      this.stats.targetMatches = priorityTargets.length
      
      spinner.succeed(`✅ Found ${priorityTargets.length} priority target matches`)
      
      // Load CSV data for matching
      console.log('📁 Loading CSV data for enhanced matching...')
      const csvData = await this.loadCSVData()
      
      console.log('🔄 Processing priority targets...')
      
      for (const target of priorityTargets) {
        await this.processTargetMatch(target, csvData)
        this.stats.processedMatches++
        
        if (this.stats.processedMatches % 10 === 0) {
          console.log(`   📊 Processed ${this.stats.processedMatches}/${priorityTargets.length} priority targets`)
        }
      }
      
      await this.calculateCoverageImprovement()
      await this.printResults()
      
    } catch (error) {
      spinner.fail(`❌ Priority target import failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  async getPriorityTargets() {
    const query = `
      SELECT 
        m.id,
        m.match_date,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        m.home_score + m.away_score as expected_goals,
        COUNT(g.id) as current_goals,
        s.year,
        CASE 
          WHEN m.home_score + m.away_score >= 6 THEN 'critical'
          WHEN m.home_score + m.away_score >= 4 THEN 'high'
          WHEN m.home_score + m.away_score >= 3 THEN 'medium'
          ELSE 'low'
        END as priority_level
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.home_score IS NOT NULL 
      AND m.away_score IS NOT NULL
      AND s.year BETWEEN 2001 AND 2022
      AND m.home_score + m.away_score > 0
      GROUP BY m.id, m.match_date, ht.name, at.name, m.home_score, m.away_score, s.year, m.home_team_id, m.away_team_id
      HAVING COUNT(g.id) = 0
      ORDER BY (m.home_score + m.away_score) DESC, m.match_date DESC
      LIMIT 100
    `
    
    const result = await pool.query(query)
    return result.rows
  }

  async loadCSVData() {
    const matchesFile = 'data/processed/matches/matches-fixed.csv'
    
    if (!fs.existsSync(matchesFile)) {
      throw new Error(`Matches file not found: ${matchesFile}`)
    }

    const csvContent = fs.readFileSync(matchesFile, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    const csvMatches = new Map()
    
    for (let i = 1; i < lines.length; i++) {
      const csvMatch = this.parseCSVMatch(lines[i])
      if (csvMatch && (csvMatch.homeGoalScorers || csvMatch.awayGoalScorers)) {
        // Create a key for matching
        const key = `${csvMatch.homeTeam}|${csvMatch.awayTeam}|${csvMatch.date}`
        csvMatches.set(key, csvMatch)
      }
    }
    
    console.log(`   ✅ Loaded ${csvMatches.size} CSV matches with goal data`)
    return csvMatches
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

  async processTargetMatch(target, csvData) {
    try {
      // Try to find matching CSV data
      const csvMatch = await this.findMatchingCSV(target, csvData)
      
      if (csvMatch) {
        const goalsAdded = await this.importGoalsFromCSV(target, csvMatch)
        this.stats.goalsAdded += goalsAdded
        
        if (target.expected_goals >= 6) {
          this.stats.highImpactMatches++
        }
        
        if (goalsAdded > 0) {
          console.log(`   ✅ ${target.home_team} vs ${target.away_team} (${target.year}): Added ${goalsAdded} goals`)
        }
      } else {
        // Try alternative matching strategies
        const alternativeGoals = await this.tryAlternativeMatching(target)
        if (alternativeGoals > 0) {
          this.stats.goalsAdded += alternativeGoals
          console.log(`   🔄 ${target.home_team} vs ${target.away_team} (${target.year}): Added ${alternativeGoals} goals (alternative)`)
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${target.home_team} vs ${target.away_team}: ${error.message}`)
    }
  }

  async findMatchingCSV(target, csvData) {
    const homeTeam = this.teamAliases[target.home_team] || target.home_team
    const awayTeam = this.teamAliases[target.away_team] || target.away_team
    
    // Try exact match first
    const key = `${homeTeam}|${awayTeam}|${target.match_date.toISOString().split('T')[0]}`
    let csvMatch = csvData.get(key)
    
    if (csvMatch) return csvMatch
    
    // Try with original team names
    const altKey = `${target.home_team}|${target.away_team}|${target.match_date.toISOString().split('T')[0]}`
    csvMatch = csvData.get(altKey)
    
    if (csvMatch) return csvMatch
    
    // Try fuzzy date matching (±3 days)
    const targetDate = new Date(target.match_date)
    for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
      const adjustedDate = new Date(targetDate)
      adjustedDate.setDate(targetDate.getDate() + dayOffset)
      const adjustedKey = `${homeTeam}|${awayTeam}|${adjustedDate.toISOString().split('T')[0]}`
      
      csvMatch = csvData.get(adjustedKey)
      if (csvMatch) return csvMatch
    }
    
    return null
  }

  async importGoalsFromCSV(target, csvMatch) {
    try {
      let goalsAdded = 0
      
      // Parse and import home goals
      if (csvMatch.homeGoalScorers && csvMatch.homeGoalMinutes) {
        const homeGoals = await this.processGoals(
          csvMatch.homeGoalScorers, 
          csvMatch.homeGoalMinutes, 
          target.id, 
          'home'
        )
        goalsAdded += homeGoals
      }
      
      // Parse and import away goals
      if (csvMatch.awayGoalScorers && csvMatch.awayGoalMinutes) {
        const awayGoals = await this.processGoals(
          csvMatch.awayGoalScorers, 
          csvMatch.awayGoalMinutes, 
          target.id, 
          'away'
        )
        goalsAdded += awayGoals
      }
      
      return goalsAdded
      
    } catch (error) {
      console.error(`❌ Error importing goals: ${error.message}`)
      return 0
    }
  }

  async processGoals(scorersStr, minutesStr, matchId, team) {
    try {
      const scorers = scorersStr.split(':')
      const minutes = minutesStr.split(':')
      
      let goalCount = 0
      
      for (let i = 0; i < Math.max(scorers.length, minutes.length); i++) {
        const scorer = scorers[i]?.trim()
        const minuteStr = minutes[i]?.trim()
        
        if (!scorer || !minuteStr) continue
        
        // Parse minute (remove PEN, OG etc.)
        const minute = parseInt(minuteStr.replace(/[^0-9]/g, '')) || 0
        
        // Find player and team
        const playerId = await this.findPlayerByName(scorer)
        const teamId = await this.getTeamIdForMatch(matchId, team)
        
        if (playerId && teamId) {
          // Insert goal
          await this.insertGoal(matchId, playerId, teamId, minute)
          goalCount++
        }
      }
      
      return goalCount
      
    } catch (error) {
      console.error(`❌ Goal processing error: ${error.message}`)
      return 0
    }
  }

  async findPlayerByName(playerName) {
    try {
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

  async getTeamIdForMatch(matchId, team) {
    try {
      const query = `
        SELECT ${team}_team_id as team_id 
        FROM matches 
        WHERE id = $1
      `
      
      const result = await pool.query(query, [matchId])
      return result.rows[0]?.team_id || null
      
    } catch {
      return null
    }
  }

  async insertGoal(matchId, playerId, teamId, minute) {
    try {
      const query = `
        INSERT INTO goals (match_id, player_id, team_id, minute, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (match_id, player_id, team_id, minute) DO NOTHING
      `
      
      await pool.query(query, [matchId, playerId, teamId, minute])
    } catch (error) {
      console.error(`❌ Goal insert error: ${error.message}`)
    }
  }

  async tryAlternativeMatching(target) {
    // Placeholder for alternative data sources or matching strategies
    // This could include API calls, alternative CSV files, etc.
    return 0
  }

  async calculateCoverageImprovement() {
    // Calculate the improvement in coverage achieved
    const query = `
      WITH coverage_stats AS (
        SELECT 
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT g.match_id) as matches_with_goals
        FROM matches m
        JOIN seasons s ON m.season_id = s.id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE s.year BETWEEN 2001 AND 2022
        AND m.home_score IS NOT NULL
        AND m.away_score IS NOT NULL
      )
      SELECT 
        ROUND(matches_with_goals::decimal / total_matches * 100, 1) as current_coverage
      FROM coverage_stats
    `
    
    const result = await pool.query(query)
    this.stats.coverageImprovement = result.rows[0]?.current_coverage || 0
  }

  async printResults() {
    console.log('\n' + '='.repeat(70))
    console.log('🎯 PRIORITY TARGET IMPORT RESULTS')
    console.log('='.repeat(70))
    
    console.log(`📊 Target Matches Processed: ${this.stats.processedMatches}/${this.stats.targetMatches}`)
    console.log(`⚽ Goals Added: ${this.stats.goalsAdded}`)
    console.log(`🔥 High-Impact Matches Improved: ${this.stats.highImpactMatches}`)
    console.log(`📈 Current Coverage: ${this.stats.coverageImprovement}%`)
    console.log('')
    
    // Calculate impact
    const avgGoalsPerMatch = (this.stats.goalsAdded / Math.max(this.stats.processedMatches, 1)).toFixed(1)
    console.log(`💫 IMPACT SUMMARY:`)
    console.log(`   Average Goals Added per Match: ${avgGoalsPerMatch}`)
    console.log(`   Coverage Improvement Target: 80%`)
    console.log(`   Remaining Gap: ${Math.max(0, 80 - this.stats.coverageImprovement).toFixed(1)}%`)
    
    if (this.stats.goalsAdded > 0) {
      console.log(`\n🎉 SUCCESS: Added ${this.stats.goalsAdded} goals to high-priority matches!`)
      
      if (this.stats.coverageImprovement >= 60) {
        console.log('✅ Significant coverage improvement achieved')
      } else {
        console.log('🔄 Good progress - continue with additional data sources')
      }
    } else {
      console.log('\n⚠️  No goals added - may need alternative data sources')
      console.log('💡 Consider Football-Data.co.uk or API-Football integration')
    }
    
    console.log('='.repeat(70))
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new PriorityTargetImporter()
  importer.importPriorityTargets()
}

export default PriorityTargetImporter