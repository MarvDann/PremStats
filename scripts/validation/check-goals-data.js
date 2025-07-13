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

async function checkGoalsData() {
  const client = await pool.connect()
  
  try {
    // Check total goals in database
    const totalGoals = await client.query('SELECT COUNT(*) as count FROM goals')
    console.log(`Total goals in database: ${totalGoals.rows[0].count}`)
    
    // Check goals for specific match
    const matchGoals = await client.query(`
      SELECT g.*, p.name as player_name, t.name as team_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      LEFT JOIN teams t ON g.team_id = t.id
      WHERE g.match_id = 14670
      ORDER BY g.minute
    `)
    
    console.log(`Goals for match 14670 (Arsenal vs Tottenham):`)
    if (matchGoals.rows.length === 0) {
      console.log('No goals found for this match')
    } else {
      for (const goal of matchGoals.rows) {
        console.log(`${goal.minute}' - ${goal.player_name || 'Unknown'} (${goal.team_name || 'Unknown team'})`)
      }
    }
    
    // Check some matches that should have goals
    const sampleMatches = await client.query(`
      SELECT 
        m.id, 
        ht.name as home_team, 
        at.name as away_team,
        m.home_score,
        m.away_score,
        COUNT(g.id) as goals_count
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.season_id = 1 AND (m.home_score > 0 OR m.away_score > 0)
      GROUP BY m.id, ht.name, at.name, m.home_score, m.away_score
      ORDER BY m.id
      LIMIT 10
    `)
    
    console.log('\nSample matches with scores vs goals in database:')
    for (const match of sampleMatches.rows) {
      const expectedGoals = (match.home_score || 0) + (match.away_score || 0)
      console.log(`${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | Expected: ${expectedGoals}, In DB: ${match.goals_count}`)
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

checkGoalsData()