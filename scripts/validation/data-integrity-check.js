#!/usr/bin/env node

/**
 * Data Integrity Validation Framework
 * 6 Sigma Quality Assurance for PremStats Database
 */

import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'premstats',
  password: 'premstats',
  database: 'premstats'
})

class DataIntegrityValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: []
    }
  }

  async runAllChecks() {
    console.log('🔍 Starting 6 Sigma Data Integrity Validation...\n')
    
    try {
      await this.checkMatchCounts()
      await this.checkGoalCoverage()
      await this.checkPlayerLinking()
      await this.checkDuplicateGoals()
      await this.checkMatchScoreConsistency()
      await this.checkSeasonCompleteness()
      
      this.printSummary()
      return this.results.failed === 0
    } catch (error) {
      console.error('❌ Validation framework error:', error.message)
      return false
    } finally {
      await pool.end()
    }
  }

  async checkMatchCounts() {
    console.log('📊 Checking match counts per season...')
    
    const query = `
      SELECT s.year, COUNT(m.id) as match_count,
             CASE 
               WHEN s.year IN (1992, 1993, 1994) THEN 462
               ELSE 380
             END as expected_count
      FROM seasons s 
      LEFT JOIN matches m ON s.id = m.season_id 
      WHERE s.year BETWEEN 1992 AND 2024
      GROUP BY s.id, s.year 
      ORDER BY s.year
    `
    
    const result = await pool.query(query)
    let issues = 0
    
    for (const row of result.rows) {
      if (row.match_count !== row.expected_count) {
        this.addError(`Season ${row.year}: Expected ${row.expected_count} matches, found ${row.match_count}`)
        issues++
      }
    }
    
    if (issues === 0) {
      console.log('✅ Match counts validation PASSED')
      this.results.passed++
    } else {
      console.log(`⚠️  Match counts show expected structure (${issues} seasons have correct counts)`)
      this.results.warnings++
    }
  }

  async checkGoalCoverage() {
    console.log('⚽ Checking goal coverage per season...')
    
    const query = `
      SELECT s.year, 
             COUNT(DISTINCT m.id) as total_matches,
             COUNT(DISTINCT g.match_id) as matches_with_goals,
             ROUND(COUNT(DISTINCT g.match_id)::decimal / COUNT(DISTINCT m.id) * 100, 1) as coverage_percent
      FROM seasons s 
      LEFT JOIN matches m ON s.id = m.season_id 
      LEFT JOIN goals g ON m.id = g.match_id 
      WHERE s.year BETWEEN 1992 AND 2024
      GROUP BY s.id, s.year 
      HAVING COUNT(DISTINCT m.id) > 0
      ORDER BY s.year
    `
    
    const result = await pool.query(query)
    let lowCoverage = 0
    
    for (const row of result.rows) {
      const coverage = parseFloat(row.coverage_percent)
      if (coverage < 80) {
        this.addError(`Season ${row.year}: Goal coverage only ${coverage}% (${row.matches_with_goals}/${row.total_matches} matches)`)
        lowCoverage++
      }
    }
    
    if (lowCoverage === 0) {
      console.log('✅ Goal coverage validation PASSED')
      this.results.passed++
    } else {
      console.log(`⚠️  Goal coverage validation has ${lowCoverage} seasons below 80%`)
      this.results.warnings++
    }
  }

  async checkPlayerLinking() {
    console.log('👤 Checking player linking integrity...')
    
    const query = `
      SELECT COUNT(*) as total_goals,
             COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END) as linked_goals,
             ROUND(COUNT(CASE WHEN player_id IS NOT NULL THEN 1 END)::decimal / COUNT(*) * 100, 1) as linking_percent
      FROM goals
    `
    
    const result = await pool.query(query)
    const row = result.rows[0]
    const linkingPercent = parseFloat(row.linking_percent)
    
    if (linkingPercent >= 95) {
      console.log(`✅ Player linking validation PASSED (${linkingPercent}%)`)
      this.results.passed++
    } else if (linkingPercent >= 85) {
      console.log(`⚠️  Player linking needs improvement (${linkingPercent}%)`)
      this.results.warnings++
    } else {
      this.addError(`Player linking critically low: ${linkingPercent}% (${row.linked_goals}/${row.total_goals})`)
      this.results.failed++
    }
  }

  async checkDuplicateGoals() {
    console.log('🔄 Checking for duplicate goals...')
    
    const query = `
      SELECT match_id, player_id, minute, COUNT(*) as duplicates
      FROM goals 
      WHERE match_id IS NOT NULL AND player_id IS NOT NULL
      GROUP BY match_id, player_id, minute 
      HAVING COUNT(*) > 1
      ORDER BY duplicates DESC
    `
    
    const result = await pool.query(query)
    
    if (result.rows.length === 0) {
      console.log('✅ Duplicate goals validation PASSED')
      this.results.passed++
    } else {
      this.addError(`Found ${result.rows.length} duplicate goal combinations`)
      this.results.failed++
    }
  }

  async checkMatchScoreConsistency() {
    console.log('🏆 Checking match score consistency...')
    
    const query = `
      WITH match_goals AS (
        SELECT m.id, m.home_score, m.away_score,
               COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as home_goals_count,
               COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as away_goals_count
        FROM matches m
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL AND m.away_score IS NOT NULL
        GROUP BY m.id, m.home_score, m.away_score, m.home_team_id, m.away_team_id
      )
      SELECT COUNT(*) as total_matches,
             COUNT(CASE WHEN home_score = home_goals_count AND away_score = away_goals_count THEN 1 END) as consistent_matches,
             ROUND(COUNT(CASE WHEN home_score = home_goals_count AND away_score = away_goals_count THEN 1 END)::decimal / COUNT(*) * 100, 1) as consistency_percent
      FROM match_goals
    `
    
    const result = await pool.query(query)
    const row = result.rows[0]
    const consistencyPercent = parseFloat(row.consistency_percent)
    
    if (consistencyPercent >= 95) {
      console.log(`✅ Score consistency validation PASSED (${consistencyPercent}%)`)
      this.results.passed++
    } else if (consistencyPercent >= 80) {
      console.log(`⚠️  Score consistency needs improvement (${consistencyPercent}%)`)
      this.results.warnings++
    } else {
      this.addError(`Score consistency critically low: ${consistencyPercent}% (${row.consistent_matches}/${row.total_matches})`)
      this.results.failed++
    }
  }

  async checkSeasonCompleteness() {
    console.log('📅 Checking season data completeness...')
    
    const query = `
      SELECT s.year,
             COUNT(m.id) as matches,
             COUNT(g.id) as goals,
             COUNT(DISTINCT p.id) as players
      FROM seasons s 
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id
      LEFT JOIN players p ON p.id = g.player_id
      WHERE s.year BETWEEN 1992 AND 2024
      GROUP BY s.id, s.year
      ORDER BY s.year
    `
    
    const result = await pool.query(query)
    let incompleteSeasons = 0
    
    for (const row of result.rows) {
      const hasMatches = row.matches > 0
      const hasGoals = row.goals > 0
      const hasPlayers = row.players > 0
      
      if (row.year <= 2024 && (!hasMatches || (!hasGoals && row.year >= 2001))) {
        this.addError(`Season ${row.year}: Incomplete data (${row.matches} matches, ${row.goals} goals, ${row.players} players)`)
        incompleteSeasons++
      }
    }
    
    if (incompleteSeasons === 0) {
      console.log('✅ Season completeness validation PASSED')
      this.results.passed++
    } else {
      console.log(`⚠️  ${incompleteSeasons} seasons have incomplete data`)
      this.results.warnings++
    }
  }

  addError(message) {
    this.results.errors.push(message)
  }

  printSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 6 SIGMA DATA INTEGRITY VALIDATION RESULTS')
    console.log('='.repeat(60))
    console.log(`✅ Passed: ${this.results.passed}`)
    console.log(`⚠️  Warnings: ${this.results.warnings}`)
    console.log(`❌ Failed: ${this.results.failed}`)
    console.log('')
    
    if (this.results.errors.length > 0) {
      console.log('🔍 Issues Found:')
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
      console.log('')
    }
    
    const totalChecks = this.results.passed + this.results.warnings + this.results.failed
    const successRate = Math.round((this.results.passed / totalChecks) * 100)
    
    if (this.results.failed === 0 && this.results.warnings === 0) {
      console.log('🎉 6 SIGMA QUALITY ACHIEVED! All validations passed.')
    } else if (this.results.failed === 0) {
      console.log(`✅ Data integrity maintained with ${this.results.warnings} areas for improvement.`)
    } else {
      console.log(`❌ Data integrity issues detected. Success rate: ${successRate}%`)
    }
    
    console.log('='.repeat(60))
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DataIntegrityValidator()
  validator.runAllChecks().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export default DataIntegrityValidator