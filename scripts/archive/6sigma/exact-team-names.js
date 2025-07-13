#!/usr/bin/env node

/**
 * Get exact team names from database for verified dataset
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function getExactTeamNames() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT 
        DATE(m.match_date) as match_date,
        ht.name as home_team, 
        at.name as away_team,
        m.home_score,
        m.away_score
      FROM matches m 
      JOIN teams ht ON m.home_team_id = ht.id 
      JOIN teams at ON m.away_team_id = at.id 
      JOIN seasons s ON m.season_id = s.id 
      WHERE s.year = 1992 
      AND m.home_score + m.away_score > 0
      ORDER BY match_date, ht.name, at.name
      LIMIT 50
    `)
    
    console.log('📋 EXACT TEAM NAMES FROM DATABASE:')
    console.log('')
    
    for (const row of result.rows) {
      console.log(`${row.match_date.toISOString().split('T')[0]}: ${row.home_team} vs ${row.away_team} (${row.home_score}-${row.away_score})`)
    }
    
  } catch (error) {
    console.error('❌ Failed:', error.message)
  } finally {
    await pool.end()
  }
}

getExactTeamNames()