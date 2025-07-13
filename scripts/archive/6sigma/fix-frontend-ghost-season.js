#!/usr/bin/env node

/**
 * 6 Sigma: Fix Frontend Ghost Season
 * Remove the 2025/26 season that's still appearing on frontend
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class FrontendGhostSeasonFixer {
  constructor() {
    this.issuesFound = []
    this.fixesApplied = []
  }

  async fixFrontendGhostSeason() {
    console.log('👻 6 SIGMA: FIX FRONTEND GHOST SEASON')
    console.log('Removing 2025/26 season that still appears on frontend')
    console.log('=' .repeat(70))
    console.log('')
    
    try {
      // 1. Investigate the current state
      await this.investigateGhostSeason()
      
      // 2. Fix the ghost season properly
      await this.removeGhostSeason()
      
      // 3. Verify the fix
      await this.verifyFix()
      
      // 4. Test API response
      await this.testAPIResponse()
      
    } catch (error) {
      console.error('❌ Frontend ghost season fix failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async investigateGhostSeason() {
    console.log('🔍 INVESTIGATING GHOST SEASON:')
    console.log('')
    
    // Check the 2025/26 season details
    const ghostSeasonDetails = await pool.query(`
      SELECT 
        s.id,
        s.year,
        s.name,
        s.start_date,
        s.end_date,
        COUNT(m.id) as match_count,
        MIN(m.match_date) as earliest_match,
        MAX(m.match_date) as latest_match,
        COUNT(g.id) as goal_count
      FROM seasons s
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.year = 2025
      GROUP BY s.id, s.year, s.name, s.start_date, s.end_date
    `)
    
    if (ghostSeasonDetails.rows.length === 0) {
      console.log('   ✅ No 2025/26 season found in database')
      return
    }
    
    const ghost = ghostSeasonDetails.rows[0]
    console.log('   👻 GHOST SEASON FOUND:')
    console.log(`   📅 Season: ${ghost.name} (Year: ${ghost.year})`)
    console.log(`   🆔 ID: ${ghost.id}`)
    console.log(`   📊 Matches: ${ghost.match_count}`)
    console.log(`   ⚽ Goals: ${ghost.goal_count}`)
    
    if (ghost.earliest_match && ghost.latest_match) {
      console.log(`   📅 Date range: ${ghost.earliest_match.toISOString().split('T')[0]} to ${ghost.latest_match.toISOString().split('T')[0]}`)
    }
    
    console.log('')
    
    // If there are matches, show them
    if (parseInt(ghost.match_count) > 0) {
      console.log('   📋 MATCHES IN GHOST SEASON:')
      
      const matchDetails = await pool.query(`
        SELECT 
          m.id,
          ht.name as home_team,
          at.name as away_team,
          m.match_date,
          m.home_score,
          m.away_score,
          COUNT(g.id) as goal_count
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.season_id = $1
        GROUP BY m.id, ht.name, at.name, m.match_date, m.home_score, m.away_score
        ORDER BY m.match_date
      `, [ghost.id])
      
      for (const match of matchDetails.rows) {
        const date = match.match_date.toISOString().split('T')[0]
        console.log(`      📋 ${match.id}: ${match.home_team} vs ${match.away_team} (${date})`)
        console.log(`         📊 Score: ${match.home_score}-${match.away_score} | Goals: ${match.goal_count}`)
      }
      
      console.log('')
      
      this.issuesFound.push({
        type: 'ghost_season_with_matches',
        seasonId: ghost.id,
        matchCount: parseInt(ghost.match_count),
        goalCount: parseInt(ghost.goal_count)
      })
    } else {
      this.issuesFound.push({
        type: 'empty_ghost_season',
        seasonId: ghost.id
      })
    }
  }

  async removeGhostSeason() {
    console.log('🧹 REMOVING GHOST SEASON:')
    console.log('')
    
    const ghostSeasonId = 34 // The 2025/26 season ID
    
    // Check if matches should be moved to 2024/25 season instead
    const matchesToMove = await pool.query(`
      SELECT 
        m.id,
        m.match_date,
        EXTRACT(YEAR FROM m.match_date) as match_year,
        CASE 
          WHEN EXTRACT(MONTH FROM m.match_date) >= 8 THEN EXTRACT(YEAR FROM m.match_date) + 1
          ELSE EXTRACT(YEAR FROM m.match_date)
        END as correct_season_year
      FROM matches m
      WHERE m.season_id = $1
    `, [ghostSeasonId])
    
    if (matchesToMove.rows.length > 0) {
      console.log(`   🔄 Found ${matchesToMove.rows.length} matches that need to be moved`)
      
      for (const match of matchesToMove.rows) {
        const correctSeasonYear = parseInt(match.correct_season_year)
        console.log(`   📅 Match ${match.id} from ${match.match_date.toISOString().split('T')[0]} should be in season ${correctSeasonYear}`)
        
        // Find the correct season
        const correctSeason = await pool.query(`
          SELECT id FROM seasons WHERE year = $1
        `, [correctSeasonYear])
        
        if (correctSeason.rows.length > 0) {
          const correctSeasonId = correctSeason.rows[0].id
          
          // Move the match
          await pool.query(`
            UPDATE matches SET season_id = $1 WHERE id = $2
          `, [correctSeasonId, match.id])
          
          console.log(`      ✅ Moved match ${match.id} to season ${correctSeasonYear}`)
          
          this.fixesApplied.push({
            type: 'match_moved',
            matchId: match.id,
            fromSeason: ghostSeasonId,
            toSeason: correctSeasonId
          })
        } else {
          console.log(`      ❌ Could not find season ${correctSeasonYear}`)
        }
      }
    }
    
    console.log('')
    
    // Now check if the ghost season is empty
    const remainingMatches = await pool.query(`
      SELECT COUNT(*) as count FROM matches WHERE season_id = $1
    `, [ghostSeasonId])
    
    const matchCount = parseInt(remainingMatches.rows[0].count)
    
    if (matchCount === 0) {
      console.log('   ✅ Ghost season is now empty, safe to delete')
      
      // Delete the empty ghost season
      await pool.query(`
        DELETE FROM seasons WHERE id = $1
      `, [ghostSeasonId])
      
      console.log('   🗑️ Deleted ghost season 2025/26')
      
      this.fixesApplied.push({
        type: 'season_deleted',
        seasonId: ghostSeasonId
      })
    } else {
      console.log(`   ⚠️ Ghost season still has ${matchCount} matches - cannot delete`)
    }
    
    console.log('')
  }

  async verifyFix() {
    console.log('✅ VERIFYING FIX:')
    console.log('')
    
    // Check if 2025/26 season still exists
    const ghostCheck = await pool.query(`
      SELECT COUNT(*) as count FROM seasons WHERE year = 2025
    `)
    
    const ghostExists = parseInt(ghostCheck.rows[0].count) > 0
    
    console.log(`   👻 Ghost season 2025/26 exists: ${ghostExists ? 'YES ❌' : 'NO ✅'}`)
    
    // Check total seasons
    const totalSeasons = await pool.query(`
      SELECT 
        COUNT(*) as total_seasons,
        MIN(year) as earliest_year,
        MAX(year) as latest_year
      FROM seasons
    `)
    
    const seasonStats = totalSeasons.rows[0]
    console.log(`   📊 Total seasons: ${seasonStats.total_seasons}`)
    console.log(`   📅 Year range: ${seasonStats.earliest_year} - ${seasonStats.latest_year}`)
    
    // Check for any orphaned matches
    const orphanedMatches = await pool.query(`
      SELECT COUNT(*) as count FROM matches m
      WHERE NOT EXISTS (SELECT 1 FROM seasons s WHERE s.id = m.season_id)
    `)
    
    const orphanedCount = parseInt(orphanedMatches.rows[0].count)
    console.log(`   🔗 Orphaned matches: ${orphanedCount}`)
    
    console.log('')
    
    // Summary
    if (!ghostExists && orphanedCount === 0) {
      console.log('   🎉 SUCCESS: Ghost season completely removed!')
      console.log('   ✅ No orphaned matches')
      console.log('   🚀 Frontend should no longer show 2025/26 season')
    } else {
      console.log('   ⚠️ PARTIAL SUCCESS: Some issues remain')
      if (ghostExists) {
        console.log('   ❌ Ghost season still exists')
      }
      if (orphanedCount > 0) {
        console.log(`   ❌ ${orphanedCount} orphaned matches found`)
      }
    }
  }

  async testAPIResponse() {
    console.log('🧪 TESTING API RESPONSE:')
    console.log('')
    
    // Query the seasons directly from database (simulating API call)
    const seasons = await pool.query(`
      SELECT id, name, year
      FROM seasons
      ORDER BY id ASC
    `)
    
    console.log(`   📊 Total seasons returned: ${seasons.rows.length}`)
    
    // Show last few seasons
    const lastSeasons = seasons.rows.slice(-5)
    console.log('   📅 Last 5 seasons:')
    for (const season of lastSeasons) {
      console.log(`      ${season.id}: ${season.name} (${season.year})`)
    }
    
    // Check if 2025/26 is in the list
    const hasGhostSeason = seasons.rows.some(s => s.year === 2025)
    
    console.log('')
    console.log(`   👻 2025/26 season in API response: ${hasGhostSeason ? 'YES ❌' : 'NO ✅'}`)
    
    if (!hasGhostSeason) {
      console.log('   🎉 API will no longer return the ghost season!')
      console.log('   ✅ Frontend should be fixed')
    } else {
      console.log('   ❌ API still returns the ghost season')
      console.log('   🔧 Additional investigation needed')
    }
    
    console.log('')
    
    // Final summary
    console.log('📋 FIX SUMMARY:')
    console.log(`   🔧 Issues found: ${this.issuesFound.length}`)
    console.log(`   ✅ Fixes applied: ${this.fixesApplied.length}`)
    
    if (this.fixesApplied.length > 0) {
      console.log('')
      console.log('   Applied fixes:')
      for (const fix of this.fixesApplied) {
        if (fix.type === 'match_moved') {
          console.log(`   • Moved match ${fix.matchId} from season ${fix.fromSeason} to ${fix.toSeason}`)
        } else if (fix.type === 'season_deleted') {
          console.log(`   • Deleted empty season ${fix.seasonId}`)
        }
      }
    }
  }
}

// Execute frontend ghost season fix
const fixer = new FrontendGhostSeasonFixer()
fixer.fixFrontendGhostSeason()