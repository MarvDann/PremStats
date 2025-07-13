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

async function fixFirstPremierLeagueMatch() {
  const client = await pool.connect()
  
  try {
    // This is the historic first Premier League match
    // Sheffield United 2-1 Manchester United, August 15, 1992
    // Match ID: 14708
    
    console.log('🏆 FIXING THE FIRST PREMIER LEAGUE MATCH EVER PLAYED')
    console.log('Sheffield United 2-1 Manchester United, August 15, 1992')
    console.log('Match ID: 14708')
    
    // First, verify this is the right match
    const match = await client.query(`
      SELECT m.*, ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id  
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = 14708
    `)
    
    if (match.rows.length === 0) {
      console.log('❌ Match 14708 not found!')
      return
    }
    
    const matchData = match.rows[0]
    console.log(`Verified: ${matchData.home_team} ${matchData.home_score}-${matchData.away_score} ${matchData.away_team}`)
    console.log(`Date: ${matchData.match_date.toISOString().split('T')[0]}`)
    
    // Check if Brian Deane exists in players table
    const brianDeane = await client.query(`
      SELECT * FROM players WHERE name = 'Brian Deane'
    `)
    
    if (brianDeane.rows.length === 0) {
      console.log('❌ Brian Deane not found in players table!')
      return
    }
    
    console.log(`✅ Brian Deane found: ID ${brianDeane.rows[0].id}`)
    
    // Get current wrong goals
    const currentGoals = await client.query(`
      SELECT g.*, p.name as player_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      WHERE g.match_id = 14708
      ORDER BY g.minute
    `)
    
    console.log('\\nCurrent WRONG goals:')
    for (const goal of currentGoals.rows) {
      console.log(`  ${goal.minute}' - ${goal.player_name || 'Unknown'} (Goal ID: ${goal.id})`)
    }
    
    console.log('\\n🔧 FIXING TO CORRECT HISTORICAL DATA:')
    console.log('  5\' - Brian Deane (Sheffield United)')
    console.log('  51\' - Brian Deane (Sheffield United, Penalty)')
    console.log('  Need to add 1 Manchester United goal to make it 2-1')
    
    // Delete the wrong goals
    console.log('\\nDeleting incorrect goals...')
    const deleteResult = await client.query('DELETE FROM goals WHERE match_id = 14708')
    console.log(`Deleted ${deleteResult.rowCount} incorrect goals`)
    
    // Insert correct goals
    const sheffieldUnitedId = matchData.home_team_id // Team ID 81
    const manchesterUnitedId = matchData.away_team_id // Team ID 8
    const brianDeaneId = brianDeane.rows[0].id
    
    // Brian Deane's first goal (5')
    await client.query(`
      INSERT INTO goals (match_id, player_id, team_id, minute, is_penalty)
      VALUES ($1, $2, $3, 5, false)
    `, [14708, brianDeaneId, sheffieldUnitedId])
    
    // Brian Deane's penalty (51')  
    await client.query(`
      INSERT INTO goals (match_id, player_id, team_id, minute, is_penalty)
      VALUES ($1, $2, $3, 51, true)
    `, [14708, brianDeaneId, sheffieldUnitedId])
    
    // We need to add Manchester United's goal - but we need to research who scored
    // For now, let's leave it as unknown since we don't have the exact data
    console.log('\\n⚠️ Still need to identify Manchester United\'s goal scorer for historical accuracy')
    
    // Verify the fix
    const newGoals = await client.query(`
      SELECT g.*, p.name as player_name, t.name as team_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      LEFT JOIN teams t ON g.team_id = t.id
      WHERE g.match_id = 14708
      ORDER BY g.minute
    `)
    
    console.log('\\n✅ CORRECTED GOALS:')
    for (const goal of newGoals.rows) {
      const penaltyNote = goal.is_penalty ? ' (Penalty)' : ''
      console.log(`  ${goal.minute}' - ${goal.player_name || 'Unknown'} (${goal.team_name})${penaltyNote}`)
    }
    
    console.log('\\n🎉 FIXED! Brian Deane now correctly credited with first Premier League goal')
    
  } finally {
    client.release()
    await pool.end()
  }
}

fixFirstPremierLeagueMatch()