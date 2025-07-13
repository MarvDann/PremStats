#!/usr/bin/env node

/**
 * 6 Sigma: Fix Ghost Seasons Issue
 * Identify and remove phantom future seasons and invalid data
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class GhostSeasonFixer {
  constructor() {
    this.issues = []
    this.fixes = []
  }

  async fixGhostSeasons() {
    console.log('🔧 6 SIGMA: GHOST SEASON ELIMINATION')
    console.log('=' .repeat(60))
    console.log('')
    
    try {
      // 1. Identify all seasons and their status
      await this.identifyGhostSeasons()
      
      // 2. Check for future dates
      await this.checkFutureDates()
      
      // 3. Validate season year logic
      await this.validateSeasonYears()
      
      // 4. Clean up invalid data
      await this.cleanupInvalidData()
      
      // 5. Verify fix
      await this.verifyFix()
      
    } catch (error) {
      console.error('❌ Ghost season fix failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async identifyGhostSeasons() {
    console.log('🔍 IDENTIFYING GHOST SEASONS:')
    
    // Get all seasons with their data
    const seasons = await pool.query(`
      SELECT 
        s.id,
        s.year,
        s.name,
        s.start_date,
        s.end_date,
        COUNT(m.id) as match_count,
        MIN(m.match_date) as earliest_match,
        MAX(m.match_date) as latest_match
      FROM seasons s
      LEFT JOIN matches m ON s.id = m.season_id
      GROUP BY s.id, s.year, s.name, s.start_date, s.end_date
      ORDER BY s.year
    `)
    
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentSeasonYear = currentMonth >= 8 ? currentYear + 1 : currentYear // Premier League seasons start in August
    
    console.log(`   📅 Current date: ${new Date().toISOString().split('T')[0]}`)
    console.log(`   🏆 Current season year: ${currentSeasonYear}`)
    console.log('')
    
    for (const season of seasons.rows) {
      const isHistorical = season.year < 1992 // Before Premier League
      const isFuture = season.year > currentSeasonYear
      const hasMatches = season.match_count > 0
      const hasValidDates = season.earliest_match && season.latest_match
      
      let status = '✅'
      let notes = []
      
      if (isHistorical) {
        status = '⚠️'
        notes.push('Pre-Premier League era')
      }
      
      if (isFuture) {
        status = '🚨'
        notes.push('GHOST SEASON - Future year')
        this.issues.push({
          type: 'ghost_season',
          seasonId: season.id,
          year: season.year,
          reason: 'Future season'
        })
      }
      
      if (hasMatches && !hasValidDates) {
        status = '❌'
        notes.push('Invalid match dates')
        this.issues.push({
          type: 'invalid_dates',
          seasonId: season.id,
          year: season.year,
          reason: 'Matches without proper dates'
        })
      }
      
      // Check for impossible match counts
      if (season.match_count > 500) {
        status = '❌'
        notes.push(`Impossible match count: ${season.match_count}`)
        this.issues.push({
          type: 'excessive_matches',
          seasonId: season.id,
          year: season.year,
          reason: `${season.match_count} matches is impossible`
        })
      }
      
      console.log(`   ${status} ${season.year}: ${season.match_count} matches ${notes.length > 0 ? '(' + notes.join(', ') + ')' : ''}`)
      if (hasValidDates) {
        console.log(`      📅 Dates: ${season.earliest_match?.toISOString()?.split('T')[0]} to ${season.latest_match?.toISOString()?.split('T')[0]}`)
      }
    }
    
    console.log('')
    console.log(`   📊 Total issues found: ${this.issues.length}`)
    console.log('')
  }

  async checkFutureDates() {
    console.log('📅 CHECKING FUTURE DATES:')
    
    const futureDates = await pool.query(`
      SELECT 
        m.id,
        m.match_date,
        s.year,
        ht.name as home_team,
        at.name as away_team
      FROM matches m
      JOIN seasons s ON m.season_id = s.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.match_date > CURRENT_DATE
      ORDER BY m.match_date
      LIMIT 20
    `)
    
    if (futureDates.rows.length > 0) {
      console.log('   🚨 FUTURE MATCHES FOUND:')
      for (const match of futureDates.rows) {
        console.log(`      Match ${match.id}: ${match.home_team} vs ${match.away_team} on ${match.match_date?.toISOString()?.split('T')[0]} (${match.year})`)
        this.issues.push({
          type: 'future_match',
          matchId: match.id,
          date: match.match_date,
          year: match.year
        })
      }
    } else {
      console.log('   ✅ No future matches found')
    }
    
    console.log('')
  }

  async validateSeasonYears() {
    console.log('🏆 VALIDATING SEASON YEARS:')
    
    // Check for inconsistent season years vs match dates
    const inconsistentSeasons = await pool.query(`
      WITH season_date_check AS (
        SELECT 
          s.id,
          s.year,
          s.name,
          COUNT(m.id) as match_count,
          EXTRACT(YEAR FROM MIN(m.match_date)) as earliest_year,
          EXTRACT(YEAR FROM MAX(m.match_date)) as latest_year,
          MIN(m.match_date) as earliest_date,
          MAX(m.match_date) as latest_date
        FROM seasons s
        JOIN matches m ON s.id = m.season_id
        WHERE m.match_date IS NOT NULL
        GROUP BY s.id, s.year, s.name
      )
      SELECT 
        *,
        CASE 
          WHEN year < earliest_year - 1 OR year > latest_year + 1 THEN 'inconsistent'
          WHEN ABS(year - earliest_year) > 2 THEN 'suspicious'
          ELSE 'ok'
        END as consistency_check
      FROM season_date_check
      WHERE earliest_year IS NOT NULL
      ORDER BY year
    `)
    
    for (const season of inconsistentSeasons.rows) {
      if (season.consistency_check !== 'ok') {
        const status = season.consistency_check === 'inconsistent' ? '🚨' : '⚠️'
        console.log(`   ${status} Season ${season.year}: Matches from ${season.earliest_year} to ${season.latest_year}`)
        console.log(`      📅 Date range: ${season.earliest_date?.toISOString()?.split('T')[0]} to ${season.latest_date?.toISOString()?.split('T')[0]}`)
        
        this.issues.push({
          type: 'inconsistent_year',
          seasonId: season.id,
          seasonYear: season.year,
          matchYears: `${season.earliest_year}-${season.latest_year}`,
          reason: `Season year ${season.year} doesn't match match years ${season.earliest_year}-${season.latest_year}`
        })
      } else {
        console.log(`   ✅ Season ${season.year}: Consistent (${season.earliest_year}-${season.latest_year})`)
      }
    }
    
    console.log('')
  }

  async cleanupInvalidData() {
    console.log('🧹 CLEANING UP INVALID DATA:')
    
    if (this.issues.length === 0) {
      console.log('   ✅ No issues to fix')
      return
    }
    
    console.log(`   🔧 Fixing ${this.issues.length} issues...`)
    console.log('')
    
    for (const issue of this.issues) {
      try {
        await this.fixIssue(issue)
      } catch (error) {
        console.log(`   ❌ Failed to fix ${issue.type}: ${error.message}`)
      }
    }
    
    console.log('')
  }

  async fixIssue(issue) {
    switch (issue.type) {
      case 'ghost_season':
        await this.fixGhostSeason(issue)
        break
      case 'future_match':
        await this.fixFutureMatch(issue)
        break
      case 'excessive_matches':
        await this.fixExcessiveMatches(issue)
        break
      case 'inconsistent_year':
        await this.fixInconsistentYear(issue)
        break
      default:
        console.log(`   ⚠️ Unknown issue type: ${issue.type}`)
    }
  }

  async fixGhostSeason(issue) {
    console.log(`   🚨 Fixing ghost season ${issue.year}...`)
    
    // Check if season has any real data
    const seasonData = await pool.query(`
      SELECT 
        COUNT(m.id) as match_count,
        COUNT(g.id) as goal_count
      FROM seasons s
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.id = $1
    `, [issue.seasonId])
    
    const data = seasonData.rows[0]
    
    if (data.match_count === 0 && data.goal_count === 0) {
      // Safe to delete empty ghost season
      await pool.query('DELETE FROM seasons WHERE id = $1', [issue.seasonId])
      console.log(`      ✅ Deleted empty ghost season ${issue.year}`)
      this.fixes.push(`Deleted ghost season ${issue.year}`)
    } else {
      // Has data - investigate further
      console.log(`      ⚠️ Ghost season ${issue.year} has data (${data.match_count} matches, ${data.goal_count} goals)`)
      console.log(`      🔍 Manual review required`)
    }
  }

  async fixFutureMatch(issue) {
    console.log(`   📅 Fixing future match ${issue.matchId} (${issue.date?.toISOString()?.split('T')[0]})...`)
    
    // Check if match has any goals
    const matchData = await pool.query(`
      SELECT COUNT(*) as goal_count FROM goals WHERE match_id = $1
    `, [issue.matchId])
    
    if (matchData.rows[0].goal_count === 0) {
      // Safe to delete match without goals
      await pool.query('DELETE FROM matches WHERE id = $1', [issue.matchId])
      console.log(`      ✅ Deleted future match ${issue.matchId}`)
      this.fixes.push(`Deleted future match ${issue.matchId}`)
    } else {
      // Has goals - might be date error
      console.log(`      ⚠️ Future match ${issue.matchId} has ${matchData.rows[0].goal_count} goals`)
      console.log(`      🔍 Possible date error - manual review required`)
    }
  }

  async fixExcessiveMatches(issue) {
    console.log(`   📊 Investigating excessive matches in season ${issue.year}...`)
    
    // Analyze match distribution
    const analysis = await pool.query(`
      SELECT 
        DATE(m.match_date) as match_date,
        COUNT(*) as matches_on_date,
        array_agg(m.id) as match_ids
      FROM matches m
      WHERE m.season_id = $1
      GROUP BY DATE(m.match_date)
      HAVING COUNT(*) > 10
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `, [issue.seasonId])
    
    if (analysis.rows.length > 0) {
      console.log(`      🚨 Found dates with excessive matches:`)
      for (const date of analysis.rows) {
        console.log(`        ${date.match_date}: ${date.matches_on_date} matches`)
      }
      console.log(`      🔍 Possible duplicate imports - manual review required`)
    }
  }

  async fixInconsistentYear(issue) {
    console.log(`   🏆 Season ${issue.seasonYear} has inconsistent match years ${issue.matchYears}`)
    console.log(`      🔍 Manual review required to determine correct season year`)
  }

  async verifyFix() {
    console.log('✅ VERIFICATION:')
    
    // Re-check for issues
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentSeasonYear = currentMonth >= 8 ? currentYear + 1 : currentYear
    
    // Check for remaining ghost seasons
    const ghostSeasons = await pool.query(`
      SELECT COUNT(*) as count 
      FROM seasons 
      WHERE year > $1
    `, [currentSeasonYear])
    
    console.log(`   🚨 Ghost seasons remaining: ${ghostSeasons.rows[0].count}`)
    
    // Check for future matches
    const futureMatches = await pool.query(`
      SELECT COUNT(*) as count 
      FROM matches 
      WHERE match_date > CURRENT_DATE
    `)
    
    console.log(`   📅 Future matches remaining: ${futureMatches.rows[0].count}`)
    
    // Summary
    console.log('')
    console.log('📋 CLEANUP SUMMARY:')
    console.log(`   🔧 Issues identified: ${this.issues.length}`)
    console.log(`   ✅ Fixes applied: ${this.fixes.length}`)
    
    if (this.fixes.length > 0) {
      console.log('')
      console.log('   Applied fixes:')
      for (const fix of this.fixes) {
        console.log(`   • ${fix}`)
      }
    }
    
    const remainingIssues = parseInt(ghostSeasons.rows[0].count) + parseInt(futureMatches.rows[0].count)
    
    if (remainingIssues === 0) {
      console.log('')
      console.log('🎉 GHOST SEASON CLEANUP COMPLETE!')
      console.log('✅ Ready to proceed with match-by-match validation')
    } else {
      console.log('')
      console.log('⚠️ Some issues require manual review')
      console.log('🔍 Additional investigation needed')
    }
  }
}

// Execute ghost season fix
const fixer = new GhostSeasonFixer()
fixer.fixGhostSeasons()