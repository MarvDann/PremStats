#!/usr/bin/env node

/**
 * Score Consistency Validator
 * Phase 3: Cross-reference goals with actual match scores for data integrity
 */

import 'dotenv/config'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class ScoreConsistencyValidator {
  constructor() {
    this.results = {
      totalMatches: 0,
      consistentMatches: 0,
      inconsistentMatches: 0,
      missingScores: 0,
      missingGoals: 0,
      corrections: []
    }
  }

  async validateScoreConsistency() {
    const spinner = ora('🔍 Starting score consistency validation...').start()
    
    try {
      console.log('🎯 Phase 3: Score Consistency Validation')
      console.log('⚡ Cross-referencing goals with match scores')
      console.log('')
      
      spinner.text = 'Analyzing match score consistency...'
      await this.analyzeScoreConsistency()
      
      spinner.text = 'Identifying correction opportunities...'
      await this.identifyCorrections()
      
      spinner.text = 'Generating data quality report...'
      await this.generateQualityReport()
      
      spinner.succeed('✅ Score consistency validation complete')
      
      await this.printResults()
      
    } catch (error) {
      spinner.fail(`❌ Validation failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  async analyzeScoreConsistency() {
    const query = `
      WITH match_goal_counts AS (
        SELECT 
          m.id,
          m.home_score,
          m.away_score,
          ht.name as home_team,
          at.name as away_team,
          m.match_date,
          COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as home_goals_count,
          COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as away_goals_count,
          COUNT(g.id) as total_goals_recorded
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
        GROUP BY m.id, m.home_score, m.away_score, ht.name, at.name, m.match_date, m.home_team_id, m.away_team_id
      )
      SELECT 
        *,
        CASE 
          WHEN home_score = home_goals_count AND away_score = away_goals_count THEN 'consistent'
          WHEN total_goals_recorded = 0 THEN 'missing_goals'
          WHEN home_score IS NULL OR away_score IS NULL THEN 'missing_scores'
          ELSE 'inconsistent'
        END as status
      FROM match_goal_counts
      ORDER BY match_date DESC
    `
    
    const result = await pool.query(query)
    
    for (const match of result.rows) {
      this.results.totalMatches++
      
      switch (match.status) {
        case 'consistent':
          this.results.consistentMatches++
          break
        case 'inconsistent':
          this.results.inconsistentMatches++
          break
        case 'missing_goals':
          this.results.missingGoals++
          break
        case 'missing_scores':
          this.results.missingScores++
          break
      }
    }
    
    return result.rows
  }

  async identifyCorrections() {
    // Find matches where goals don't match scores but we can correct them
    const query = `
      WITH match_analysis AS (
        SELECT 
          m.id,
          m.home_score,
          m.away_score,
          ht.name as home_team,
          at.name as away_team,
          m.match_date,
          COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as home_goals_count,
          COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as away_goals_count,
          COUNT(g.id) as total_goals_recorded
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
        GROUP BY m.id, m.home_score, m.away_score, ht.name, at.name, m.match_date, m.home_team_id, m.away_team_id
      )
      SELECT *
      FROM match_analysis
      WHERE NOT (home_score = home_goals_count AND away_score = away_goals_count)
      AND total_goals_recorded > 0
      ORDER BY ABS((home_score + away_score) - total_goals_recorded)
      LIMIT 50
    `
    
    const result = await pool.query(query)
    
    for (const match of result.rows) {
      const correction = this.analyzeCorrection(match)
      if (correction) {
        this.results.corrections.push(correction)
      }
    }
  }

  analyzeCorrection(match) {
    const expectedTotal = match.home_score + match.away_score
    const actualTotal = match.total_goals_recorded
    const difference = Math.abs(expectedTotal - actualTotal)
    
    // Only suggest corrections for small differences
    if (difference <= 3) {
      return {
        matchId: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        date: match.match_date,
        expectedScore: `${match.home_score}-${match.away_score}`,
        actualGoals: `${match.home_goals_count}-${match.away_goals_count}`,
        totalExpected: expectedTotal,
        totalActual: actualTotal,
        difference: difference,
        suggestion: this.generateCorrectionSuggestion(match, difference)
      }
    }
    
    return null
  }

  generateCorrectionSuggestion(match, difference) {
    if (match.total_goals_recorded === 0) {
      return 'Import missing goals from additional data sources'
    } else if (match.total_goals_recorded < (match.home_score + match.away_score)) {
      return `Missing ${difference} goals - check for unrecorded goals`
    } else if (match.total_goals_recorded > (match.home_score + match.away_score)) {
      return `Extra ${difference} goals - check for duplicate entries or own goals`
    } else {
      return 'Team attribution needs correction'
    }
  }

  async generateQualityReport() {
    // Generate additional insights about data quality
    const insights = await Promise.all([
      this.getSeasonalConsistency(),
      this.getTeamConsistency(),
      this.getCommonIssues()
    ])
    
    this.results.seasonalConsistency = insights[0]
    this.results.teamConsistency = insights[1] 
    this.results.commonIssues = insights[2]
  }

  async getSeasonalConsistency() {
    const query = `
      WITH seasonal_analysis AS (
        SELECT 
          s.year,
          COUNT(m.id) as total_matches,
          COUNT(CASE WHEN m.home_score IS NOT NULL AND m.away_score IS NOT NULL THEN 1 END) as matches_with_scores,
          COUNT(CASE WHEN g.id IS NOT NULL THEN 1 END) as matches_with_goals,
          COUNT(CASE 
            WHEN m.home_score = home_goals.count AND m.away_score = away_goals.count 
            THEN 1 
          END) as consistent_matches
        FROM seasons s
        LEFT JOIN matches m ON s.id = m.season_id
        LEFT JOIN goals g ON m.id = g.match_id
        LEFT JOIN (
          SELECT match_id, team_id, COUNT(*) as count
          FROM goals 
          GROUP BY match_id, team_id
        ) home_goals ON m.id = home_goals.match_id AND m.home_team_id = home_goals.team_id
        LEFT JOIN (
          SELECT match_id, team_id, COUNT(*) as count
          FROM goals 
          GROUP BY match_id, team_id
        ) away_goals ON m.id = away_goals.match_id AND m.away_team_id = away_goals.team_id
        WHERE s.year BETWEEN 2001 AND 2022
        GROUP BY s.id, s.year
        ORDER BY s.year
      )
      SELECT 
        year,
        total_matches,
        matches_with_scores,
        matches_with_goals,
        consistent_matches,
        ROUND(
          CASE 
            WHEN matches_with_scores > 0 
            THEN (consistent_matches::decimal / matches_with_scores) * 100 
            ELSE 0 
          END, 1
        ) as consistency_percentage
      FROM seasonal_analysis
    `
    
    const result = await pool.query(query)
    return result.rows
  }

  async getTeamConsistency() {
    const query = `
      SELECT 
        t.name,
        COUNT(DISTINCT m.id) as matches_played,
        COUNT(DISTINCT g.match_id) as matches_with_goals,
        ROUND(
          (COUNT(DISTINCT g.match_id)::decimal / COUNT(DISTINCT m.id)) * 100, 1
        ) as goal_coverage_percentage
      FROM teams t
      LEFT JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
      LEFT JOIN goals g ON m.id = g.match_id AND g.team_id = t.id
      WHERE m.match_date BETWEEN '2001-01-01' AND '2022-12-31'
      GROUP BY t.id, t.name
      HAVING COUNT(DISTINCT m.id) > 100
      ORDER BY goal_coverage_percentage DESC
      LIMIT 20
    `
    
    const result = await pool.query(query)
    return result.rows
  }

  async getCommonIssues() {
    const issues = []
    
    // Check for common patterns in inconsistencies
    const query = `
      WITH issue_analysis AS (
        SELECT 
          m.home_score + m.away_score as expected_total,
          COUNT(g.id) as actual_total,
          COUNT(*) as frequency
        FROM matches m
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL AND m.away_score IS NOT NULL
        GROUP BY m.id, m.home_score, m.away_score
        HAVING (m.home_score + m.away_score) != COUNT(g.id)
      )
      SELECT 
        expected_total,
        actual_total,
        SUM(frequency) as total_occurrences
      FROM issue_analysis
      GROUP BY expected_total, actual_total
      ORDER BY total_occurrences DESC
      LIMIT 10
    `
    
    const result = await pool.query(query)
    
    for (const row of result.rows) {
      issues.push({
        pattern: `Expected ${row.expected_total} goals, found ${row.actual_total}`,
        occurrences: row.total_occurrences,
        impact: row.expected_total - row.actual_total
      })
    }
    
    return issues
  }

  async printResults() {
    console.log('\n' + '='.repeat(70))
    console.log('📊 PHASE 3: SCORE CONSISTENCY VALIDATION RESULTS')
    console.log('='.repeat(70))
    
    const consistencyRate = ((this.results.consistentMatches / this.results.totalMatches) * 100).toFixed(1)
    
    console.log(`📈 Overall Consistency Rate: ${consistencyRate}%`)
    console.log(`📊 Total Matches Analyzed: ${this.results.totalMatches}`)
    console.log(`✅ Consistent Matches: ${this.results.consistentMatches}`)
    console.log(`❌ Inconsistent Matches: ${this.results.inconsistentMatches}`)
    console.log(`❓ Missing Goals: ${this.results.missingGoals}`)
    console.log(`❓ Missing Scores: ${this.results.missingScores}`)
    console.log('')
    
    // Show top correction opportunities
    if (this.results.corrections.length > 0) {
      console.log('🔧 TOP CORRECTION OPPORTUNITIES:')
      this.results.corrections.slice(0, 10).forEach((correction, index) => {
        console.log(`${index + 1}. ${correction.homeTeam} vs ${correction.awayTeam}`)
        console.log(`   Expected: ${correction.expectedScore}, Actual Goals: ${correction.actualGoals}`)
        console.log(`   Suggestion: ${correction.suggestion}`)
        console.log('')
      })
    }
    
    // Show seasonal trends
    if (this.results.seasonalConsistency) {
      console.log('📅 SEASONAL CONSISTENCY TRENDS:')
      this.results.seasonalConsistency.slice(0, 5).forEach(season => {
        console.log(`   ${season.year}: ${season.consistency_percentage}% consistent (${season.consistent_matches}/${season.matches_with_scores} matches)`)
      })
      console.log('')
    }
    
    // Show common issues
    if (this.results.commonIssues && this.results.commonIssues.length > 0) {
      console.log('🔍 COMMON INCONSISTENCY PATTERNS:')
      this.results.commonIssues.slice(0, 5).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.pattern} (${issue.occurrences} occurrences)`)
      })
      console.log('')
    }
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:')
    if (parseFloat(consistencyRate) < 80) {
      console.log('1. 🎯 Focus on importing missing goals for matches with 0 recorded goals')
      console.log('2. 🔍 Review team attribution for goals (home vs away assignment)')
      console.log('3. 📊 Cross-reference with additional data sources for verification')
      console.log('4. 🧹 Implement automated duplicate detection and removal')
    } else {
      console.log('1. ✅ Excellent consistency achieved!')
      console.log('2. 🔄 Implement ongoing monitoring for new data imports')
      console.log('3. 📈 Focus on expanding coverage to missing seasons')
    }
    
    console.log('='.repeat(70))
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ScoreConsistencyValidator()
  validator.validateScoreConsistency()
}

export default ScoreConsistencyValidator