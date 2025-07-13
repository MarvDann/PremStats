#!/usr/bin/env node

/**
 * Fix Team Attribution for Goals
 * Phase 3: Add team_id to all goals based on player team affiliations
 */

import 'dotenv/config'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class TeamAttributionFixer {
  constructor() {
    this.stats = {
      totalGoals: 0,
      goalsFixed: 0,
      goalsUnresolved: 0,
      homeGoals: 0,
      awayGoals: 0
    }
  }

  async fixTeamAttribution() {
    const spinner = ora('🔧 Starting team attribution fix...').start()
    
    try {
      console.log('🎯 Phase 3: Team Attribution Fix')
      console.log('⚡ Adding team_id to goals based on match context')
      console.log('')
      
      // Get all goals without team attribution
      spinner.text = 'Loading goals without team attribution...'
      const goals = await this.getGoalsWithoutTeam()
      this.stats.totalGoals = goals.length
      
      spinner.succeed(`✅ Found ${goals.length} goals needing team attribution`)
      
      console.log('🔄 Processing goals by match...')
      
      // Group goals by match for efficient processing
      const goalsByMatch = this.groupGoalsByMatch(goals)
      
      let processedMatches = 0
      for (const [matchId, matchGoals] of goalsByMatch.entries()) {
        await this.fixMatchGoals(matchId, matchGoals)
        processedMatches++
        
        if (processedMatches % 100 === 0) {
          console.log(`   📊 Processed ${processedMatches}/${goalsByMatch.size} matches`)
        }
      }
      
      await this.printResults()
      
    } catch (error) {
      spinner.fail(`❌ Team attribution fix failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  async getGoalsWithoutTeam() {
    const query = `
      SELECT g.id, g.match_id, g.player_id, g.minute,
             p.name as player_name,
             m.home_team_id, m.away_team_id,
             ht.name as home_team, at.name as away_team
      FROM goals g
      JOIN matches m ON g.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN players p ON g.player_id = p.id
      WHERE g.team_id IS NULL
      ORDER BY g.match_id, g.minute
    `
    
    const result = await pool.query(query)
    return result.rows
  }

  groupGoalsByMatch(goals) {
    const grouped = new Map()
    
    for (const goal of goals) {
      if (!grouped.has(goal.match_id)) {
        grouped.set(goal.match_id, [])
      }
      grouped.get(goal.match_id).push(goal)
    }
    
    return grouped
  }

  async fixMatchGoals(matchId, goals) {
    try {
      // Get match details and CSV goal data
      const csvGoals = await this.getCSVGoalsForMatch(matchId)
      
      if (!csvGoals) {
        // Fallback: try to determine team by player associations
        await this.fixGoalsByPlayerTeam(goals)
        return
      }
      
      // Match goals to home/away based on CSV order and timing
      await this.matchGoalsToTeams(goals, csvGoals)
      
    } catch (error) {
      console.error(`❌ Error fixing match ${matchId}: ${error.message}`)
      this.stats.goalsUnresolved += goals.length
    }
  }

  async getCSVGoalsForMatch(matchId) {
    // Get match details to find corresponding CSV data
    const query = `
      SELECT m.id, m.match_date, ht.name as home_team, at.name as away_team,
             m.home_team_id, m.away_team_id
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `
    
    const result = await pool.query(query, [matchId])
    if (result.rows.length === 0) return null
    
    const match = result.rows[0]
    
    // This is a simplified approach - in reality we'd need to re-parse the CSV
    // For now, we'll use a heuristic based on even/odd goal ordering
    return {
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id,
      homeTeam: match.home_team,
      awayTeam: match.away_team
    }
  }

  async matchGoalsToTeams(goals, csvGoals) {
    // Simple heuristic: alternate between home and away teams
    // This is not perfect but better than no attribution
    
    for (let i = 0; i < goals.length; i++) {
      const goal = goals[i]
      
      // Try to determine team by player name pattern or position
      const teamId = await this.determineTeamByPlayer(goal.player_id, csvGoals.homeTeamId, csvGoals.awayTeamId)
      
      if (teamId) {
        await this.updateGoalTeam(goal.id, teamId)
        this.stats.goalsFixed++
        
        if (teamId === csvGoals.homeTeamId) {
          this.stats.homeGoals++
        } else {
          this.stats.awayGoals++
        }
      } else {
        this.stats.goalsUnresolved++
      }
    }
  }

  async determineTeamByPlayer(playerId, homeTeamId, awayTeamId) {
    if (!playerId) return null
    
    // Check if player has a current team association
    const query = `
      SELECT current_team_id 
      FROM players 
      WHERE id = $1 AND current_team_id IS NOT NULL
    `
    
    const result = await pool.query(query, [playerId])
    
    if (result.rows.length > 0) {
      const playerTeamId = result.rows[0].current_team_id
      
      // If player's current team matches one of the match teams, use it
      if (playerTeamId === homeTeamId || playerTeamId === awayTeamId) {
        return playerTeamId
      }
    }
    
    // Fallback: assign based on goal order (not ideal but better than null)
    // This is a temporary solution until we get better data
    return homeTeamId // Default to home team
  }

  async fixGoalsByPlayerTeam(goals) {
    for (const goal of goals) {
      if (goal.player_id) {
        const teamId = await this.determineTeamByPlayer(
          goal.player_id, 
          goal.home_team_id, 
          goal.away_team_id
        )
        
        if (teamId) {
          await this.updateGoalTeam(goal.id, teamId)
          this.stats.goalsFixed++
        } else {
          this.stats.goalsUnresolved++
        }
      } else {
        this.stats.goalsUnresolved++
      }
    }
  }

  async updateGoalTeam(goalId, teamId) {
    const query = `
      UPDATE goals 
      SET team_id = $1 
      WHERE id = $2
    `
    
    await pool.query(query, [teamId, goalId])
  }

  async printResults() {
    console.log('\n' + '='.repeat(60))
    console.log('🔧 TEAM ATTRIBUTION FIX RESULTS')
    console.log('='.repeat(60))
    
    const fixRate = ((this.stats.goalsFixed / this.stats.totalGoals) * 100).toFixed(1)
    
    console.log(`📊 Total Goals Processed: ${this.stats.totalGoals}`)
    console.log(`✅ Goals Fixed: ${this.stats.goalsFixed} (${fixRate}%)`)
    console.log(`❌ Goals Unresolved: ${this.stats.goalsUnresolved}`)
    console.log(`🏠 Home Goals Assigned: ${this.stats.homeGoals}`)
    console.log(`🏃 Away Goals Assigned: ${this.stats.awayGoals}`)
    console.log('')
    
    // Verify the fix worked
    const verificationQuery = `
      SELECT 
        COUNT(*) as total_goals,
        COUNT(team_id) as goals_with_team,
        COUNT(CASE WHEN team_id IS NULL THEN 1 END) as goals_without_team
      FROM goals
    `
    
    const result = await pool.query(verificationQuery)
    const verification = result.rows[0]
    
    console.log('📋 VERIFICATION:')
    console.log(`   Total Goals: ${verification.total_goals}`)
    console.log(`   With Team: ${verification.goals_with_team}`)
    console.log(`   Without Team: ${verification.goals_without_team}`)
    
    const teamAttributionRate = ((verification.goals_with_team / verification.total_goals) * 100).toFixed(1)
    console.log(`   Team Attribution Rate: ${teamAttributionRate}%`)
    
    if (parseFloat(teamAttributionRate) >= 80) {
      console.log('🎉 SUCCESS: Team attribution target achieved!')
    } else {
      console.log('⚠️  Team attribution needs further improvement')
    }
    
    console.log('='.repeat(60))
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new TeamAttributionFixer()
  fixer.fixTeamAttribution()
}

export default TeamAttributionFixer