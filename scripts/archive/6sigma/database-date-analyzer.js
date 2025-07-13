#!/usr/bin/env node

/**
 * Database Date Analyzer - Find actual dates in 1992-93 season
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function analyzeDatabaseDates() {
  console.log('📅 ANALYZING ACTUAL DATABASE DATES:')
  console.log('')
  
  try {
    // Get actual dates with incomplete matches
    const dateAnalysis = await pool.query(`
      SELECT 
        DATE(m.match_date) as match_date,
        COUNT(*) as total_matches,
        COUNT(CASE WHEN g.id IS NOT NULL THEN 1 END) as matches_with_goals,
        COUNT(CASE WHEN g.id IS NULL THEN 1 END) as matches_missing_goals,
        string_agg(
          ht.name || ' vs ' || at.name || ' (' || m.home_score || '-' || m.away_score || ')', 
          ', ' 
          ORDER BY m.id
        ) as sample_matches
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.year = 1992
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
      GROUP BY DATE(m.match_date)
      HAVING COUNT(CASE WHEN g.id IS NULL THEN 1 END) > 0
      ORDER BY match_date
      LIMIT 10
    `)
    
    console.log('📊 DATES WITH INCOMPLETE MATCHES:')
    for (const row of dateAnalysis.rows) {
      console.log(`📅 ${row.match_date.toISOString().split('T')[0]}:`)
      console.log(`   📋 Total: ${row.total_matches} | With Goals: ${row.matches_with_goals} | Missing: ${row.matches_missing_goals}`)
      console.log(`   📝 Sample: ${row.sample_matches.slice(0, 200)}...`)
      console.log('')
    }
    
    // Get specific matches needing goals
    const specificMatches = await pool.query(`
      SELECT 
        m.id,
        DATE(m.match_date) as match_date,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        COUNT(g.id) as current_goals
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.year = 1992
      AND m.home_score IS NOT NULL
      AND m.away_score IS NOT NULL
      AND m.home_score + m.away_score > 0
      GROUP BY m.id, DATE(m.match_date), ht.name, at.name, m.home_score, m.away_score
      HAVING COUNT(g.id) < (m.home_score + m.away_score)
      ORDER BY DATE(m.match_date), m.id
      LIMIT 20
    `)
    
    console.log('🎯 SPECIFIC MATCHES NEEDING GOALS:')
    for (const match of specificMatches.rows) {
      const expectedGoals = match.home_score + match.away_score
      console.log(`📋 ${match.home_team} vs ${match.away_team} (${match.match_date.toISOString().split('T')[0]})`)
      console.log(`   📊 Expected: ${expectedGoals} | Current: ${match.current_goals} | Score: ${match.home_score}-${match.away_score}`)
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
  } finally {
    await pool.end()
  }
}

analyzeDatabaseDates()