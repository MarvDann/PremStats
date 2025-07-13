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

async function completeFixFirstMatch() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 ADDING MISSING MARK HUGHES GOAL')
    console.log('Sheffield United 2-1 Manchester United, August 15, 1992')
    console.log('Match ID: 14708')
    
    // Get player IDs
    const brianDeane = await client.query(`SELECT id FROM players WHERE name = 'Brian Deane'`)
    const markHughes = await client.query(`SELECT id FROM players WHERE name = 'Mark Hughes'`)
    
    if (markHughes.rows.length === 0) {
      console.log('❌ Mark Hughes not found in players table!')
      return
    }
    
    console.log(`✅ Mark Hughes found: ID ${markHughes.rows[0].id}`)
    
    // Get match info
    const match = await client.query(`
      SELECT home_team_id, away_team_id 
      FROM matches 
      WHERE id = 14708
    `)
    
    const manchesterUnitedId = match.rows[0].away_team_id // Team ID 8
    const markHughesId = markHughes.rows[0].id
    
    // Check current goals
    const currentGoals = await client.query(`
      SELECT g.*, p.name as player_name, t.name as team_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      LEFT JOIN teams t ON g.team_id = t.id
      WHERE g.match_id = 14708
      ORDER BY g.minute
    `)
    
    console.log('\\nCurrent goals:')
    for (const goal of currentGoals.rows) {
      const penaltyNote = goal.is_penalty ? ' (Penalty)' : ''
      console.log(`  ${goal.minute}' - ${goal.player_name} (${goal.team_name})${penaltyNote}`)
    }
    
    // Add Mark Hughes goal at 61'
    console.log('\\nAdding Mark Hughes goal at 61\'...')
    await client.query(`
      INSERT INTO goals (match_id, player_id, team_id, minute, is_penalty)
      VALUES ($1, $2, $3, 61, false)
    `, [14708, markHughesId, manchesterUnitedId])
    
    // Verify complete fix
    const finalGoals = await client.query(`
      SELECT g.*, p.name as player_name, t.name as team_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      LEFT JOIN teams t ON g.team_id = t.id
      WHERE g.match_id = 14708
      ORDER BY g.minute
    `)
    
    console.log('\\n✅ COMPLETE CORRECTED GOALS:')
    for (const goal of finalGoals.rows) {
      const penaltyNote = goal.is_penalty ? ' (Penalty)' : ''
      console.log(`  ${goal.minute}' - ${goal.player_name} (${goal.team_name})${penaltyNote}`)
    }
    
    console.log('\\n🎉 HISTORIC MATCH NOW FULLY CORRECTED!')
    console.log('  5\' Brian Deane (Sheffield United) - First Premier League goal')
    console.log('  51\' Brian Deane (Sheffield United, Penalty)')
    console.log('  61\' Mark Hughes (Manchester United)')
    console.log('  Result: Sheffield United 2-1 Manchester United')
    
  } finally {
    client.release()
    await pool.end()
  }
}

completeFixFirstMatch()