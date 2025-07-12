#!/usr/bin/env node

/**
 * Historical Status Check
 * Check what historical data we have and identify the best strategy for Phase 5
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function checkHistoricalStatus() {
  try {
    console.log('🔍 HISTORICAL DATA STATUS CHECK')
    console.log('='.repeat(50))
    
    // Check all seasons 1992-2025
    const seasonsQuery = `
      SELECT 
        s.year,
        COUNT(m.id) as matches,
        COUNT(g.id) as goals,
        ROUND(
          CASE 
            WHEN COUNT(m.id) > 0 
            THEN COUNT(CASE WHEN g.id IS NOT NULL THEN m.id END)::decimal / COUNT(m.id) * 100
            ELSE 0 
          END, 1
        ) as coverage_percentage
      FROM seasons s 
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.year BETWEEN 1992 AND 2025
      GROUP BY s.id, s.year
      ORDER BY s.year
    `
    
    const seasons = await pool.query(seasonsQuery)
    
    console.log('\n📊 SEASON-BY-SEASON BREAKDOWN:')
    let earliestDataYear = null
    let latestDataYear = null
    let totalGaps = 0
    
    for (const season of seasons.rows) {
      const status = season.goals > 0 ? 
        (season.coverage_percentage > 50 ? '✅' : '🔄') : '❌'
      
      console.log(`${season.year}: ${season.matches} matches, ${season.goals} goals (${season.coverage_percentage}% coverage) ${status}`)
      
      if (season.goals > 0) {
        if (!earliestDataYear) earliestDataYear = season.year
        latestDataYear = season.year
      } else {
        totalGaps++
      }
    }
    
    console.log('\n📈 SUMMARY:')
    console.log(`Earliest data: ${earliestDataYear}`)
    console.log(`Latest data: ${latestDataYear}`)
    console.log(`Total seasons with gaps: ${totalGaps}`)
    
    // Check what historical periods need attention
    const gapAnalysis = `
      SELECT 
        CASE 
          WHEN s.year BETWEEN 1992 AND 2000 THEN 'Early Premier League (1992-2000)'
          WHEN s.year BETWEEN 2001 AND 2010 THEN 'Modern Era (2001-2010)'
          WHEN s.year BETWEEN 2011 AND 2020 THEN 'Recent Era (2011-2020)'
          WHEN s.year BETWEEN 2021 AND 2025 THEN 'Current Era (2021-2025)'
        END as period,
        COUNT(*) as total_seasons,
        COUNT(CASE WHEN g.id IS NOT NULL THEN 1 END) as seasons_with_data,
        SUM(COUNT(g.id)) as total_goals
      FROM seasons s 
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.year BETWEEN 1992 AND 2025
      GROUP BY 
        CASE 
          WHEN s.year BETWEEN 1992 AND 2000 THEN 'Early Premier League (1992-2000)'
          WHEN s.year BETWEEN 2001 AND 2010 THEN 'Modern Era (2001-2010)'
          WHEN s.year BETWEEN 2011 AND 2020 THEN 'Recent Era (2011-2020)'
          WHEN s.year BETWEEN 2021 AND 2025 THEN 'Current Era (2021-2025)'
        END
      ORDER BY MIN(s.year)
    `
    
    const periods = await pool.query(gapAnalysis)
    
    console.log('\n🎯 GAP ANALYSIS BY PERIOD:')
    for (const period of periods.rows) {
      const coverage = period.seasons_with_data > 0 ? 
        `${period.seasons_with_data}/${period.total_seasons} seasons` : 'No data'
      
      console.log(`${period.period}: ${coverage} (${period.total_goals} goals)`)
    }
    
    // Priority recommendations
    console.log('\n💡 PHASE 5 RECOMMENDATIONS:')
    
    const missingEarly = seasons.rows.filter(s => s.year >= 1992 && s.year <= 2000 && s.goals === 0)
    const missingRecent = seasons.rows.filter(s => s.year >= 2022 && s.year <= 2025 && s.goals === 0)
    
    if (missingEarly.length > 0) {
      console.log(`1. 📅 Historical Gap: ${missingEarly.length} seasons (1992-2000) need data`)
      console.log('   Strategy: Use Football-Data.co.uk historical archives')
    }
    
    if (missingRecent.length > 0) {
      console.log(`2. 🔄 Current Gap: ${missingRecent.length} seasons (2022-2025) need data`)
      console.log('   Strategy: Use API-Football for current season data')
    }
    
    const lowCoverageSeasons = seasons.rows.filter(s => s.goals > 0 && s.coverage_percentage < 50)
    if (lowCoverageSeasons.length > 0) {
      console.log(`3. 📊 Coverage Gap: ${lowCoverageSeasons.length} seasons have <50% goal coverage`)
      console.log('   Strategy: Enhance existing data with additional sources')
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

checkHistoricalStatus()