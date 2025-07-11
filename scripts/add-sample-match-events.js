#!/usr/bin/env node

import pg from 'pg'
import chalk from 'chalk'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function addSampleMatchEvents() {
  console.log(chalk.bold('🏆 Adding sample match events for demonstration...'))
  
  try {
    // Get a recent match with goals
    const recentMatchQuery = `
      SELECT m.id, m.home_team_id, m.away_team_id, m.home_score, m.away_score,
             ht.name as home_team, at.name as away_team, m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.home_score > 0 AND m.away_score > 0
        AND m.season_id = 33
      ORDER BY m.match_date DESC
      LIMIT 5
    `
    
    const result = await pool.query(recentMatchQuery)
    
    if (result.rows.length === 0) {
      console.log(chalk.yellow('No suitable matches found'))
      return
    }
    
    console.log(chalk.blue(`Found ${result.rows.length} matches to enhance`))
    
    for (const match of result.rows) {
      console.log(chalk.gray(`\nEnhancing match: ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`))
      
      // Clear existing events for this match
      await pool.query('DELETE FROM match_events WHERE match_id = $1', [match.id])
      
      // Add sample goals
      const homeGoals = match.home_score
      const awayGoals = match.away_score
      
      // Distribute home goals
      for (let i = 0; i < homeGoals; i++) {
        const minute = Math.floor(Math.random() * 90) + 1
        const isPenalty = Math.random() < 0.1
        
        // Get a player from the home team
        const playerQuery = await pool.query(
          `SELECT p.id, p.name FROM players p 
           JOIN player_stats ps ON p.id = ps.player_id 
           WHERE ps.team_id = $1 AND ps.season_id = 33 
           ORDER BY ps.goals DESC 
           LIMIT 10`,
          [match.home_team_id]
        )
        
        if (playerQuery.rows.length > 0) {
          const player = playerQuery.rows[Math.floor(Math.random() * Math.min(5, playerQuery.rows.length))]
          
          await pool.query(
            `INSERT INTO match_events (match_id, event_type, minute, player_id, team_id, detail)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              match.id,
              isPenalty ? 'penalty' : 'goal',
              minute,
              player.id,
              match.home_team_id,
              isPenalty ? 'Penalty' : null
            ]
          )
          
          console.log(chalk.green(`  ⚽ ${minute}' - ${player.name} (${match.home_team})${isPenalty ? ' [Penalty]' : ''}`))
        }
      }
      
      // Distribute away goals
      for (let i = 0; i < awayGoals; i++) {
        const minute = Math.floor(Math.random() * 90) + 1
        const isPenalty = Math.random() < 0.1
        
        // Get a player from the away team
        const playerQuery = await pool.query(
          `SELECT p.id, p.name FROM players p 
           JOIN player_stats ps ON p.id = ps.player_id 
           WHERE ps.team_id = $1 AND ps.season_id = 33 
           ORDER BY ps.goals DESC 
           LIMIT 10`,
          [match.away_team_id]
        )
        
        if (playerQuery.rows.length > 0) {
          const player = playerQuery.rows[Math.floor(Math.random() * Math.min(5, playerQuery.rows.length))]
          
          await pool.query(
            `INSERT INTO match_events (match_id, event_type, minute, player_id, team_id, detail)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              match.id,
              isPenalty ? 'penalty' : 'goal',
              minute,
              player.id,
              match.away_team_id,
              isPenalty ? 'Penalty' : null
            ]
          )
          
          console.log(chalk.green(`  ⚽ ${minute}' - ${player.name} (${match.away_team})${isPenalty ? ' [Penalty]' : ''}`))
        }
      }
      
      // Add some yellow cards
      const yellowCards = Math.floor(Math.random() * 4) + 1
      for (let i = 0; i < yellowCards; i++) {
        const minute = Math.floor(Math.random() * 90) + 1
        const isHome = Math.random() < 0.5
        const teamId = isHome ? match.home_team_id : match.away_team_id
        
        const playerQuery = await pool.query(
          `SELECT p.id, p.name FROM players p 
           JOIN player_stats ps ON p.id = ps.player_id 
           WHERE ps.team_id = $1 AND ps.season_id = 33 
           ORDER BY RANDOM() 
           LIMIT 1`,
          [teamId]
        )
        
        if (playerQuery.rows.length > 0) {
          const player = playerQuery.rows[0]
          
          await pool.query(
            `INSERT INTO match_events (match_id, event_type, minute, player_id, team_id, detail)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              match.id,
              'yellow_card',
              minute,
              player.id,
              teamId,
              'Foul'
            ]
          )
          
          console.log(chalk.yellow(`  🟨 ${minute}' - ${player.name} (${isHome ? match.home_team : match.away_team})`))
        }
      }
      
      // Occasionally add a red card
      if (Math.random() < 0.1) {
        const minute = Math.floor(Math.random() * 60) + 30
        const isHome = Math.random() < 0.5
        const teamId = isHome ? match.home_team_id : match.away_team_id
        
        const playerQuery = await pool.query(
          `SELECT p.id, p.name FROM players p 
           JOIN player_stats ps ON p.id = ps.player_id 
           WHERE ps.team_id = $1 AND ps.season_id = 33 
           ORDER BY RANDOM() 
           LIMIT 1`,
          [teamId]
        )
        
        if (playerQuery.rows.length > 0) {
          const player = playerQuery.rows[0]
          
          await pool.query(
            `INSERT INTO match_events (match_id, event_type, minute, player_id, team_id, detail)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              match.id,
              'red_card',
              minute,
              player.id,
              teamId,
              'Serious foul play'
            ]
          )
          
          console.log(chalk.red(`  🟥 ${minute}' - ${player.name} (${isHome ? match.home_team : match.away_team})`))
        }
      }
    }
    
    console.log(chalk.bold.green('\n✅ Sample match events added successfully!'))
    
  } catch (error) {
    console.error(chalk.red('Error adding match events:'), error)
  } finally {
    await pool.end()
  }
}

// Run the script
addSampleMatchEvents()