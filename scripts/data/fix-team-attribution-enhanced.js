#!/usr/bin/env node

/**
 * Enhanced Team Attribution Fix
 * Phase 3: Proper home/away team assignment using CSV goal data
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

class EnhancedTeamAttributionFixer {
  constructor() {
    this.stats = {
      totalGoals: 0,
      goalsFixed: 0,
      homeGoals: 0,
      awayGoals: 0,
      csvMatches: 0,
      matchedGoals: 0
    }
  }

  async fixTeamAttributionWithCSV() {
    const spinner = ora('🔧 Starting enhanced team attribution fix...').start()
    
    try {
      console.log('🎯 Phase 3: Enhanced Team Attribution Fix')
      console.log('⚡ Using CSV data to properly assign home/away goals')
      console.log('')
      
      // Load CSV data
      spinner.text = 'Loading CSV match data...'
      const csvMatches = await this.loadCSVData()
      this.stats.csvMatches = csvMatches.length
      
      spinner.succeed(`✅ Loaded ${csvMatches.length} CSV matches`)
      
      // Reset all team attributions first
      await this.resetTeamAttributions()
      
      console.log('🔄 Processing matches with CSV goal data...')
      
      let processedMatches = 0
      for (const csvMatch of csvMatches) {
        await this.processMatchWithCSV(csvMatch)
        processedMatches++
        
        if (processedMatches % 100 === 0) {
          console.log(`   📊 Processed ${processedMatches}/${csvMatches.length} matches`)
        }
      }
      
      await this.printResults()
      
    } catch (error) {
      spinner.fail(`❌ Enhanced team attribution fix failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  async loadCSVData() {
    const matchesFile = 'data/processed/matches/matches-fixed.csv'
    
    if (!fs.existsSync(matchesFile)) {
      throw new Error(`Matches file not found: ${matchesFile}`)
    }

    const csvContent = fs.readFileSync(matchesFile, 'utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    const matches = []
    for (let i = 1; i < lines.length; i++) {
      const csvMatch = this.parseCSVMatch(lines[i])
      if (csvMatch && (csvMatch.homeGoalScorers || csvMatch.awayGoalScorers)) {
        matches.push(csvMatch)
      }
    }
    
    return matches
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

  async resetTeamAttributions() {
    console.log('🧹 Resetting team attributions...')
    await pool.query('UPDATE goals SET team_id = NULL')
  }

  async processMatchWithCSV(csvMatch) {
    try {
      // Find the database match
      const dbMatch = await this.findMatchInDatabase(csvMatch)
      if (!dbMatch) return
      
      // Get goals for this match
      const goals = await this.getMatchGoals(dbMatch.id)
      if (goals.length === 0) return
      
      // Parse CSV goal data
      const homeGoals = this.parseGoalData(csvMatch.homeGoalScorers, csvMatch.homeGoalMinutes)
      const awayGoals = this.parseGoalData(csvMatch.awayGoalScorers, csvMatch.awayGoalMinutes)
      
      // Match database goals to CSV goals
      await this.matchGoalsToTeams(goals, homeGoals, awayGoals, dbMatch)
      
    } catch (error) {
      console.error(`❌ Error processing match: ${error.message}`)
    }
  }

  async findMatchInDatabase(csvMatch) {
    const teamAliases = {
      'Tottenham Hotspur': 'Tottenham'
    }
    
    const homeTeam = teamAliases[csvMatch.homeTeam] || csvMatch.homeTeam
    const awayTeam = teamAliases[csvMatch.awayTeam] || csvMatch.awayTeam
    
    const query = `
      SELECT m.id, m.home_team_id, m.away_team_id
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE (ht.name = $1 OR ht.short_name = $1)
      AND (at.name = $2 OR at.short_name = $2)
      AND DATE(m.match_date) = $3
      LIMIT 1
    `
    
    const result = await pool.query(query, [homeTeam, awayTeam, csvMatch.date])
    return result.rows[0] || null
  }

  async getMatchGoals(matchId) {
    const query = `
      SELECT g.id, g.minute, p.name as player_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      WHERE g.match_id = $1
      ORDER BY g.minute
    `
    
    const result = await pool.query(query, [matchId])
    return result.rows
  }

  parseGoalData(scorersStr, minutesStr) {
    if (!scorersStr || !minutesStr) return []
    
    const scorers = scorersStr.split(':')
    const minutes = minutesStr.split(':')
    const goals = []
    
    for (let i = 0; i < Math.max(scorers.length, minutes.length); i++) {
      const scorer = scorers[i]?.trim()
      const minuteStr = minutes[i]?.trim()
      
      if (scorer && minuteStr) {
        const minute = parseInt(minuteStr.replace(/[^0-9]/g, '')) || 0
        goals.push({
          scorer: this.cleanPlayerName(scorer),
          minute: minute
        })
      }
    }
    
    return goals
  }

  cleanPlayerName(name) {
    return name
      .replace(/[^a-zA-Z\s'-]/g, '')
      .trim()
      .toLowerCase()
  }

  async matchGoalsToTeams(dbGoals, homeGoals, awayGoals, match) {
    // Create a combined list of goals with team attribution
    const allCSVGoals = [
      ...homeGoals.map(g => ({ ...g, teamId: match.home_team_id, team: 'home' })),
      ...awayGoals.map(g => ({ ...g, teamId: match.away_team_id, team: 'away' }))
    ].sort((a, b) => a.minute - b.minute)
    
    // Match database goals to CSV goals by minute and player name
    for (const dbGoal of dbGoals) {
      let bestMatch = null
      let bestScore = 0
      
      for (const csvGoal of allCSVGoals) {
        let score = 0
        
        // Minute proximity (most important)
        const minuteDiff = Math.abs(dbGoal.minute - csvGoal.minute)
        if (minuteDiff === 0) score += 100
        else if (minuteDiff <= 2) score += 50
        else if (minuteDiff <= 5) score += 20
        
        // Player name similarity
        if (dbGoal.player_name && csvGoal.scorer) {
          const dbName = this.cleanPlayerName(dbGoal.player_name)
          const csvName = csvGoal.scorer
          
          if (dbName.includes(csvName) || csvName.includes(dbName)) {
            score += 75
          } else if (this.calculateSimilarity(dbName, csvName) > 0.6) {
            score += 50
          }
        }
        
        if (score > bestScore) {
          bestScore = score
          bestMatch = csvGoal
        }
      }
      
      // Assign team if we have a good match
      if (bestMatch && bestScore >= 50) {
        await this.updateGoalTeam(dbGoal.id, bestMatch.teamId)
        this.stats.goalsFixed++
        this.stats.matchedGoals++
        
        if (bestMatch.team === 'home') {
          this.stats.homeGoals++
        } else {
          this.stats.awayGoals++
        }
      }
    }
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  levenshteinDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  async updateGoalTeam(goalId, teamId) {
    const query = `UPDATE goals SET team_id = $1 WHERE id = $2`
    await pool.query(query, [teamId, goalId])
  }

  async printResults() {
    console.log('\n' + '='.repeat(70))
    console.log('🔧 ENHANCED TEAM ATTRIBUTION FIX RESULTS')
    console.log('='.repeat(70))
    
    // Get current goal statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_goals,
        COUNT(team_id) as goals_with_team,
        COUNT(CASE WHEN team_id IS NULL THEN 1 END) as goals_without_team
      FROM goals
    `
    
    const result = await pool.query(statsQuery)
    const stats = result.rows[0]
    
    console.log(`📊 CSV Matches Processed: ${this.stats.csvMatches}`)
    console.log(`⚽ Total Goals in Database: ${stats.total_goals}`)
    console.log(`✅ Goals with Team Attribution: ${stats.goals_with_team}`)
    console.log(`❌ Goals without Team Attribution: ${stats.goals_without_team}`)
    console.log(`🏠 Home Goals Assigned: ${this.stats.homeGoals}`)
    console.log(`🏃 Away Goals Assigned: ${this.stats.awayGoals}`)
    console.log(`🎯 Goals Matched via CSV: ${this.stats.matchedGoals}`)
    console.log('')
    
    const attributionRate = ((stats.goals_with_team / stats.total_goals) * 100).toFixed(1)
    const homeAwayRatio = (this.stats.homeGoals / Math.max(this.stats.awayGoals, 1)).toFixed(1)
    
    console.log(`📈 Team Attribution Rate: ${attributionRate}%`)
    console.log(`⚖️  Home/Away Ratio: ${homeAwayRatio}:1`)
    console.log('')
    
    if (parseFloat(attributionRate) >= 80 && parseFloat(homeAwayRatio) < 5) {
      console.log('🎉 SUCCESS: Enhanced team attribution achieved!')
    } else {
      console.log('⚠️  Team attribution needs further refinement')
      
      if (parseFloat(homeAwayRatio) >= 5) {
        console.log('   Issue: Too many goals assigned to home teams')
      }
      if (parseFloat(attributionRate) < 80) {
        console.log('   Issue: Low overall attribution rate')
      }
    }
    
    console.log('='.repeat(70))
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new EnhancedTeamAttributionFixer()
  fixer.fixTeamAttributionWithCSV()
}

export default EnhancedTeamAttributionFixer