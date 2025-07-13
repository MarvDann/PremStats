#!/usr/bin/env node

import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: 'premstats',
  host: 'localhost',
  database: 'premstats',
  password: 'premstats',
  port: 5432,
})

async function comprehensiveGoalDataAudit() {
  const client = await pool.connect()
  
  try {
    console.log('🔍 COMPREHENSIVE GOAL DATA QUALITY AUDIT')
    console.log('==========================================')
    
    // 1. Basic stats about goal data
    const totalStats = await client.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN home_score IS NOT NULL AND away_score IS NOT NULL THEN 1 END) as matches_with_scores,
        SUM(COALESCE(home_score, 0) + COALESCE(away_score, 0)) as expected_total_goals
      FROM matches 
      WHERE season_id BETWEEN 1 AND 10  -- First 10 seasons
    `)
    
    const goalStats = await client.query(`
      SELECT COUNT(*) as actual_goals_in_db
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      WHERE m.season_id BETWEEN 1 AND 10
    `)
    
    const stats = totalStats.rows[0]
    const actualGoals = goalStats.rows[0].actual_goals_in_db
    
    console.log(`\n📊 BASIC STATISTICS (First 10 seasons):`)
    console.log(`Total matches: ${stats.total_matches}`)
    console.log(`Matches with scores: ${stats.matches_with_scores}`)
    console.log(`Expected total goals: ${stats.expected_total_goals}`)
    console.log(`Actual goals in database: ${actualGoals}`)
    console.log(`Goal data completeness: ${((actualGoals / stats.expected_total_goals) * 100).toFixed(1)}%`)
    
    // 2. Check match score vs goal count consistency
    console.log(`\n⚠️  SCORE vs GOAL COUNT INCONSISTENCIES:`)
    const inconsistencies = await client.query(`
      SELECT 
        m.id,
        s.name as season,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        COUNT(g.id) as goals_in_db,
        (COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)) as expected_goals
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.season_id BETWEEN 1 AND 5  -- First 5 seasons
        AND (m.home_score IS NOT NULL AND m.away_score IS NOT NULL)
      GROUP BY m.id, s.name, ht.name, at.name, m.home_score, m.away_score
      HAVING COUNT(g.id) != (COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0))
      ORDER BY s.name, m.match_date
      LIMIT 20
    `)
    
    for (const match of inconsistencies.rows) {
      console.log(`${match.season}: ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | Expected: ${match.expected_goals}, In DB: ${match.goals_in_db} (Match ID: ${match.id})`)
    }
    
    // 3. Sample random matches to check goal scorer accuracy
    console.log(`\n🎯 RANDOM SAMPLE VERIFICATION (First 5 high-scoring matches):`)
    const sampleMatches = await client.query(`
      SELECT 
        m.id,
        s.name as season,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.season_id BETWEEN 1 AND 5
        AND (COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)) >= 4
      ORDER BY m.match_date
      LIMIT 5
    `)
    
    for (const match of sampleMatches.rows) {
      console.log(`\n${match.season} | ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | ${match.match_date.toISOString().split('T')[0]}`)
      
      const goals = await client.query(`
        SELECT g.minute, p.name as player_name, t.name as team_name
        FROM goals g
        LEFT JOIN players p ON g.player_id = p.id
        LEFT JOIN teams t ON g.team_id = t.id
        WHERE g.match_id = $1
        ORDER BY g.minute
      `, [match.id])
      
      for (const goal of goals.rows) {
        console.log(`  ${goal.minute}' - ${goal.player_name || 'Unknown'} (${goal.team_name || 'Unknown team'})`)
      }
      
      if (goals.rows.length === 0) {
        console.log(`  ❌ NO GOALS FOUND - Expected ${(match.home_score || 0) + (match.away_score || 0)} goals`)
      }
    }
    
    // 4. Check for obvious data quality issues
    console.log(`\n🚨 DATA QUALITY RED FLAGS:`)
    
    // Goals with no player assigned
    const unknownPlayers = await client.query(`
      SELECT COUNT(*) as count
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      WHERE g.player_id IS NULL AND m.season_id BETWEEN 1 AND 10
    `)
    console.log(`Goals with no player assigned: ${unknownPlayers.rows[0].count}`)
    
    // Goals assigned to wrong teams (not home or away)
    const wrongTeams = await client.query(`
      SELECT COUNT(*) as count
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      WHERE g.team_id NOT IN (m.home_team_id, m.away_team_id)
        AND m.season_id BETWEEN 1 AND 10
    `)
    console.log(`Goals assigned to teams not in the match: ${wrongTeams.rows[0].count}`)
    
    // Matches with all goals to one team but final score shows both teams scored
    const suspiciousAttribution = await client.query(`
      SELECT COUNT(*) as count
      FROM (
        SELECT 
          m.id,
          m.home_score,
          m.away_score,
          COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) as home_goals_in_db,
          COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) as away_goals_in_db
        FROM matches m
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.season_id BETWEEN 1 AND 10
          AND m.home_score > 0 AND m.away_score > 0
        GROUP BY m.id, m.home_score, m.away_score
        HAVING (COUNT(CASE WHEN g.team_id = m.home_team_id THEN 1 END) = 0 AND m.home_score > 0)
            OR (COUNT(CASE WHEN g.team_id = m.away_team_id THEN 1 END) = 0 AND m.away_score > 0)
      ) suspicious
    `)
    console.log(`Matches with suspicious team attribution: ${suspiciousAttribution.rows[0].count}`)
    
    // 5. Data source analysis
    console.log(`\n📈 SEASON-BY-SEASON COMPLETENESS:`)
    const seasonAnalysis = await client.query(`
      SELECT 
        s.name as season,
        COUNT(m.id) as total_matches,
        SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)) as expected_goals,
        COUNT(g.id) as actual_goals,
        ROUND((COUNT(g.id)::numeric / NULLIF(SUM(COALESCE(m.home_score, 0) + COALESCE(m.away_score, 0)), 0)) * 100, 1) as completeness_pct
      FROM seasons s
      JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.id BETWEEN 1 AND 10
      GROUP BY s.id, s.name
      ORDER BY s.id
    `)
    
    for (const season of seasonAnalysis.rows) {
      console.log(`${season.season}: ${season.completeness_pct || 0}% complete (${season.actual_goals}/${season.expected_goals} goals)`)
    }
    
    console.log(`\n💡 RECOMMENDATION:`)
    const avgCompleteness = seasonAnalysis.rows.reduce((sum, s) => sum + (parseFloat(s.completeness_pct) || 0), 0) / seasonAnalysis.rows.length
    
    if (avgCompleteness < 50) {
      console.log(`❌ CRITICAL: Average completeness is ${avgCompleteness.toFixed(1)}% - Major data quality issues detected`)
      console.log(`   • Goal scorer data appears largely incomplete or incorrect`)
      console.log(`   • Recommend complete data source review and re-import`)
      console.log(`   • Consider manual verification of key historical matches`)
    } else if (avgCompleteness < 80) {
      console.log(`⚠️  WARNING: Average completeness is ${avgCompleteness.toFixed(1)}% - Moderate data quality issues`)
      console.log(`   • Recommend targeted data validation and correction`)
    } else {
      console.log(`✅ Good: Average completeness is ${avgCompleteness.toFixed(1)}%`)
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

comprehensiveGoalDataAudit()