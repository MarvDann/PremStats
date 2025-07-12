#!/usr/bin/env node

/**
 * Match Validation Check
 * Verify specific matches have correct number of goal scorers
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function validateMatches(matchIds) {
  try {
    console.log('🔍 MATCH VALIDATION CHECK')
    console.log('=' .repeat(60))
    console.log('')
    
    for (const matchId of matchIds) {
      await validateMatch(matchId)
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error.message)
  } finally {
    await pool.end()
  }
}

async function validateMatch(matchId) {
  try {
    // Get match details
    const matchQuery = `
      SELECT 
        m.id,
        m.match_date,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        m.home_score + m.away_score as expected_total_goals,
        s.year as season
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE m.id = $1
    `
    
    const matchResult = await pool.query(matchQuery, [matchId])
    
    if (matchResult.rows.length === 0) {
      console.log(`❌ Match ID ${matchId}: Not found in database`)
      return
    }
    
    const match = matchResult.rows[0]
    
    // Get goals for this match
    const goalsQuery = `
      SELECT 
        g.id,
        g.minute,
        p.name as player_name,
        t.name as team_name,
        CASE 
          WHEN g.team_id = m.home_team_id THEN 'Home'
          WHEN g.team_id = m.away_team_id THEN 'Away'
          ELSE 'Unknown'
        END as team_type
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      JOIN players p ON g.player_id = p.id
      JOIN teams t ON g.team_id = t.id
      WHERE g.match_id = $1
      ORDER BY g.minute
    `
    
    const goalsResult = await pool.query(goalsQuery, [matchId])
    const goals = goalsResult.rows
    
    // Count goals by team
    const homeGoals = goals.filter(g => g.team_type === 'Home').length
    const awayGoals = goals.filter(g => g.team_type === 'Away').length
    const totalGoals = goals.length
    
    // Determine status
    const isCorrect = (homeGoals === match.home_score && awayGoals === match.away_score)
    const hasData = totalGoals > 0
    const status = isCorrect ? '✅' : hasData ? '🔄' : '❌'
    
    console.log(`${status} Match ID ${matchId}: ${match.home_team} vs ${match.away_team}`)
    console.log(`   📅 Date: ${match.match_date?.toISOString()?.split('T')[0] || 'Unknown'}`)
    console.log(`   🏆 Season: ${match.season}`)
    console.log(`   📊 Expected Score: ${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team}`)
    console.log(`   ⚽ Our Goals: ${homeGoals} - ${awayGoals} (Total: ${totalGoals})`)
    
    if (isCorrect) {
      console.log(`   🎉 PERFECT MATCH: All ${totalGoals} goals correctly attributed`)
    } else if (hasData) {
      const difference = match.expected_total_goals - totalGoals
      console.log(`   🔄 PARTIAL DATA: Missing ${difference} goals`)
      console.log(`   📈 Coverage: ${Math.round((totalGoals / match.expected_total_goals) * 100)}%`)
    } else {
      console.log(`   ❌ NO GOAL DATA: Missing all ${match.expected_total_goals} goals`)
    }
    
    // Show individual goals if we have any
    if (goals.length > 0) {
      console.log(`   📝 Goal Details:`)
      goals.forEach((goal, index) => {
        console.log(`      ${index + 1}. ${goal.minute}' ${goal.player_name} (${goal.team_name})`)
      })
    }
    
  } catch (error) {
    console.log(`❌ Match ID ${matchId}: Error - ${error.message}`)
  }
}

// Run validation for the specified match IDs
const matchIds = [15106, 18526, 2632, 15481]
validateMatches(matchIds)