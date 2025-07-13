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

async function checkSheffieldManUtdGoals() {
  const client = await pool.connect()
  
  try {
    // Find Sheffield United vs Manchester United matches
    const matches = await client.query(`
      SELECT m.id, m.season_id, s.name as season_name,
             ht.name as home_team, at.name as away_team,
             m.home_score, m.away_score, m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE (ht.name LIKE '%Sheffield%' AND at.name LIKE '%Manchester United%')
         OR (ht.name LIKE '%Manchester United%' AND at.name LIKE '%Sheffield%')
      ORDER BY m.match_date DESC
      LIMIT 5
    `)
    
    console.log('Sheffield United vs Manchester United matches:')
    for (const match of matches.rows) {
      console.log(`Match ID: ${match.id} | ${match.season_name} | ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | ${match.match_date.toISOString().split('T')[0]}`)
    }
    
    if (matches.rows.length > 0) {
      const matchId = matches.rows[0].id
      console.log(`\nChecking goals for most recent match (ID: ${matchId}):`)
      
      const goals = await client.query(`
        SELECT g.*, p.name as player_name, t.name as team_name
        FROM goals g
        LEFT JOIN players p ON g.player_id = p.id
        LEFT JOIN teams t ON g.team_id = t.id
        WHERE g.match_id = $1
        ORDER BY g.minute, g.id
      `, [matchId])
      
      console.log(`Found ${goals.rows.length} goals in database:`)
      for (const goal of goals.rows) {
        console.log(`${goal.minute}' - ${goal.player_name || 'Unknown'} (${goal.team_name || 'Unknown team'}) - Goal ID: ${goal.id}`)
      }
      
      // Check what the API would return
      console.log(`\nChecking what GetMatchEvents API would return:`)
      const events = await client.query(`
        SELECT MIN(g.id) as id, g.match_id, 'goal' as event_type, g.minute,
               g.player_id, p.name as player_name, g.team_id, 
               CASE WHEN bool_or(g.is_penalty) THEN 'Penalty' ELSE NULL END as detail
        FROM goals g
        LEFT JOIN players p ON g.player_id = p.id
        WHERE g.match_id = $1
        GROUP BY g.match_id, g.minute, g.player_id, p.name, g.team_id
        ORDER BY g.minute, MIN(g.id)
      `, [matchId])
      
      console.log(`API would return ${events.rows.length} events:`)
      for (const event of events.rows) {
        console.log(`${event.minute}' - ${event.player_name || 'Unknown'} (Team ID: ${event.team_id}) - ${event.detail || 'Goal'}`)
      }
      
      // Get team info for this match
      const matchInfo = await client.query(`
        SELECT m.home_team_id, m.away_team_id, ht.name as home_team, at.name as away_team
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        WHERE m.id = $1
      `, [matchId])
      
      if (matchInfo.rows.length > 0) {
        const match = matchInfo.rows[0]
        console.log(`\nMatch team IDs: Home (${match.home_team}): ${match.home_team_id}, Away (${match.away_team}): ${match.away_team_id}`)
        
        // Check team attribution of goals
        const teamAttribution = await client.query(`
          SELECT team_id, COUNT(*) as goal_count
          FROM goals 
          WHERE match_id = $1
          GROUP BY team_id
        `, [matchId])
        
        console.log(`\nGoal attribution by team:`)
        for (const attr of teamAttribution.rows) {
          const teamName = attr.team_id === match.home_team_id ? match.home_team : 
                          attr.team_id === match.away_team_id ? match.away_team : 'Unknown'
          console.log(`Team ID ${attr.team_id} (${teamName}): ${attr.goal_count} goals`)
        }
      }
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

checkSheffieldManUtdGoals()