#!/usr/bin/env node

/**
 * Critical Failure Analysis
 * Investigate the serious data integrity issues identified
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function analyzeCriticalFailures() {
  try {
    console.log('🚨 CRITICAL FAILURE ANALYSIS')
    console.log('=' .repeat(60))
    console.log('')
    
    // Issue 1: Future dates problem
    console.log('📅 FUTURE DATES INVESTIGATION:')
    const futureDates = await pool.query(`
      SELECT 
        s.year,
        COUNT(m.id) as match_count,
        MIN(m.match_date) as earliest_date,
        MAX(m.match_date) as latest_date
      FROM matches m
      JOIN seasons s ON m.season_id = s.id
      WHERE m.match_date > CURRENT_DATE
      OR s.year > 2025
      GROUP BY s.year
      ORDER BY s.year DESC
    `)
    
    if (futureDates.rows.length > 0) {
      console.log('   ❌ FOUND FUTURE DATES:')
      for (const season of futureDates.rows) {
        console.log(`   ${season.year}: ${season.match_count} matches (${season.earliest_date?.toISOString()?.split('T')[0]} to ${season.latest_date?.toISOString()?.split('T')[0]})`)
      }
    } else {
      console.log('   ✅ No future dates found')
    }
    console.log('')
    
    // Issue 2: Data distribution analysis
    console.log('📊 DATA DISTRIBUTION REALITY:')
    const distribution = await pool.query(`
      WITH season_analysis AS (
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
        *,
        CASE 
          WHEN coverage_percentage = 0 THEN 'ZERO'
          WHEN coverage_percentage < 10 THEN 'CRITICAL'
          WHEN coverage_percentage < 50 THEN 'POOR'
          WHEN coverage_percentage < 80 THEN 'FAIR'
          ELSE 'GOOD'
        END as grade
      FROM season_analysis
      WHERE total_matches > 0
    `)
    
    let zeroCount = 0, criticalCount = 0, poorCount = 0
    
    for (const season of distribution.rows) {
      const status = season.grade === 'ZERO' ? '❌' : 
                    season.grade === 'CRITICAL' ? '🚨' : 
                    season.grade === 'POOR' ? '⚠️' : 
                    season.grade === 'FAIR' ? '🔄' : '✅'
      
      console.log(`   ${status} ${season.year}: ${season.coverage_percentage}% (${season.matches_with_goals}/${season.total_matches}) - ${season.grade}`)
      
      if (season.grade === 'ZERO') zeroCount++
      if (season.grade === 'CRITICAL') criticalCount++
      if (season.grade === 'POOR') poorCount++
    }
    
    console.log('')
    console.log(`   📊 FAILURE SUMMARY:`)
    console.log(`   ❌ Zero Coverage: ${zeroCount} seasons`)
    console.log(`   🚨 Critical (<10%): ${criticalCount} seasons`)
    console.log(`   ⚠️ Poor (<50%): ${poorCount} seasons`)
    console.log('')
    
    // Issue 3: Random sampling verification
    console.log('🎲 RANDOM SAMPLE VERIFICATION:')
    const randomMatches = await pool.query(`
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        m.match_date,
        s.year,
        COUNT(g.id) as goal_count
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.home_score IS NOT NULL 
      AND m.away_score IS NOT NULL
      AND m.home_score + m.away_score > 0
      GROUP BY m.id, ht.name, at.name, m.home_score, m.away_score, m.match_date, s.year
      ORDER BY RANDOM()
      LIMIT 20
    `)
    
    let successCount = 0
    for (const match of randomMatches.rows) {
      const expected = match.home_score + match.away_score
      const actual = parseInt(match.goal_count)
      const success = (actual === expected)
      const status = success ? '✅' : (actual > 0 ? '🔄' : '❌')
      
      if (success) successCount++
      
      console.log(`   ${status} ID ${match.id}: ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} (${match.year}) - ${actual}/${expected} goals`)
    }
    
    const successRate = (successCount / randomMatches.rows.length * 100).toFixed(1)
    console.log(`\n   📊 Random Sample Success Rate: ${successRate}% (${successCount}/20)`)
    console.log('')
    
    // Issue 4: Data source analysis
    console.log('🔍 DATA SOURCE CORRUPTION ANALYSIS:')
    
    // Check for impossible data patterns
    const anomalies = await pool.query(`
      WITH anomaly_check AS (
        SELECT 
          'Future Matches' as issue,
          COUNT(*) as count
        FROM matches 
        WHERE match_date > CURRENT_DATE
        
        UNION ALL
        
        SELECT 
          'Matches with scores but no goals' as issue,
          COUNT(*) as count
        FROM matches m
        WHERE m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
        AND m.home_score + m.away_score > 0
        AND NOT EXISTS (SELECT 1 FROM goals WHERE match_id = m.id)
        
        UNION ALL
        
        SELECT 
          'Goals without matches' as issue,
          COUNT(*) as count
        FROM goals g
        WHERE NOT EXISTS (SELECT 1 FROM matches WHERE id = g.match_id)
        
        UNION ALL
        
        SELECT 
          'Players without teams' as issue,
          COUNT(*) as count
        FROM goals g
        WHERE g.team_id IS NULL OR g.player_id IS NULL
      )
      SELECT * FROM anomaly_check
      WHERE count > 0
    `)
    
    for (const anomaly of anomalies.rows) {
      console.log(`   🚨 ${anomaly.issue}: ${anomaly.count}`)
    }
    
    // Final honest assessment
    console.log('\n🎯 HONEST FINAL ASSESSMENT:')
    console.log('❌ This is NOT 6 Sigma quality')
    console.log('❌ This is NOT production ready')
    console.log('❌ Coverage is inadequate for real use')
    console.log('❌ Data integrity issues present')
    console.log('')
    console.log('📊 REAL GRADE: F (Major systemic failures)')
    console.log('🔧 REQUIRED: Complete data strategy overhaul')
    
  } catch (error) {
    console.error('❌ Analysis error:', error.message)
  } finally {
    await pool.end()
  }
}

analyzeCriticalFailures()