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

async function checkBrianDeane() {
  const client = await pool.connect()
  
  try {
    // Find Brian Deane in players table
    const players = await client.query(`
      SELECT * FROM players 
      WHERE name ILIKE '%deane%'
      ORDER BY name
    `)
    
    console.log('Players with Deane in name:')
    for (const player of players.rows) {
      console.log(`ID: ${player.id}, Name: ${player.name}, Position: ${player.position || 'Unknown'}`)
    }
    
    // Check the specific match (14708) goals again with more detail
    console.log('\nDetailed analysis of match 14708 goals:')
    const matchGoals = await client.query(`
      SELECT g.*, p.name as player_name, p.id as player_id_matched,
             g.scorer_name as original_scorer_name
      FROM goals g
      LEFT JOIN players p ON g.player_id = p.id
      WHERE g.match_id = 14708
      ORDER BY g.minute
    `)
    
    for (const goal of matchGoals.rows) {
      console.log(`Goal ID: ${goal.id}`)
      console.log(`  Minute: ${goal.minute}`)
      console.log(`  Original scorer name: ${goal.original_scorer_name || 'NULL'}`)
      console.log(`  Matched player: ${goal.player_name || 'NULL'} (ID: ${goal.player_id_matched || 'NULL'})`)
      console.log(`  Team ID: ${goal.team_id}`)
      console.log(`---`)
    }
    
    // Check if Brian Deane exists in our players table
    const brianDeane = await client.query(`
      SELECT * FROM players 
      WHERE name ILIKE '%brian%' AND name ILIKE '%deane%'
    `)
    
    if (brianDeane.rows.length > 0) {
      console.log('\nBrian Deane found in players table:')
      for (const player of brianDeane.rows) {
        console.log(`ID: ${player.id}, Name: ${player.name}`)
        
        // Check his goals
        const goals = await client.query(`
          SELECT g.*, m.match_date, ht.name as home_team, at.name as away_team
          FROM goals g
          JOIN matches m ON g.match_id = m.id
          JOIN teams ht ON m.home_team_id = ht.id
          JOIN teams at ON m.away_team_id = at.id
          WHERE g.player_id = $1
          ORDER BY m.match_date
        `, [player.id])
        
        console.log(`Goals for ${player.name}:`)
        for (const goal of goals.rows) {
          console.log(`  ${goal.match_date.toISOString().split('T')[0]} - ${goal.minute}' vs ${goal.home_team} vs ${goal.away_team}`)
        }
      }
    } else {
      console.log('\nBrian Deane NOT found in players table')
    }
    
    // Check original scorer names that might be Brian Deane
    console.log('\nChecking original scorer names for August 1992:')
    const originalNames = await client.query(`
      SELECT DISTINCT g.scorer_name, COUNT(*) as count
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      WHERE m.match_date >= '1992-08-01' AND m.match_date <= '1992-08-31'
      AND g.scorer_name IS NOT NULL
      GROUP BY g.scorer_name
      ORDER BY g.scorer_name
    `)
    
    for (const name of originalNames.rows) {
      if (name.scorer_name && name.scorer_name.toLowerCase().includes('deane')) {
        console.log(`*** ${name.scorer_name} (${name.count} goals) ***`)
      } else {
        console.log(`${name.scorer_name} (${name.count} goals)`)
      }
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

checkBrianDeane()