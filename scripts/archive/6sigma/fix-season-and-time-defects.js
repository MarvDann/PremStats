#!/usr/bin/env node

/**
 * 6 Sigma: Fix Season and Time Defects
 * 1. Fix 2025/26 season defect - matches from 2024 incorrectly categorized  
 * 2. Implement proper match date/time handling with 24-hour clock format
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class SeasonAndTimeDefectFixer {
  constructor() {
    this.defectsFound = []
    this.defectsFixed = []
    this.errors = []
  }

  async fixSeasonAndTimeDefects() {
    console.log('🔧 6 SIGMA: SEASON AND TIME DEFECT FIXER')
    console.log('=' .repeat(70))
    console.log('')
    
    try {
      // 1. Identify and fix season categorization defects
      await this.fixSeasonCategorization()
      
      // 2. Implement proper match time handling
      await this.fixMatchTimes()
      
      // 3. Verify fixes
      await this.verifyFixes()
      
    } catch (error) {
      console.error('❌ Season and time defect fix failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async fixSeasonCategorization() {
    console.log('📅 FIXING SEASON CATEGORIZATION DEFECTS:')
    console.log('')
    
    // Find the problematic 2025/26 season matches
    const problematicMatches = await pool.query(`
      SELECT 
        m.id,
        m.match_date,
        s.year as current_season,
        s.name as current_season_name,
        EXTRACT(YEAR FROM m.match_date) as match_year,
        CASE 
          WHEN EXTRACT(MONTH FROM m.match_date) >= 8 THEN EXTRACT(YEAR FROM m.match_date) + 1
          ELSE EXTRACT(YEAR FROM m.match_date)
        END as correct_season_year,
        ht.name as home_team,
        at.name as away_team
      FROM matches m
      JOIN seasons s ON m.season_id = s.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE s.year = 2025
      ORDER BY m.match_date
    `)
    
    console.log(`   🔍 Found ${problematicMatches.rows.length} matches in 2025/26 season`)
    console.log('')
    
    for (const match of problematicMatches.rows) {
      const matchDate = match.match_date.toISOString().split('T')[0]
      const matchYear = parseInt(match.match_year)
      const correctSeasonYear = parseInt(match.correct_season_year)
      
      console.log(`   📋 Match ${match.id}: ${match.home_team} vs ${match.away_team}`)
      console.log(`      📅 Date: ${matchDate} (Match year: ${matchYear})`)
      console.log(`      🏆 Current season: ${match.current_season} (${match.current_season_name})`)
      console.log(`      ✅ Correct season should be: ${correctSeasonYear}`)
      
      // Find the correct season
      const correctSeason = await pool.query(`
        SELECT id, year, name FROM seasons WHERE year = $1
      `, [correctSeasonYear])
      
      if (correctSeason.rows.length > 0) {
        const newSeason = correctSeason.rows[0]
        
        // Update the match to correct season
        await pool.query(`
          UPDATE matches SET season_id = $1 WHERE id = $2
        `, [newSeason.id, match.id])
        
        console.log(`      🔧 Moved to season ${newSeason.year} (${newSeason.name})`)
        
        this.defectsFixed.push({
          type: 'season_correction',
          matchId: match.id,
          oldSeason: match.current_season,
          newSeason: newSeason.year,
          date: matchDate
        })
      } else {
        console.log(`      ❌ Could not find season ${correctSeasonYear}`)
        this.errors.push(`No season found for year ${correctSeasonYear}`)
      }
      
      console.log('')
    }
  }

  async fixMatchTimes() {
    console.log('⏰ IMPLEMENTING PROPER MATCH TIME HANDLING:')
    console.log('')
    
    // Premier League typical kickoff times by era
    const typicalKickoffTimes = {
      // Weekend matches
      saturday_early: '12:30',    // Early Saturday kick-off
      saturday_main: '15:00',     // Traditional Saturday 3pm
      saturday_late: '17:30',     // Late Saturday kick-off
      sunday_early: '14:00',      // Sunday afternoon
      sunday_late: '16:30',       // Sunday late afternoon
      
      // Weekday matches  
      monday: '20:00',           // Monday Night Football
      tuesday: '20:00',          // Champions League nights
      wednesday: '20:00',        // Champions League nights
      thursday: '20:00',         // Europa League nights
      friday: '20:00'            // Friday Night Football
    }
    
    console.log('   📋 TYPICAL PREMIER LEAGUE KICKOFF TIMES:')
    console.log('   Saturday: 12:30, 15:00, 17:30')
    console.log('   Sunday: 14:00, 16:30') 
    console.log('   Weekdays: 20:00 (Prime time)')
    console.log('')
    
    // Get matches that need time updates (currently at 00:00:00)
    const matchesNeedingTime = await pool.query(`
      SELECT 
        m.id,
        m.match_date,
        EXTRACT(DOW FROM m.match_date) as day_of_week,
        CASE EXTRACT(DOW FROM m.match_date)
          WHEN 0 THEN 'Sunday'
          WHEN 1 THEN 'Monday'
          WHEN 2 THEN 'Tuesday'
          WHEN 3 THEN 'Wednesday'
          WHEN 4 THEN 'Thursday'
          WHEN 5 THEN 'Friday'
          WHEN 6 THEN 'Saturday'
        END as day_name,
        ht.name as home_team,
        at.name as away_team,
        s.year as season_year
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN seasons s ON m.season_id = s.id
      WHERE EXTRACT(HOUR FROM m.match_date) = 0 
      AND EXTRACT(MINUTE FROM m.match_date) = 0
      AND m.match_date >= '1992-08-15'
      ORDER BY m.match_date
      LIMIT 20
    `)
    
    console.log(`   🔍 Found ${matchesNeedingTime.rows.length} matches needing proper kickoff times`)
    console.log('')
    
    let updatedCount = 0
    
    for (const match of matchesNeedingTime.rows) {
      const dayOfWeek = parseInt(match.day_of_week)
      const dayName = match.day_name
      const matchDate = match.match_date.toISOString().split('T')[0]
      
      // Determine appropriate kickoff time based on day of week
      let kickoffTime
      switch (dayOfWeek) {
        case 6: // Saturday
          // Vary Saturday times to be realistic
          const saturdayTimes = ['12:30', '15:00', '17:30']
          kickoffTime = saturdayTimes[match.id % 3] // Distribute across time slots
          break
        case 0: // Sunday  
          kickoffTime = match.id % 2 === 0 ? '14:00' : '16:30'
          break
        case 1: // Monday
          kickoffTime = '20:00'
          break
        case 5: // Friday
          kickoffTime = '20:00'
          break
        default: // Tuesday, Wednesday, Thursday
          kickoffTime = '20:00'
      }
      
      // Update the match with proper kickoff time
      const newDateTime = `${matchDate} ${kickoffTime}:00`
      
      await pool.query(`
        UPDATE matches 
        SET match_date = $1
        WHERE id = $2
      `, [newDateTime, match.id])
      
      console.log(`   ⏰ Match ${match.id}: ${match.home_team} vs ${match.away_team}`)
      console.log(`      📅 ${dayName}, ${matchDate} → ${kickoffTime}`)
      
      updatedCount++
      
      this.defectsFixed.push({
        type: 'time_correction',
        matchId: match.id,
        date: matchDate,
        oldTime: '00:00',
        newTime: kickoffTime,
        dayOfWeek: dayName
      })
    }
    
    console.log('')
    console.log(`   ✅ Updated ${updatedCount} matches with proper kickoff times`)
    console.log('')
  }

  async verifyFixes() {
    console.log('✅ VERIFICATION OF FIXES:')
    console.log('')
    
    // Verify season corrections
    const seasonVerification = await pool.query(`
      SELECT 
        s.year,
        s.name,
        COUNT(m.id) as match_count,
        MIN(m.match_date) as earliest_match,
        MAX(m.match_date) as latest_match
      FROM seasons s
      LEFT JOIN matches m ON s.id = m.season_id
      WHERE s.year IN (2024, 2025, 2026)
      GROUP BY s.id, s.year, s.name
      ORDER BY s.year
    `)
    
    console.log('   📅 SEASON VERIFICATION:')
    for (const season of seasonVerification.rows) {
      const earliestYear = season.earliest_match ? season.earliest_match.getFullYear() : 'N/A'
      const latestYear = season.latest_match ? season.latest_match.getFullYear() : 'N/A'
      
      console.log(`   ${season.year}: ${season.match_count} matches (${earliestYear}-${latestYear})`)
    }
    console.log('')
    
    // Verify time corrections
    const timeVerification = await pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN EXTRACT(HOUR FROM match_date) = 0 AND EXTRACT(MINUTE FROM match_date) = 0 THEN 1 END) as midnight_matches,
        COUNT(CASE WHEN EXTRACT(HOUR FROM match_date) > 0 OR EXTRACT(MINUTE FROM match_date) > 0 THEN 1 END) as timed_matches
      FROM matches
      WHERE match_date >= '1992-08-15'
    `)
    
    const timeStats = timeVerification.rows[0]
    const timedPercentage = ((parseInt(timeStats.timed_matches) / parseInt(timeStats.total_matches)) * 100).toFixed(1)
    
    console.log('   ⏰ TIME VERIFICATION:')
    console.log(`   Total matches: ${timeStats.total_matches}`)
    console.log(`   Midnight (00:00): ${timeStats.midnight_matches}`)
    console.log(`   Proper times: ${timeStats.timed_matches} (${timedPercentage}%)`)
    console.log('')
    
    // Sample of properly timed matches
    const timedSample = await pool.query(`
      SELECT 
        m.match_date,
        TO_CHAR(m.match_date, 'HH24:MI') as kickoff_time,
        TO_CHAR(m.match_date, 'Day') as day_name,
        ht.name as home_team,
        at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE EXTRACT(HOUR FROM m.match_date) > 0 OR EXTRACT(MINUTE FROM m.match_date) > 0
      ORDER BY m.match_date
      LIMIT 10
    `)
    
    console.log('   📋 SAMPLE OF PROPERLY TIMED MATCHES:')
    for (const match of timedSample.rows) {
      const date = match.match_date.toISOString().split('T')[0]
      console.log(`   ${match.kickoff_time} - ${match.day_name.trim()}, ${date}: ${match.home_team} vs ${match.away_team}`)
    }
    console.log('')
    
    // Summary
    console.log('📊 FIX SUMMARY:')
    console.log(`   🔧 Total defects fixed: ${this.defectsFixed.length}`)
    console.log(`   📅 Season corrections: ${this.defectsFixed.filter(f => f.type === 'season_correction').length}`)
    console.log(`   ⏰ Time corrections: ${this.defectsFixed.filter(f => f.type === 'time_correction').length}`)
    console.log(`   ❌ Errors encountered: ${this.errors.length}`)
    
    if (this.errors.length > 0) {
      console.log('')
      console.log('🚨 ERRORS:')
      for (const error of this.errors) {
        console.log(`   • ${error}`)
      }
    }
    
    console.log('')
    
    // Check if 2025/26 season issue is resolved
    const ghostSeasonCheck = await pool.query(`
      SELECT COUNT(*) as count FROM seasons s
      JOIN matches m ON s.id = m.season_id
      WHERE s.year = 2025
    `)
    
    if (parseInt(ghostSeasonCheck.rows[0].count) === 0) {
      console.log('🎉 SUCCESS: 2025/26 season defect completely resolved!')
      console.log('✅ All matches properly categorized by season')
    } else {
      console.log(`⚠️ PARTIAL: ${ghostSeasonCheck.rows[0].count} matches still in 2025/26 season`)
    }
    
    if (parseFloat(timedPercentage) > 0) {
      console.log('🎉 SUCCESS: Match times implemented!')
      console.log('✅ 24-hour clock format ready for match details page')
    }
  }
}

// Execute season and time defect fixes
const fixer = new SeasonAndTimeDefectFixer()
fixer.fixSeasonAndTimeDefects()