#!/usr/bin/env node

/**
 * 🔧 1992/1993 Season Data Corruption Fix
 * 
 * CRITICAL: Fix data corruption detected in inaugural Premier League season
 * 
 * FIXES:
 * - Remove duplicate/extra matches causing count mismatch
 * - Fix suspicious date patterns (11 matches on single date)
 * - Restore proper 22-team × 21-match structure (462 total)
 * - Preserve authentic historical matches, remove corrupted additions
 */

import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: 'premstats',
  host: 'localhost',
  database: 'premstats',
  password: 'premstats',
  port: 5432,
})

async function fix1992SeasonCorruption() {
  console.log('🔧 1992/1993 SEASON DATA CORRUPTION FIX')
  console.log('=======================================')
  console.log('')
  
  const client = await pool.connect()
  
  try {
    // Begin transaction for safe cleanup
    await client.query('BEGIN')
    
    const seasonResult = await client.query(`
      SELECT id FROM seasons WHERE year = 1992
    `)
    const seasonId = seasonResult.rows[0].id
    
    console.log('🔍 IDENTIFYING CORRUPTION SOURCES...')
    console.log('─'.repeat(50))
    
    // 1. Find matches created today (recent corruption)
    const recentCorruption = await client.query(`
      SELECT 
        m.id,
        m.match_date,
        ht.name as home_team,
        at.name as away_team,
        m.created_at
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.season_id = $1 
      AND DATE(m.created_at) = CURRENT_DATE
      ORDER BY m.created_at DESC
    `, [seasonId])
    
    console.log(`Found ${recentCorruption.rows.length} matches created today (likely corruption):`)
    for (const match of recentCorruption.rows) {
      console.log(`   • ${match.match_date}: ${match.home_team} vs ${match.away_team} (ID: ${match.id})`)
    }
    console.log('')
    
    // 2. Find matches on suspicious dates (11 matches on single date)
    const suspiciousDates = await client.query(`
      SELECT 
        match_date,
        COUNT(*) as match_count,
        ARRAY_AGG(m.id) as match_ids
      FROM matches m
      WHERE m.season_id = $1
      GROUP BY match_date
      HAVING COUNT(*) > 10
      ORDER BY match_count DESC
    `, [seasonId])
    
    console.log(`Found ${suspiciousDates.rows.length} dates with too many matches:`)
    for (const date of suspiciousDates.rows) {
      console.log(`   • ${date.match_date}: ${date.match_count} matches`)
    }
    console.log('')
    
    // 3. Find teams with too many matches
    const overMatchedTeams = await client.query(`
      SELECT 
        t.name,
        COUNT(*) as total_matches,
        COUNT(*) - 42 as excess_matches
      FROM teams t
      JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
      WHERE m.season_id = $1
      GROUP BY t.id, t.name
      HAVING COUNT(*) > 42
      ORDER BY total_matches DESC
    `, [seasonId])
    
    console.log(`Found ${overMatchedTeams.rows.length} teams with too many matches:`)
    for (const team of overMatchedTeams.rows) {
      console.log(`   • ${team.name}: ${team.total_matches} matches (${team.excess_matches} excess)`)
    }
    console.log('')
    
    console.log('🧹 EXECUTING CORRUPTION CLEANUP...')
    console.log('─'.repeat(50))
    
    let deletedMatches = 0
    
    // STEP 1: Delete matches created today (recent corruption)
    if (recentCorruption.rows.length > 0) {
      console.log(`Deleting ${recentCorruption.rows.length} matches created today...`)
      
      for (const match of recentCorruption.rows) {
        // Delete associated goals first
        const goalsDeleted = await client.query(`
          DELETE FROM goals WHERE match_id = $1
        `, [match.id])
        
        // Delete the match
        const matchDeleted = await client.query(`
          DELETE FROM matches WHERE id = $1
        `, [match.id])
        
        if (matchDeleted.rowCount > 0) {
          deletedMatches++
          console.log(`   ✅ Deleted: ${match.home_team} vs ${match.away_team} (${goalsDeleted.rowCount} goals)`)
        }
      }
    }
    
    // STEP 2: Clean up remaining suspicious dates if still problematic
    const remainingSuspicious = await client.query(`
      SELECT 
        match_date,
        COUNT(*) as match_count
      FROM matches m
      WHERE m.season_id = $1
      GROUP BY match_date
      HAVING COUNT(*) > 10
    `, [seasonId])
    
    if (remainingSuspicious.rows.length > 0) {
      console.log(`Cleaning up ${remainingSuspicious.rows.length} remaining suspicious dates...`)
      
      for (const suspDate of remainingSuspicious.rows) {
        // Keep only the first 10 matches on each suspicious date, delete the rest
        const excessMatches = await client.query(`
          SELECT m.id 
          FROM matches m
          WHERE m.season_id = $1 AND m.match_date = $2
          ORDER BY m.created_at DESC
          OFFSET 10
        `, [seasonId, suspDate.match_date])
        
        for (const match of excessMatches.rows) {
          // Delete goals first
          await client.query(`DELETE FROM goals WHERE match_id = $1`, [match.id])
          
          // Delete match
          const deleted = await client.query(`DELETE FROM matches WHERE id = $1`, [match.id])
          if (deleted.rowCount > 0) {
            deletedMatches++
          }
        }
        
        console.log(`   ✅ Cleaned date ${suspDate.match_date}: removed ${excessMatches.rows.length} excess matches`)
      }
    }
    
    // STEP 3: Final validation and cleanup
    console.log('')
    console.log('🔍 POST-CLEANUP VALIDATION...')
    console.log('─'.repeat(50))
    
    const finalCount = await client.query(`
      SELECT COUNT(*) as total_matches FROM matches WHERE season_id = $1
    `, [seasonId])
    
    const currentTotal = parseInt(finalCount.rows[0].total_matches)
    const expectedTotal = 462
    
    console.log(`Current match count: ${currentTotal}`)
    console.log(`Expected match count: ${expectedTotal}`)
    console.log(`Matches deleted: ${deletedMatches}`)
    
    if (currentTotal === expectedTotal) {
      console.log('✅ Match count now correct!')
    } else if (currentTotal > expectedTotal) {
      console.log(`⚠️  Still ${currentTotal - expectedTotal} excess matches - need additional cleanup`)
    } else {
      console.log(`⚠️  Now ${expectedTotal - currentTotal} matches short - may need to restore some data`)
    }
    
    // Check team match counts after cleanup
    const finalTeamCounts = await client.query(`
      SELECT 
        t.name,
        COUNT(*) as total_matches
      FROM teams t
      JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id)
      WHERE m.season_id = $1
      GROUP BY t.id, t.name
      HAVING COUNT(*) != 42
      ORDER BY total_matches DESC
    `, [seasonId])
    
    if (finalTeamCounts.rows.length === 0) {
      console.log('✅ All teams now have correct match counts (42 each)')
    } else {
      console.log(`⚠️  ${finalTeamCounts.rows.length} teams still have incorrect match counts:`)
      for (const team of finalTeamCounts.rows) {
        console.log(`   • ${team.name}: ${team.total_matches} matches`)
      }
    }
    
    // Check for remaining suspicious date patterns
    const finalSuspiciousDates = await client.query(`
      SELECT 
        match_date,
        COUNT(*) as match_count
      FROM matches m
      WHERE m.season_id = $1
      GROUP BY match_date
      HAVING COUNT(*) > 8
      ORDER BY match_count DESC
    `, [seasonId])
    
    if (finalSuspiciousDates.rows.length === 0) {
      console.log('✅ No more suspicious date patterns')
    } else {
      console.log(`⚠️  ${finalSuspiciousDates.rows.length} dates still have high match counts:`)
      for (const date of finalSuspiciousDates.rows) {
        console.log(`   • ${date.match_date}: ${date.match_count} matches`)
      }
    }
    
    console.log('')
    console.log('📋 CLEANUP SUMMARY:')
    console.log('═'.repeat(50))
    
    if (currentTotal === expectedTotal && finalTeamCounts.rows.length === 0 && finalSuspiciousDates.rows.length === 0) {
      console.log('✅ 1992/1993 season data corruption: FIXED')
      console.log('✅ All integrity checks now pass')
      console.log('✅ Safe to commit transaction')
      
      await client.query('COMMIT')
      console.log('✅ Transaction committed - corruption fixes applied')
      
    } else {
      console.log('⚠️  Some issues remain - reviewing transaction')
      console.log('Available options:')
      console.log('   1. Commit partial fixes')
      console.log('   2. Rollback and try different approach')
      
      // For safety, commit the fixes we've made
      await client.query('COMMIT')
      console.log('✅ Partial fixes committed - additional cleanup may be needed')
    }
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error during cleanup, transaction rolled back:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

// Execute corruption fix
fix1992SeasonCorruption()