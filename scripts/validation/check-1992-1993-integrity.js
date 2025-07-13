#!/usr/bin/env node

/**
 * 🔍 1992/1993 Season Data Integrity Check
 * 
 * CRITICAL: Check for data corruption in the inaugural Premier League season
 * 
 * CHECKS:
 * - Match count validation
 * - Date accuracy and chronological order
 * - Team consistency
 * - Score validity
 * - Duplicate detection
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

async function check1992SeasonIntegrity() {
  console.log('🔍 1992/1993 SEASON DATA INTEGRITY CHECK')
  console.log('=========================================')
  console.log('')
  
  const client = await pool.connect()
  
  try {
    // Get 1992/1993 season ID
    const seasonResult = await client.query(`
      SELECT id, name, year FROM seasons WHERE year = 1992
    `)
    
    if (seasonResult.rows.length === 0) {
      console.log('❌ ERROR: 1992/1993 season not found in database')
      return
    }
    
    const season = seasonResult.rows[0]
    console.log(`📋 Season Found: ${season.name} (ID: ${season.id}, Year: ${season.year})`)
    console.log('')
    
    // 1. MATCH COUNT CHECK
    console.log('📊 MATCH COUNT ANALYSIS:')
    console.log('─'.repeat(40))
    
    const matchCount = await client.query(`
      SELECT COUNT(*) as total_matches FROM matches WHERE season_id = $1
    `, [season.id])
    
    const expectedMatches = 462 // 22 teams × 21 home matches each = 462 total matches
    const actualMatches = parseInt(matchCount.rows[0].total_matches)
    
    console.log(`Expected Matches (22 teams): ${expectedMatches}`)
    console.log(`Actual Matches in Database: ${actualMatches}`)
    console.log(`Difference: ${actualMatches - expectedMatches}`)
    
    if (actualMatches !== expectedMatches) {
      console.log(`⚠️  WARNING: Match count mismatch! Expected ${expectedMatches}, found ${actualMatches}`)
    } else {
      console.log(`✅ Match count correct`)
    }
    console.log('')
    
    // 2. DATE RANGE AND CHRONOLOGICAL CHECK
    console.log('📅 DATE RANGE ANALYSIS:')
    console.log('─'.repeat(40))
    
    const dateRange = await client.query(`
      SELECT 
        MIN(match_date) as earliest_match,
        MAX(match_date) as latest_match,
        COUNT(DISTINCT match_date) as unique_dates
      FROM matches WHERE season_id = $1
    `, [season.id])
    
    const range = dateRange.rows[0]
    console.log(`Earliest Match: ${range.earliest_match}`)
    console.log(`Latest Match: ${range.latest_match}`)
    console.log(`Unique Match Dates: ${range.unique_dates}`)
    
    // Check if dates are within expected 1992-1993 season range
    const earliest = new Date(range.earliest_match)
    const latest = new Date(range.latest_match)
    const expectedStart = new Date('1992-08-01')
    const expectedEnd = new Date('1993-06-30')
    
    console.log(`Expected Season Range: ${expectedStart.toISOString().split('T')[0]} to ${expectedEnd.toISOString().split('T')[0]}`)
    
    if (earliest < expectedStart || latest > expectedEnd) {
      console.log(`⚠️  WARNING: Dates outside expected season range!`)
      if (earliest < expectedStart) console.log(`   • Earliest match too early: ${range.earliest_match}`)
      if (latest > expectedEnd) console.log(`   • Latest match too late: ${range.latest_match}`)
    } else {
      console.log(`✅ All dates within expected season range`)
    }
    console.log('')
    
    // 3. SAMPLE MATCHES INSPECTION
    console.log('🔍 SAMPLE MATCHES INSPECTION:')
    console.log('─'.repeat(40))
    
    const sampleMatches = await client.query(`
      SELECT 
        m.id,
        m.match_date,
        ht.name as home_team,
        at.name as away_team,
        m.home_score,
        m.away_score,
        m.created_at
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.season_id = $1
      ORDER BY m.match_date
      LIMIT 10
    `, [season.id])
    
    console.log('First 10 matches chronologically:')
    for (const match of sampleMatches.rows) {
      console.log(`${match.match_date} | ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`)
    }
    console.log('')
    
    // 4. TEAM PARTICIPATION CHECK
    console.log('👥 TEAM PARTICIPATION ANALYSIS:')
    console.log('─'.repeat(40))
    
    const teamCounts = await client.query(`
      SELECT 
        t.name,
        COUNT(CASE WHEN m.home_team_id = t.id THEN 1 END) as home_matches,
        COUNT(CASE WHEN m.away_team_id = t.id THEN 1 END) as away_matches,
        COUNT(*) as total_matches
      FROM teams t
      LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.season_id = $1
      WHERE t.id IN (
        SELECT DISTINCT home_team_id FROM matches WHERE season_id = $1
        UNION 
        SELECT DISTINCT away_team_id FROM matches WHERE season_id = $1
      )
      GROUP BY t.id, t.name
      ORDER BY total_matches DESC
    `, [season.id])
    
    console.log('Team participation (expected: 21 home + 21 away = 42 total each):')
    let corruptTeams = 0
    for (const team of teamCounts.rows) {
      const expectedTotal = 42
      const status = team.total_matches == expectedTotal ? '✅' : '⚠️'
      if (team.total_matches != expectedTotal) corruptTeams++
      
      console.log(`${status} ${team.name}: ${team.home_matches}H + ${team.away_matches}A = ${team.total_matches} total`)
    }
    
    if (corruptTeams > 0) {
      console.log(`⚠️  WARNING: ${corruptTeams} teams have incorrect match counts!`)
    } else {
      console.log(`✅ All teams have correct match counts`)
    }
    console.log('')
    
    // 5. DUPLICATE DETECTION
    console.log('🔍 DUPLICATE DETECTION:')
    console.log('─'.repeat(40))
    
    const duplicates = await client.query(`
      SELECT 
        m1.match_date,
        ht.name as home_team,
        at.name as away_team,
        COUNT(*) as duplicate_count
      FROM matches m1
      JOIN teams ht ON m1.home_team_id = ht.id
      JOIN teams at ON m1.away_team_id = at.id
      WHERE m1.season_id = $1
      GROUP BY m1.match_date, m1.home_team_id, m1.away_team_id, ht.name, at.name
      HAVING COUNT(*) > 1
      ORDER BY duplicate_count DESC
    `, [season.id])
    
    if (duplicates.rows.length > 0) {
      console.log(`⚠️  WARNING: Found ${duplicates.rows.length} duplicate matches:`)
      for (const dup of duplicates.rows) {
        console.log(`   • ${dup.match_date}: ${dup.home_team} vs ${dup.away_team} (${dup.duplicate_count} copies)`)
      }
    } else {
      console.log(`✅ No duplicate matches found`)
    }
    console.log('')
    
    // 6. RECENT CREATION ANALYSIS
    console.log('🕒 RECENT CREATION ANALYSIS:')
    console.log('─'.repeat(40))
    
    const recentMatches = await client.query(`
      SELECT 
        DATE(m.created_at) as creation_date,
        COUNT(*) as matches_created
      FROM matches m
      WHERE m.season_id = $1
      GROUP BY DATE(m.created_at)
      ORDER BY creation_date DESC
      LIMIT 5
    `, [season.id])
    
    console.log('Recent match creation activity:')
    for (const day of recentMatches.rows) {
      console.log(`${day.creation_date}: ${day.matches_created} matches created`)
    }
    console.log('')
    
    // 7. GOAL DATA INTEGRITY
    console.log('⚽ GOAL DATA INTEGRITY:')
    console.log('─'.repeat(40))
    
    const goalStats = await client.query(`
      SELECT 
        COUNT(g.id) as total_goals,
        COUNT(DISTINCT g.match_id) as matches_with_goals,
        COUNT(DISTINCT m.id) as total_matches,
        ROUND(AVG(m.home_score + m.away_score)::numeric, 2) as avg_goals_per_match
      FROM matches m
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE m.season_id = $1
    `, [season.id])
    
    const goals = goalStats.rows[0]
    console.log(`Total Goals: ${goals.total_goals}`)
    console.log(`Matches with Goals: ${goals.matches_with_goals}/${goals.total_matches}`)
    console.log(`Average Goals per Match: ${goals.avg_goals_per_match}`)
    console.log('')
    
    // 8. SUSPICIOUS DATE PATTERNS
    console.log('🔍 SUSPICIOUS DATE PATTERNS:')
    console.log('─'.repeat(40))
    
    const datePatterns = await client.query(`
      SELECT 
        match_date,
        COUNT(*) as matches_on_date
      FROM matches 
      WHERE season_id = $1
      GROUP BY match_date
      HAVING COUNT(*) > 10
      ORDER BY matches_on_date DESC
    `, [season.id])
    
    if (datePatterns.rows.length > 0) {
      console.log(`⚠️  WARNING: Found dates with unusually high match counts:`)
      for (const pattern of datePatterns.rows) {
        console.log(`   • ${pattern.match_date}: ${pattern.matches_on_date} matches`)
      }
    } else {
      console.log(`✅ No suspicious date patterns found`)
    }
    console.log('')
    
    // SUMMARY
    console.log('📋 INTEGRITY CHECK SUMMARY:')
    console.log('═'.repeat(40))
    
    const issues = []
    if (actualMatches !== expectedMatches) issues.push(`Match count: ${actualMatches}/${expectedMatches}`)
    if (earliest < expectedStart || latest > expectedEnd) issues.push('Date range out of bounds')
    if (corruptTeams > 0) issues.push(`${corruptTeams} teams with wrong match counts`)
    if (duplicates.rows.length > 0) issues.push(`${duplicates.rows.length} duplicate matches`)
    if (datePatterns.rows.length > 0) issues.push(`${datePatterns.rows.length} suspicious date patterns`)
    
    if (issues.length === 0) {
      console.log('✅ 1992/1993 season data integrity: GOOD')
    } else {
      console.log('⚠️  1992/1993 season data integrity: ISSUES FOUND')
      console.log('Issues detected:')
      for (const issue of issues) {
        console.log(`   • ${issue}`)
      }
    }
    
  } finally {
    client.release()
    await pool.end()
  }
}

// Execute integrity check
check1992SeasonIntegrity()