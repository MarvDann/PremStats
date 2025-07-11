#!/usr/bin/env node

import pg from 'pg'
import chalk from 'chalk'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function addSampleMatchStats() {
  console.log(chalk.bold('📊 Adding sample match statistics...'))
  
  try {
    // Get recent matches without stats
    const recentMatchQuery = `
      SELECT m.id, m.home_team_id, m.away_team_id, m.home_score, m.away_score,
             ht.name as home_team, at.name as away_team, m.match_date
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
        AND m.season_id = 33
        AND (m.home_shots IS NULL OR m.away_shots IS NULL)
      ORDER BY m.match_date DESC
      LIMIT 10
    `
    
    const result = await pool.query(recentMatchQuery)
    
    if (result.rows.length === 0) {
      console.log(chalk.yellow('No matches found without statistics'))
      return
    }
    
    console.log(chalk.blue(`Found ${result.rows.length} matches to add statistics to`))
    
    for (const match of result.rows) {
      console.log(chalk.gray(`\nAdding stats for: ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`))
      
      // Generate realistic match statistics based on the score
      const homeWin = match.home_score > match.away_score
      const awayWin = match.away_score > match.home_score
      const highScoring = (match.home_score + match.away_score) > 3
      
      // Shots tend to correlate with goals and match dominance
      const homeShots = Math.max(match.home_score * 3 + Math.floor(Math.random() * 8) + 3, 5)
      const awayShots = Math.max(match.away_score * 3 + Math.floor(Math.random() * 8) + 3, 5)
      
      // Shots on target should be at least the number of goals
      const homeShotsOnTarget = Math.max(match.home_score + Math.floor(Math.random() * 3) + 1, match.home_score)
      const awayShotsOnTarget = Math.max(match.away_score + Math.floor(Math.random() * 3) + 1, match.away_score)
      
      // Corners tend to be higher for dominant teams
      const homeCorners = homeWin ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 4) + 2
      const awayCorners = awayWin ? Math.floor(Math.random() * 6) + 4 : Math.floor(Math.random() * 4) + 2
      
      // Fouls are somewhat random but tend to be higher in competitive matches
      const homeFouls = Math.floor(Math.random() * 8) + 8
      const awayFouls = Math.floor(Math.random() * 8) + 8
      
      // Yellow cards correlate with fouls
      const homeYellowCards = Math.floor(homeFouls / 6)
      const awayYellowCards = Math.floor(awayFouls / 6)
      
      // Red cards are rare
      const homeRedCards = Math.random() < 0.05 ? 1 : 0
      const awayRedCards = Math.random() < 0.05 ? 1 : 0
      
      const updateQuery = `
        UPDATE matches
        SET 
          home_shots = $1,
          away_shots = $2,
          home_shots_on_target = $3,
          away_shots_on_target = $4,
          home_corners = $5,
          away_corners = $6,
          home_fouls = $7,
          away_fouls = $8,
          home_yellow_cards = $9,
          away_yellow_cards = $10,
          home_red_cards = $11,
          away_red_cards = $12
        WHERE id = $13
      `
      
      await pool.query(updateQuery, [
        homeShots,
        awayShots,
        homeShotsOnTarget,
        awayShotsOnTarget,
        homeCorners,
        awayCorners,
        homeFouls,
        awayFouls,
        homeYellowCards,
        awayYellowCards,
        homeRedCards,
        awayRedCards,
        match.id
      ])
      
      console.log(chalk.green('  ✅ Statistics added:'))
      console.log(chalk.gray(`     Shots: ${homeShots} - ${awayShots}`))
      console.log(chalk.gray(`     On Target: ${homeShotsOnTarget} - ${awayShotsOnTarget}`))
      console.log(chalk.gray(`     Corners: ${homeCorners} - ${awayCorners}`))
      console.log(chalk.gray(`     Fouls: ${homeFouls} - ${awayFouls}`))
      console.log(chalk.gray(`     Cards: ${homeYellowCards}Y/${homeRedCards}R - ${awayYellowCards}Y/${awayRedCards}R`))
    }
    
    console.log(chalk.bold.green('\n✅ Sample match statistics added successfully!'))
    
  } catch (error) {
    console.error(chalk.red('Error adding match statistics:'), error)
  } finally {
    await pool.end()
  }
}

// Run the script
addSampleMatchStats()