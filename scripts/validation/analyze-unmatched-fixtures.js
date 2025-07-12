#!/usr/bin/env node

/**
 * Analyze Unmatched Fixtures
 * Identify patterns in missing matches to improve linking algorithm
 */

import fs from 'fs'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class FixtureAnalyzer {
  constructor() {
    this.unmatchedFixtures = []
    this.matchingIssues = {
      teamNameMismatches: [],
      dateDiscrepancies: [],
      missingMatches: [],
      seasonBoundaryIssues: []
    }
  }

  async analyzeUnmatchedFixtures() {
    console.log('🔍 Analyzing unmatched fixtures...\n')

    try {
      // Load the matches CSV to analyze unmatched entries
      const matchesFile = 'data/processed/matches/matches-fixed.csv'
      
      if (!fs.existsSync(matchesFile)) {
        throw new Error(`Matches file not found: ${matchesFile}`)
      }

      const csvContent = fs.readFileSync(matchesFile, 'utf-8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      console.log(`📊 Total fixtures in CSV: ${lines.length - 1}`)

      // Parse CSV and check each fixture against database
      let matchedCount = 0
      let unmatchedCount = 0
      const sampleUnmatched = []

      for (let i = 1; i < Math.min(1000, lines.length); i++) { // Sample first 1000
        const columns = this.parseCSVLine(lines[i])
        
        const homeTeam = columns[1]?.trim()
        const awayTeam = columns[2]?.trim()
        const dateStr = columns[3]?.trim()
        
        if (!homeTeam || !awayTeam || !dateStr) continue

        const date = this.parseDate(dateStr)
        if (!date) continue

        // Check if match exists in database
        const matchExists = await this.checkMatchExists(homeTeam, awayTeam, date)
        
        if (matchExists) {
          matchedCount++
        } else {
          unmatchedCount++
          if (sampleUnmatched.length < 20) {
            sampleUnmatched.push({
              homeTeam,
              awayTeam,
              date: date,
              originalDate: dateStr
            })
          }
        }
      }

      console.log(`✅ Matched: ${matchedCount}`)
      console.log(`❌ Unmatched: ${unmatchedCount}`)
      console.log(`📈 Match rate: ${((matchedCount / (matchedCount + unmatchedCount)) * 100).toFixed(1)}%\n`)

      // Analyze unmatched patterns
      await this.analyzeUnmatchedPatterns(sampleUnmatched)
      await this.suggestImprovements()

    } catch (error) {
      console.error('❌ Analysis error:', error.message)
    } finally {
      await pool.end()
    }
  }

  parseCSVLine(line) {
    // Handle CSV with quoted fields
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

  parseDate(dateStr) {
    try {
      // Handle "Saturday, August 18" format
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
            return `2001-${month}-${day.padStart(2, '0')}` // Default to 2001 for testing
          }
        }
      }
      
      // Handle other formats
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/')
        return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      } else if (dateStr.includes('-')) {
        return dateStr
      }
      return null
    } catch {
      return null
    }
  }

  async checkMatchExists(homeTeam, awayTeam, date) {
    try {
      const query = `
        SELECT m.id 
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE (ht.name = $1 OR ht.short_name = $1 OR ht.name ILIKE '%' || $1 || '%')
        AND (at.name = $2 OR at.short_name = $2 OR at.name ILIKE '%' || $2 || '%')
        AND m.date = $3
        LIMIT 1
      `
      
      const result = await pool.query(query, [homeTeam, awayTeam, date])
      return result.rows.length > 0
    } catch (error) {
      return false
    }
  }

  async analyzeUnmatchedPatterns(unmatchedSample) {
    console.log('🔍 Analyzing unmatched patterns:\n')

    for (const fixture of unmatchedSample) {
      // Check for team name variations
      const homeTeamVariations = await this.findTeamNameVariations(fixture.homeTeam)
      const awayTeamVariations = await this.findTeamNameVariations(fixture.awayTeam)
      
      console.log(`❌ Unmatched: ${fixture.homeTeam} vs ${fixture.awayTeam} on ${fixture.date}`)
      
      if (homeTeamVariations.length > 0) {
        console.log(`  🏠 Home team variations found: ${homeTeamVariations.join(', ')}`)
      }
      
      if (awayTeamVariations.length > 0) {
        console.log(`  🏃 Away team variations found: ${awayTeamVariations.join(', ')}`)
      }
      
      // Check for nearby dates
      const nearbyMatches = await this.findNearbyMatches(fixture.homeTeam, fixture.awayTeam, fixture.date)
      if (nearbyMatches.length > 0) {
        console.log(`  📅 Similar matches found on different dates:`)
        nearbyMatches.forEach(match => {
          console.log(`     ${match.home_team} vs ${match.away_team} on ${match.date}`)
        })
      }
      
      console.log('')
    }
  }

  async findTeamNameVariations(teamName) {
    try {
      const query = `
        SELECT DISTINCT name, short_name 
        FROM teams 
        WHERE name ILIKE '%' || $1 || '%' 
        OR short_name ILIKE '%' || $1 || '%'
        OR $1 ILIKE '%' || name || '%'
        OR $1 ILIKE '%' || short_name || '%'
        LIMIT 5
      `
      
      const result = await pool.query(query, [teamName])
      return result.rows.map(row => `${row.name} (${row.short_name})`).filter(name => !name.includes(teamName))
    } catch {
      return []
    }
  }

  async findNearbyMatches(homeTeam, awayTeam, targetDate) {
    try {
      const query = `
        SELECT ht.name as home_team, at.name as away_team, m.date
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE (ht.name ILIKE '%' || $1 || '%' OR at.name ILIKE '%' || $2 || '%')
        AND ABS(EXTRACT(EPOCH FROM (m.date - $3::date)) / 86400) <= 7
        ORDER BY ABS(EXTRACT(EPOCH FROM (m.date - $3::date)))
        LIMIT 3
      `
      
      const result = await pool.query(query, [homeTeam, awayTeam, targetDate])
      return result.rows
    } catch {
      return []
    }
  }

  async suggestImprovements() {
    console.log('💡 SUGGESTED IMPROVEMENTS:\n')
    
    console.log('1. 🎯 Enhanced Team Name Matching:')
    console.log('   - Implement fuzzy string matching (Levenshtein distance)')
    console.log('   - Create team name alias mapping')
    console.log('   - Handle historical team name changes')
    console.log('')
    
    console.log('2. 📅 Date Flexibility:')
    console.log('   - Allow ±1 day tolerance for match dates')
    console.log('   - Handle postponed/rescheduled matches')
    console.log('   - Cross-reference with official fixture lists')
    console.log('')
    
    console.log('3. 🔄 Data Source Reconciliation:')
    console.log('   - Compare Kaggle data with official Premier League API')
    console.log('   - Validate against multiple data sources')
    console.log('   - Implement data source priority ranking')
    console.log('')
    
    console.log('4. 🎲 Alternative Matching Strategies:')
    console.log('   - Match by season + gameweek instead of exact date')
    console.log('   - Use venue information for additional validation')
    console.log('   - Implement cascade matching (exact → fuzzy → manual)')
  }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new FixtureAnalyzer()
  analyzer.analyzeUnmatchedFixtures()
}

export default FixtureAnalyzer