#!/usr/bin/env node

/**
 * 6 Sigma Validation Framework
 * Comprehensive testing to validate our actual database quality
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class SixSigmaValidationFramework {
  constructor() {
    this.testResults = {
      randomSampleTest: [],
      scoreConsistencyTest: [],
      dataIntegrityTest: [],
      coverageTest: [],
      overall: {}
    }
    this.defectCount = 0
    this.totalTests = 0
  }

  async executeValidationFramework() {
    console.log('🎯 6 SIGMA VALIDATION FRAMEWORK')
    console.log('=' .repeat(60))
    console.log('')
    
    try {
      // Test 1: Random Sample Accuracy Test
      await this.randomSampleAccuracyTest()
      
      // Test 2: Score Consistency Test
      await this.scoreConsistencyTest()
      
      // Test 3: Data Integrity Test
      await this.dataIntegrityTest()
      
      // Test 4: Coverage Assessment
      await this.coverageAssessmentTest()
      
      // Calculate 6 Sigma Quality Score
      await this.calculateSixSigmaScore()
      
    } catch (error) {
      console.error('❌ Validation framework failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async randomSampleAccuracyTest() {
    console.log('🎲 RANDOM SAMPLE ACCURACY TEST:')
    console.log('Testing 20 random matches with goals for 6 Sigma accuracy...')
    console.log('')
    
    // Get random matches that should have goals
    const randomMatches = await pool.query(`
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        m.home_score + m.away_score as expected_goals,
        s.year
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.home_score IS NOT NULL 
      AND m.away_score IS NOT NULL
      AND m.home_score + m.away_score > 0
      ORDER BY RANDOM()
      LIMIT 20
    `)
    
    let perfectMatches = 0
    
    for (const match of randomMatches.rows) {
      // Count actual goals in database
      const goalCheck = await pool.query(`
        SELECT 
          COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as home_goals,
          COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as away_goals,
          COUNT(*) as total_goals
        FROM goals g
        JOIN matches m ON g.match_id = m.id
        WHERE g.match_id = $1
        GROUP BY m.home_team_id, m.away_team_id
      `, [match.id])
      
      const actual = goalCheck.rows[0] || { home_goals: 0, away_goals: 0, total_goals: 0 }
      const actualHome = parseInt(actual.home_goals)
      const actualAway = parseInt(actual.away_goals)
      const actualTotal = parseInt(actual.total_goals)
      
      const isExact = (actualHome === match.home_score && actualAway === match.away_score)
      const hasData = actualTotal > 0
      
      const status = isExact ? '✅' : hasData ? '🔄' : '❌'
      
      console.log(`   ${status} ID ${match.id}: ${match.home_team} vs ${match.away_team} (${match.year})`)
      console.log(`      Expected: ${match.home_score}-${match.away_score} | Actual: ${actualHome}-${actualAway}`)
      
      if (isExact) {
        perfectMatches++
      } else {
        this.defectCount++
      }
      
      this.testResults.randomSampleTest.push({
        matchId: match.id,
        expected: match.expected_goals,
        actual: actualTotal,
        perfect: isExact,
        hasData
      })
      
      this.totalTests++
    }
    
    const accuracyRate = (perfectMatches / randomMatches.rows.length * 100).toFixed(2)
    console.log('')
    console.log(`   📊 Random Sample Accuracy: ${accuracyRate}% (${perfectMatches}/${randomMatches.rows.length})`)
    console.log(`   🎯 6 Sigma Standard: 99.99966%`)
    console.log(`   ${parseFloat(accuracyRate) >= 99.99966 ? '✅' : '❌'} Meets 6 Sigma Standard`)
    console.log('')
  }

  async scoreConsistencyTest() {
    console.log('📊 SCORE CONSISTENCY TEST:')
    console.log('Validating all matches with goal data for score consistency...')
    console.log('')
    
    const consistencyCheck = await pool.query(`
      WITH match_analysis AS (
        SELECT 
          m.id,
          m.home_score,
          m.away_score,
          COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as actual_home,
          COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as actual_away,
          COUNT(g.id) as total_goals
        FROM matches m
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
        AND EXISTS (SELECT 1 FROM goals WHERE match_id = m.id)
        GROUP BY m.id, m.home_score, m.away_score
      )
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN actual_home = home_score AND actual_away = away_score THEN 1 END) as perfect_matches,
        COUNT(CASE WHEN total_goals = (home_score + away_score) THEN 1 END) as correct_total_only,
        AVG(ABS(actual_home - home_score) + ABS(actual_away - away_score)) as avg_goal_deviation
      FROM match_analysis
    `)
    
    const consistency = consistencyCheck.rows[0]
    const perfectRate = (parseInt(consistency.perfect_matches) / parseInt(consistency.total_matches) * 100).toFixed(2)
    const totalCorrectRate = (parseInt(consistency.correct_total_only) / parseInt(consistency.total_matches) * 100).toFixed(2)
    
    console.log(`   📊 Matches with Goal Data: ${consistency.total_matches}`)
    console.log(`   ✅ Perfect Score Matches: ${consistency.perfect_matches} (${perfectRate}%)`)
    console.log(`   🔄 Correct Total Only: ${consistency.correct_total_only} (${totalCorrectRate}%)`)
    console.log(`   📈 Average Goal Deviation: ${parseFloat(consistency.avg_goal_deviation).toFixed(2)}`)
    console.log('')
    
    // For 6 Sigma, we need near-perfect score consistency
    if (parseFloat(perfectRate) < 99.99966) {
      this.defectCount += parseInt(consistency.total_matches) - parseInt(consistency.perfect_matches)
    }
    this.totalTests += parseInt(consistency.total_matches)
    
    this.testResults.scoreConsistencyTest = {
      totalMatches: parseInt(consistency.total_matches),
      perfectMatches: parseInt(consistency.perfect_matches),
      perfectRate: parseFloat(perfectRate),
      avgDeviation: parseFloat(consistency.avg_goal_deviation)
    }
  }

  async dataIntegrityTest() {
    console.log('🔍 DATA INTEGRITY TEST:')
    console.log('Checking for data corruption and inconsistencies...')
    console.log('')
    
    // Test 1: Orphaned goals
    const orphanedGoals = await pool.query(`
      SELECT COUNT(*) as count FROM goals g
      WHERE NOT EXISTS (SELECT 1 FROM matches WHERE id = g.match_id)
    `)
    
    console.log(`   🔗 Orphaned Goals: ${orphanedGoals.rows[0].count}`)
    if (parseInt(orphanedGoals.rows[0].count) > 0) {
      this.defectCount += parseInt(orphanedGoals.rows[0].count)
    }
    
    // Test 2: Goals without team attribution
    const unattributedGoals = await pool.query(`
      SELECT COUNT(*) as count FROM goals WHERE team_id IS NULL
    `)
    
    console.log(`   👥 Goals without Team: ${unattributedGoals.rows[0].count}`)
    if (parseInt(unattributedGoals.rows[0].count) > 0) {
      this.defectCount += parseInt(unattributedGoals.rows[0].count)
    }
    
    // Test 3: Goals without player attribution
    const unattributedPlayers = await pool.query(`
      SELECT COUNT(*) as count FROM goals WHERE player_id IS NULL
    `)
    
    console.log(`   👤 Goals without Player: ${unattributedPlayers.rows[0].count}`)
    if (parseInt(unattributedPlayers.rows[0].count) > 0) {
      this.defectCount += parseInt(unattributedPlayers.rows[0].count)
    }
    
    // Test 4: Duplicate goals
    const duplicateGoals = await pool.query(`
      SELECT COUNT(*) as count FROM (
        SELECT match_id, player_id, team_id, minute, COUNT(*)
        FROM goals
        GROUP BY match_id, player_id, team_id, minute
        HAVING COUNT(*) > 1
      ) duplicates
    `)
    
    console.log(`   📊 Duplicate Goals: ${duplicateGoals.rows[0].count}`)
    if (parseInt(duplicateGoals.rows[0].count) > 0) {
      this.defectCount += parseInt(duplicateGoals.rows[0].count)
    }
    
    // Test 5: Invalid goal minutes
    const invalidMinutes = await pool.query(`
      SELECT COUNT(*) as count FROM goals 
      WHERE minute < 1 OR minute > 120
    `)
    
    console.log(`   ⏰ Invalid Goal Minutes: ${invalidMinutes.rows[0].count}`)
    if (parseInt(invalidMinutes.rows[0].count) > 0) {
      this.defectCount += parseInt(invalidMinutes.rows[0].count)
    }
    
    this.testResults.dataIntegrityTest = {
      orphanedGoals: parseInt(orphanedGoals.rows[0].count),
      unattributedTeams: parseInt(unattributedGoals.rows[0].count),
      unattributedPlayers: parseInt(unattributedPlayers.rows[0].count),
      duplicates: parseInt(duplicateGoals.rows[0].count),
      invalidMinutes: parseInt(invalidMinutes.rows[0].count)
    }
    
    console.log('')
  }

  async coverageAssessmentTest() {
    console.log('📈 COVERAGE ASSESSMENT TEST:')
    console.log('Evaluating data coverage across seasons...')
    console.log('')
    
    const coverageAnalysis = await pool.query(`
      WITH season_coverage AS (
        SELECT 
          s.year,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT g.match_id) as matches_with_goals,
          COUNT(g.id) as total_goals,
          ROUND(
            CASE 
              WHEN COUNT(DISTINCT m.id) > 0 
              THEN COUNT(DISTINCT g.match_id)::decimal / COUNT(DISTINCT m.id) * 100
              ELSE 0
            END, 1
          ) as coverage_percentage
        FROM seasons s
        LEFT JOIN matches m ON s.id = m.season_id
        LEFT JOIN goals g ON m.id = g.match_id
        GROUP BY s.id, s.year
        ORDER BY s.year
      )
      SELECT 
        COUNT(*) as total_seasons,
        COUNT(CASE WHEN coverage_percentage > 0 THEN 1 END) as seasons_with_data,
        COUNT(CASE WHEN coverage_percentage >= 50 THEN 1 END) as seasons_good_coverage,
        COUNT(CASE WHEN coverage_percentage >= 80 THEN 1 END) as seasons_excellent_coverage,
        ROUND(AVG(coverage_percentage), 1) as avg_coverage_percentage
      FROM season_coverage
    `)
    
    const coverage = coverageAnalysis.rows[0]
    
    console.log(`   📊 Total Seasons: ${coverage.total_seasons}`)
    console.log(`   📈 Seasons with Data: ${coverage.seasons_with_data}`)
    console.log(`   ✅ Good Coverage (≥50%): ${coverage.seasons_good_coverage}`)
    console.log(`   🌟 Excellent Coverage (≥80%): ${coverage.seasons_excellent_coverage}`)
    console.log(`   📊 Average Coverage: ${coverage.avg_coverage_percentage}%`)
    console.log('')
    
    this.testResults.coverageTest = {
      totalSeasons: parseInt(coverage.total_seasons),
      seasonsWithData: parseInt(coverage.seasons_with_data),
      goodCoverage: parseInt(coverage.seasons_good_coverage),
      excellentCoverage: parseInt(coverage.seasons_excellent_coverage),
      avgCoverage: parseFloat(coverage.avg_coverage_percentage)
    }
  }

  async calculateSixSigmaScore() {
    console.log('🎯 6 SIGMA QUALITY CALCULATION:')
    console.log('')
    
    // Calculate defect rate
    const defectRate = this.totalTests > 0 ? (this.defectCount / this.totalTests) : 1
    const qualityRate = (1 - defectRate) * 100
    const sixSigmaTarget = 99.99966
    
    console.log(`   📊 Total Tests Performed: ${this.totalTests.toLocaleString()}`)
    console.log(`   🚨 Total Defects Found: ${this.defectCount.toLocaleString()}`)
    console.log(`   📈 Quality Rate: ${qualityRate.toFixed(5)}%`)
    console.log(`   🎯 6 Sigma Target: ${sixSigmaTarget}%`)
    console.log('')
    
    // Determine sigma level
    let sigmaLevel, grade, status
    
    if (qualityRate >= 99.99966) {
      sigmaLevel = 6.0
      grade = 'A+'
      status = '🌟 WORLD CLASS'
    } else if (qualityRate >= 99.977) {
      sigmaLevel = 5.0
      grade = 'A'
      status = '⭐ EXCELLENT'
    } else if (qualityRate >= 99.38) {
      sigmaLevel = 4.0
      grade = 'B+'
      status = '✅ GOOD'
    } else if (qualityRate >= 93.32) {
      sigmaLevel = 3.0
      grade = 'B'
      status = '🔄 ACCEPTABLE'
    } else if (qualityRate >= 69.15) {
      sigmaLevel = 2.0
      grade = 'C'
      status = '⚠️ POOR'
    } else {
      sigmaLevel = 1.0
      grade = 'F'
      status = '❌ UNACCEPTABLE'
    }
    
    console.log(`   🏆 SIGMA LEVEL: ${sigmaLevel}σ`)
    console.log(`   📊 GRADE: ${grade}`)
    console.log(`   ${status}`)
    console.log('')
    
    // Detailed breakdown
    console.log('📋 QUALITY BREAKDOWN:')
    const sampleAccuracy = this.testResults.randomSampleTest.length > 0 
      ? (this.testResults.randomSampleTest.filter(t => t.perfect).length / this.testResults.randomSampleTest.length * 100).toFixed(1)
      : 0
    
    console.log(`   🎲 Random Sample Accuracy: ${sampleAccuracy}%`)
    console.log(`   📊 Score Consistency: ${this.testResults.scoreConsistencyTest.perfectRate || 0}%`)
    console.log(`   🔍 Data Integrity: ${this.testResults.dataIntegrityTest ? 'Issues found' : 'Clean'}`)
    console.log(`   📈 Coverage: ${this.testResults.coverageTest.avgCoverage || 0}%`)
    console.log('')
    
    this.testResults.overall = {
      defectRate,
      qualityRate,
      sigmaLevel,
      grade,
      status,
      meetsSixSigma: qualityRate >= sixSigmaTarget
    }
    
    // Final recommendation
    if (qualityRate >= sixSigmaTarget) {
      console.log('🎉 CONGRATULATIONS: 6 Sigma quality achieved!')
      console.log('✅ Production deployment approved')
    } else if (qualityRate >= 95) {
      console.log('🔄 HIGH QUALITY: Close to 6 Sigma standard')
      console.log('📈 Continue improvement efforts')
    } else {
      console.log('⚠️ QUALITY ISSUES: Significant improvements needed')
      console.log('🛑 Not suitable for production deployment')
      
      console.log('')
      console.log('🔧 RECOMMENDED ACTIONS:')
      if (parseFloat(sampleAccuracy) < 95) {
        console.log('1. Fix random sample accuracy issues')
      }
      if (this.testResults.scoreConsistencyTest.perfectRate < 95) {
        console.log('2. Improve score consistency validation')
      }
      if (this.defectCount > 100) {
        console.log('3. Resolve data integrity defects')
      }
      if (this.testResults.coverageTest.avgCoverage < 50) {
        console.log('4. Expand data coverage significantly')
      }
    }
  }
}

// Execute validation framework
const validator = new SixSigmaValidationFramework()
validator.executeValidationFramework()