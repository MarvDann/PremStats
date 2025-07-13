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

async function checkAugust1992Match() {
  const client = await pool.connect()
  
  try {
    // Find Sheffield United vs Manchester United match in August 1992
    const matches = await client.query(`
      SELECT m.id, m.season_id, s.name as season_name,
             ht.name as home_team, at.name as away_team,
             m.home_team_id, m.away_team_id,
             m.home_score, m.away_score, m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE (ht.name LIKE '%Sheffield%' AND at.name LIKE '%Manchester United%')
         OR (ht.name LIKE '%Manchester United%' AND at.name LIKE '%Sheffield%')
      AND m.match_date >= '1992-08-01' AND m.match_date <= '1992-08-31'
      ORDER BY m.match_date
    `)
    
    console.log('Sheffield United vs Manchester United matches in August 1992:')
    for (const match of matches.rows) {
      console.log(`Match ID: ${match.id} | ${match.season_name} | ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team} | ${match.match_date.toISOString().split('T')[0]}`)
      console.log(`Home Team ID: ${match.home_team_id}, Away Team ID: ${match.away_team_id}`)
    }
    
    if (matches.rows.length > 0) {
      const match = matches.rows[0]
      const matchId = match.id
      console.log(`\nChecking goals for match ID ${matchId}:`)
      
      // Check all goals for this match
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
        console.log(`${goal.minute}' - ${goal.player_name || 'Unknown'} (${goal.team_name || 'Unknown team'}) - Team ID: ${goal.team_id}`)
      }
      
      // Check team assignment issues
      console.log(`\nTeam assignment analysis:`)
      console.log(`Expected: Home (${match.home_team}) = Team ID ${match.home_team_id}`)
      console.log(`Expected: Away (${match.away_team}) = Team ID ${match.away_team_id}`)
      
      const teamCounts = await client.query(`
        SELECT team_id, COUNT(*) as goal_count
        FROM goals 
        WHERE match_id = $1
        GROUP BY team_id
      `, [matchId])
      
      console.log(`\nActual goal distribution:`)
      for (const count of teamCounts.rows) {
        const isHome = count.team_id === match.home_team_id
        const isAway = count.team_id === match.away_team_id
        const teamLabel = isHome ? 'HOME' : isAway ? 'AWAY' : 'WRONG TEAM'
        console.log(`Team ID ${count.team_id}: ${count.goal_count} goals (${teamLabel})`)
      }
      
      // Check if goals are assigned to wrong teams
      const wrongTeamGoals = await client.query(`
        SELECT g.*, p.name as player_name, t.name as team_name
        FROM goals g
        LEFT JOIN players p ON g.player_id = p.id
        LEFT JOIN teams t ON g.team_id = t.id
        WHERE g.match_id = $1
        AND g.team_id NOT IN ($2, $3)
        ORDER BY g.minute
      `, [matchId, match.home_team_id, match.away_team_id])
      
      if (wrongTeamGoals.rows.length > 0) {
        console.log(`\n⚠️  FOUND ${wrongTeamGoals.rows.length} GOALS ASSIGNED TO WRONG TEAMS:`)
        for (const goal of wrongTeamGoals.rows) {
          console.log(`${goal.minute}' - ${goal.player_name || 'Unknown'} assigned to "${goal.team_name}" (Team ID: ${goal.team_id})`)
        }
      }
      
      // Check what GetMatchEvents API returns
      console.log(`\nWhat the API returns (deduplicated):`)
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
      
      for (const event of events.rows) {
        const isHome = event.team_id === match.home_team_id
        const isAway = event.team_id === match.away_team_id
        const teamLabel = isHome ? `${match.home_team} (HOME)` : isAway ? `${match.away_team} (AWAY)` : 'WRONG TEAM'
        console.log(`${event.minute}' - ${event.player_name || 'Unknown'} (${teamLabel}) - ${event.detail || 'Goal'}`)
      }
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

checkAugust1992Match()