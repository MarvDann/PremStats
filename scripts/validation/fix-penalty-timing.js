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

async function fixPenaltyTiming() {
  const client = await pool.connect()
  
  try {
    console.log('🔧 CORRECTING BRIAN DEANE PENALTY TIMING')
    console.log('Changing from 51\' to 50\'')
    
    // Update the penalty timing
    const result = await client.query(`
      UPDATE goals 
      SET minute = 50
      WHERE match_id = 14708 
        AND player_id = (SELECT id FROM players WHERE name = 'Brian Deane')
        AND is_penalty = true
    `)
    
    console.log(`Updated ${result.rowCount} penalty goal`)
    
    // Verify the final corrected goals
    const finalGoals = await client.query(`
      SELECT g.*, p.name as player_name, t.name as team_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      LEFT JOIN teams t ON g.team_id = t.id
      WHERE g.match_id = 14708
      ORDER BY g.minute
    `)
    
    console.log('\n✅ FINAL CORRECTED GOALS:')
    for (const goal of finalGoals.rows) {
      const penaltyNote = goal.is_penalty ? ' (Penalty)' : ''
      console.log(`  ${goal.minute}' - ${goal.player_name} (${goal.team_name})${penaltyNote}`)
    }
    
    console.log('\n🎉 HISTORIC FIRST PREMIER LEAGUE MATCH - FULLY ACCURATE!')
    console.log('  5\' Brian Deane (Sheffield United) - First Premier League goal')
    console.log('  50\' Brian Deane (Sheffield United, Penalty)')
    console.log('  61\' Mark Hughes (Manchester United)')
    console.log('  Result: Sheffield United 2-1 Manchester United')
    
  } finally {
    client.release()
    await pool.end()
  }
}

fixPenaltyTiming()