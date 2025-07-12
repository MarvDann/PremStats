#!/usr/bin/env node

/**
 * Database Reality Check
 * Let's see what goal data we actually have and where it's located
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function performRealityCheck() {
  try {
    console.log('🔍 DATABASE REALITY CHECK')
    console.log('=' .repeat(60))
    console.log('')
    
    // Check total database stats
    console.log('📊 OVERALL DATABASE STATISTICS:')
    const overallStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT g.id) as total_goals,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT s.id) as seasons_with_data,
        MIN(s.year) as earliest_season,
        MAX(s.year) as latest_season
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      JOIN seasons s ON m.season_id = s.id
    `)
    
    const stats = overallStats.rows[0]
    console.log(`   Total Goals: ${stats.total_goals}`)
    console.log(`   Total Matches with Goals: ${stats.total_matches}`)
    console.log(`   Seasons with Data: ${stats.seasons_with_data}`)
    console.log(`   Season Range: ${stats.earliest_season} - ${stats.latest_season}`)
    console.log('')
    
    // Check which seasons have the most goals
    console.log('📅 GOALS BY SEASON (Top 10):')
    const seasonStats = await pool.query(`
      SELECT 
        s.year,
        COUNT(g.id) as goal_count,
        COUNT(DISTINCT g.match_id) as matches_with_goals
      FROM seasons s
      JOIN matches m ON s.id = m.season_id
      JOIN goals g ON m.id = g.match_id
      GROUP BY s.id, s.year
      ORDER BY COUNT(g.id) DESC
      LIMIT 10
    `)
    
    for (const season of seasonStats.rows) {
      console.log(`   ${season.year}: ${season.goal_count} goals (${season.matches_with_goals} matches)`)
    }
    console.log('')
    
    // Find some matches that actually have goals
    console.log('✅ SAMPLE MATCHES WITH GOALS:')
    const matchesWithGoals = await pool.query(`
      SELECT 
        m.id,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        COUNT(g.id) as our_goals,
        s.year
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      JOIN goals g ON m.id = g.match_id
      GROUP BY m.id, ht.name, at.name, m.home_score, m.away_score, s.year
      HAVING COUNT(g.id) > 0
      ORDER BY COUNT(g.id) DESC, m.id
      LIMIT 10
    `)
    
    for (const match of matchesWithGoals.rows) {
      const status = (match.our_goals === (match.home_score + match.away_score)) ? '✅' : '🔄'
      console.log(`   ${status} ID ${match.id}: ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} (${match.year}) - ${match.our_goals} goals`)
    }
    console.log('')
    
    // Check team attribution
    console.log('🏟️ TEAM ATTRIBUTION CHECK:')
    const attributionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_goals,
        COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END) as goals_with_team,
        ROUND(
          COUNT(CASE WHEN team_id IS NOT NULL THEN 1 END)::decimal / COUNT(*) * 100, 1
        ) as attribution_percentage
      FROM goals
    `)
    
    const attribution = attributionStats.rows[0]
    console.log(`   Total Goals: ${attribution.total_goals}`)
    console.log(`   Goals with Team Attribution: ${attribution.goals_with_team}`)
    console.log(`   Attribution Percentage: ${attribution.attribution_percentage}%`)
    console.log('')
    
    // Check if the test match IDs exist at all
    console.log('🔍 TEST MATCH IDs STATUS:')
    const testMatches = [15106, 18526, 2632, 15481]
    
    for (const matchId of testMatches) {
      const matchCheck = await pool.query(`
        SELECT 
          m.id,
          ht.name as home_team,
          at.name as away_team,
          m.home_score,
          m.away_score,
          s.year,
          EXISTS(SELECT 1 FROM goals WHERE match_id = m.id) as has_goals
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN seasons s ON m.season_id = s.id
        WHERE m.id = $1
      `, [matchId])
      
      if (matchCheck.rows.length > 0) {
        const match = matchCheck.rows[0]
        const status = match.has_goals ? '✅' : '❌'
        console.log(`   ${status} ID ${matchId}: ${match.home_team} vs ${match.away_team} (${match.year}) - Goals: ${match.has_goals}`)
      } else {
        console.log(`   ❓ ID ${matchId}: Not found in database`)
      }
    }
    console.log('')
    
    // Check score consistency reality
    console.log('📊 SCORE CONSISTENCY REALITY:')
    const consistencyCheck = await pool.query(`
      WITH match_goal_analysis AS (
        SELECT 
          m.id,
          m.home_score,
          m.away_score,
          COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as home_goals_in_db,
          COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as away_goals_in_db,
          COUNT(g.id) as total_goals_in_db
        FROM matches m
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL AND m.away_score IS NOT NULL
        GROUP BY m.id, m.home_score, m.away_score
      )
      SELECT 
        COUNT(*) as total_matches_with_scores,
        COUNT(CASE WHEN total_goals_in_db > 0 THEN 1 END) as matches_with_some_goals,
        COUNT(CASE WHEN home_goals_in_db = home_score AND away_goals_in_db = away_score THEN 1 END) as perfectly_consistent_matches,
        ROUND(
          COUNT(CASE WHEN total_goals_in_db > 0 THEN 1 END)::decimal / COUNT(*) * 100, 1
        ) as coverage_percentage,
        ROUND(
          COUNT(CASE WHEN home_goals_in_db = home_score AND away_goals_in_db = away_score THEN 1 END)::decimal / 
          COUNT(CASE WHEN total_goals_in_db > 0 THEN 1 END) * 100, 1
        ) as consistency_percentage_of_covered_matches
      FROM match_goal_analysis
    `)
    
    const consistency = consistencyCheck.rows[0]
    console.log(`   Total Matches with Scores: ${consistency.total_matches_with_scores}`)
    console.log(`   Matches with Some Goals: ${consistency.matches_with_some_goals}`)
    console.log(`   Perfectly Consistent Matches: ${consistency.perfectly_consistent_matches}`)
    console.log(`   Coverage Percentage: ${consistency.coverage_percentage}%`)
    console.log(`   Consistency of Covered Matches: ${consistency.consistency_percentage_of_covered_matches}%`)
    
  } catch (error) {
    console.error('❌ Reality check error:', error.message)
  } finally {
    await pool.end()
  }
}

performRealityCheck()