#!/usr/bin/env node

/**
 * Enhanced Match Linking Algorithm
 * Phase 2: Achieve 95%+ match rate with fuzzy matching and team name aliases
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

class EnhancedMatchLinker {
  constructor() {
    this.teamAliases = this.initializeTeamAliases()
    this.matchingStats = {
      exact: 0,
      fuzzy: 0,
      aliased: 0,
      dateAdjusted: 0,
      failed: 0
    }
  }

  initializeTeamAliases() {
    return {
      // Only map teams where CSV and DB names actually differ
      'Tottenham Hotspur': 'Tottenham'
    }
  }

  async enhancedMatchFinder() {
    const spinner = ora('Starting enhanced match linking...').start()
    
    try {
      const matchesFile = 'data/processed/matches/matches-fixed.csv'
      
      if (!fs.existsSync(matchesFile)) {
        throw new Error(`Matches file not found: ${matchesFile}`)
      }

      const csvContent = fs.readFileSync(matchesFile, 'utf-8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      spinner.succeed(`Loaded ${lines.length - 1} CSV fixtures`)
      
      // Process sample for testing (first 100 matches)
      const testMatches = lines.slice(1, 101)
      console.log(`🔍 Testing enhanced linking on ${testMatches.length} matches`)
      
      let totalProcessed = 0
      const results = []
      
      for (const line of testMatches) {
        const csvMatch = this.parseCSVMatch(line)
        if (!csvMatch) continue
        
        totalProcessed++
        const dbMatch = await this.findMatchWithEnhancedAlgorithm(csvMatch)
        
        results.push({
          csv: csvMatch,
          db: dbMatch,
          matched: !!dbMatch,
          method: dbMatch?.method || 'failed'
        })
        
        if (totalProcessed % 10 === 0) {
          console.log(`📊 Processed ${totalProcessed}/${testMatches.length}`)
        }
      }
      
      this.printResults(results)
      await this.suggestDatabaseUpdates(results)
      
    } catch (error) {
      spinner.fail(`Enhanced linking failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  parseCSVMatch(line) {
    try {
      const columns = this.parseCSVLine(line)
      
      const homeTeam = columns[1]?.trim()
      const awayTeam = columns[2]?.trim()
      const dateStr = columns[3]?.trim()
      const year = parseInt(columns[4])
      
      if (!homeTeam || !awayTeam || !dateStr) return null
      
      const date = this.parseDate(dateStr, year)
      if (!date) return null
      
      return {
        homeTeam,
        awayTeam,
        date,
        year,
        originalDate: dateStr
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
    if (dbMatch) {
      this.matchingStats.exact++
      return { ...dbMatch, method: 'exact' }
    }

    // Strategy 2: Team alias matching
    const homeAlias = this.teamAliases[csvMatch.homeTeam] || csvMatch.homeTeam
    const awayAlias = this.teamAliases[csvMatch.awayTeam] || csvMatch.awayTeam
    
    // Debug: log the team mapping
    if (csvMatch.homeTeam.includes('Tottenham') || csvMatch.awayTeam.includes('Tottenham')) {
      console.log(`🔍 Debug: ${csvMatch.homeTeam} -> ${homeAlias} vs ${csvMatch.awayTeam} -> ${awayAlias}`)
    }
    
    dbMatch = await this.findExactMatch(homeAlias, awayAlias, csvMatch.date)
    if (dbMatch) {
      this.matchingStats.aliased++
      return { ...dbMatch, method: 'aliased' }
    }

    // Strategy 3: Date flexibility (±3 days)
    for (let dayOffset = -3; dayOffset <= 3; dayOffset++) {
      if (dayOffset === 0) continue // Already tried exact date
      
      const adjustedDate = this.adjustDate(csvMatch.date, dayOffset)
      dbMatch = await this.findExactMatch(homeAlias, awayAlias, adjustedDate)
      if (dbMatch) {
        this.matchingStats.dateAdjusted++
        return { ...dbMatch, method: 'date_adjusted', originalDate: csvMatch.date, adjustedDate }
      }
    }

    // Strategy 4: Fuzzy team name matching
    dbMatch = await this.findFuzzyMatch(csvMatch.homeTeam, csvMatch.awayTeam, csvMatch.date)
    if (dbMatch) {
      this.matchingStats.fuzzy++
      return { ...dbMatch, method: 'fuzzy' }
    }

    this.matchingStats.failed++
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

  async findFuzzyMatch(homeTeam, awayTeam, date) {
    try {
      const query = `
        SELECT m.id, m.match_date, ht.name as home_team, at.name as away_team,
               SIMILARITY(ht.name, $1) as home_similarity,
               SIMILARITY(at.name, $2) as away_similarity
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE DATE(m.match_date) = $3
        AND SIMILARITY(ht.name, $1) > 0.6
        AND SIMILARITY(at.name, $2) > 0.6
        ORDER BY (SIMILARITY(ht.name, $1) + SIMILARITY(at.name, $2)) DESC
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

  printResults(results) {
    console.log('\n' + '='.repeat(60))
    console.log('📊 ENHANCED MATCH LINKING RESULTS')
    console.log('='.repeat(60))
    
    const totalProcessed = results.length
    const totalMatched = results.filter(r => r.matched).length
    const matchRate = ((totalMatched / totalProcessed) * 100).toFixed(1)
    
    console.log(`📈 Overall Match Rate: ${matchRate}% (${totalMatched}/${totalProcessed})`)
    console.log('')
    
    console.log('🎯 Matching Method Breakdown:')
    console.log(`   Exact matches: ${this.matchingStats.exact}`)
    console.log(`   Alias matches: ${this.matchingStats.aliased}`)
    console.log(`   Date adjusted: ${this.matchingStats.dateAdjusted}`)
    console.log(`   Fuzzy matches: ${this.matchingStats.fuzzy}`)
    console.log(`   Failed: ${this.matchingStats.failed}`)
    console.log('')
    
    // Show failed matches for analysis
    const failed = results.filter(r => !r.matched).slice(0, 10)
    if (failed.length > 0) {
      console.log('❌ Sample Failed Matches:')
      failed.forEach(result => {
        console.log(`   ${result.csv.homeTeam} vs ${result.csv.awayTeam} on ${result.csv.date}`)
      })
    }
    
    console.log('='.repeat(60))
  }

  async suggestDatabaseUpdates(results) {
    console.log('\n💡 SUGGESTED DATABASE IMPROVEMENTS:\n')
    
    // Find missing team aliases
    const failedMatches = results.filter(r => !r.matched)
    const missingTeams = new Set()
    
    failedMatches.forEach(result => {
      if (!this.teamAliases[result.csv.homeTeam]) {
        missingTeams.add(result.csv.homeTeam)
      }
      if (!this.teamAliases[result.csv.awayTeam]) {
        missingTeams.add(result.csv.awayTeam)
      }
    })
    
    if (missingTeams.size > 0) {
      console.log('🏷️  Add Team Aliases:')
      Array.from(missingTeams).forEach(team => {
        console.log(`   '${team}': '???', // Needs database mapping`)
      })
      console.log('')
    }
    
    console.log('🔧 Recommended Actions:')
    console.log('1. Update team aliases mapping with correct database names')
    console.log('2. Install PostgreSQL similarity extension for fuzzy matching')
    console.log('3. Create team name normalization function')
    console.log('4. Add manual override table for special cases')
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const linker = new EnhancedMatchLinker()
  linker.enhancedMatchFinder()
}

export default EnhancedMatchLinker