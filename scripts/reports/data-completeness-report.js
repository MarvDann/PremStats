#!/usr/bin/env node

/**
 * PremStats Data Completeness Report
 * Comprehensive analysis of data coverage across all Premier League seasons
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class DataCompletenessReport {
  constructor() {
    this.seasonData = []
    this.overallStats = {}
  }

  async generateReport() {
    console.log('📊 PREMSTATS DATA COMPLETENESS REPORT')
    console.log('Comprehensive analysis of Premier League data coverage (1992-2025)')
    console.log('=' .repeat(85))
    console.log('')
    
    try {
      // 1. Generate season-by-season analysis
      await this.analyzeSeasonData()
      
      // 2. Calculate overall statistics
      await this.calculateOverallStats()
      
      // 3. Display comprehensive report
      await this.displayReport()
      
      // 4. Generate recommendations
      await this.generateRecommendations()
      
    } catch (error) {
      console.error('❌ Report generation failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async analyzeSeasonData() {
    console.log('🔍 ANALYZING SEASON-BY-SEASON DATA:')
    console.log('')
    
    // Get all seasons and their data completeness
    const seasonsQuery = await pool.query(`
      SELECT 
        s.id,
        s.year,
        s.name,
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.home_score IS NOT NULL AND m.away_score IS NOT NULL THEN m.id END) as matches_with_scores,
        COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN m.id END) as matches_with_goals,
        COUNT(g.id) as total_goals,
        COUNT(DISTINCT g.player_id) as unique_players,
        COUNT(DISTINCT t.id) as teams_count,
        MIN(m.match_date) as season_start,
        MAX(m.match_date) as season_end
      FROM seasons s
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN goals g ON m.id = g.match_id  
      LEFT JOIN teams t ON m.home_team_id = t.id OR m.away_team_id = t.id
      GROUP BY s.id, s.year, s.name
      ORDER BY s.year
    `)
    
    for (const season of seasonsQuery.rows) {
      // Calculate additional metrics
      const expectedMatches = this.getExpectedMatchesForSeason(season.year)
      const matchCompleteness = season.total_matches > 0 ? 
        ((season.matches_with_scores / season.total_matches) * 100) : 0
      const goalCompleteness = season.total_matches > 0 ? 
        ((season.matches_with_goals / season.total_matches) * 100) : 0
      const seasonProgress = expectedMatches > 0 ? 
        ((season.total_matches / expectedMatches) * 100) : 0
      
      // Determine data quality level
      let qualityLevel = 'No Data'
      let qualityIcon = '❌'
      
      if (goalCompleteness >= 95) {
        qualityLevel = 'Excellent'
        qualityIcon = '🌟'
      } else if (goalCompleteness >= 80) {
        qualityLevel = 'Good'
        qualityIcon = '✅'
      } else if (goalCompleteness >= 50) {
        qualityLevel = 'Partial'
        qualityIcon = '🔄'
      } else if (goalCompleteness > 0) {
        qualityLevel = 'Minimal'
        qualityIcon = '⚠️'
      }
      
      this.seasonData.push({
        id: season.id,
        year: season.year,
        name: season.name,
        totalMatches: parseInt(season.total_matches) || 0,
        matchesWithScores: parseInt(season.matches_with_scores) || 0,
        matchesWithGoals: parseInt(season.matches_with_goals) || 0,
        totalGoals: parseInt(season.total_goals) || 0,
        uniquePlayers: parseInt(season.unique_players) || 0,
        teamsCount: parseInt(season.teams_count) || 0,
        expectedMatches,
        matchCompleteness: matchCompleteness.toFixed(1),
        goalCompleteness: goalCompleteness.toFixed(1),
        seasonProgress: seasonProgress.toFixed(1),
        qualityLevel,
        qualityIcon,
        seasonStart: season.season_start,
        seasonEnd: season.season_end
      })
    }
    
    console.log(`   📊 Analyzed ${this.seasonData.length} Premier League seasons`)
    console.log('')
  }

  getExpectedMatchesForSeason(year) {
    // Premier League match count by era
    if (year >= 1992 && year <= 1994) return 462  // 22 teams, 42 matches each
    if (year >= 1995 && year <= 2024) return 380  // 20 teams, 38 matches each
    if (year >= 2025) return 380  // Projected for future seasons
    return 0  // Pre-Premier League
  }

  async calculateOverallStats() {
    this.overallStats = {
      totalSeasons: this.seasonData.length,
      seasonsWithData: this.seasonData.filter(s => s.totalMatches > 0).length,
      totalMatches: this.seasonData.reduce((sum, s) => sum + s.totalMatches, 0),
      totalGoals: this.seasonData.reduce((sum, s) => sum + s.totalGoals, 0),
      totalPlayers: this.seasonData.reduce((sum, s) => sum + s.uniquePlayers, 0),
      excellentSeasons: this.seasonData.filter(s => s.qualityLevel === 'Excellent').length,
      goodSeasons: this.seasonData.filter(s => s.qualityLevel === 'Good').length,
      partialSeasons: this.seasonData.filter(s => s.qualityLevel === 'Partial').length,
      minimalSeasons: this.seasonData.filter(s => s.qualityLevel === 'Minimal').length,
      noDataSeasons: this.seasonData.filter(s => s.qualityLevel === 'No Data').length
    }
    
    // Calculate average completeness
    const seasonsWithMatches = this.seasonData.filter(s => s.totalMatches > 0)
    this.overallStats.avgMatchCompleteness = seasonsWithMatches.length > 0 ?
      (seasonsWithMatches.reduce((sum, s) => sum + parseFloat(s.matchCompleteness), 0) / seasonsWithMatches.length).toFixed(1) : 0
    this.overallStats.avgGoalCompleteness = seasonsWithMatches.length > 0 ?
      (seasonsWithMatches.reduce((sum, s) => sum + parseFloat(s.goalCompleteness), 0) / seasonsWithMatches.length).toFixed(1) : 0
  }

  async displayReport() {
    console.log('📈 OVERALL DATA COMPLETENESS SUMMARY:')
    console.log('')
    console.log(`   📊 Total Seasons: ${this.overallStats.totalSeasons}`)
    console.log(`   📋 Seasons with Data: ${this.overallStats.seasonsWithData}`)
    console.log(`   ⚽ Total Matches: ${this.overallStats.totalMatches.toLocaleString()}`)
    console.log(`   🥅 Total Goals: ${this.overallStats.totalGoals.toLocaleString()}`)
    console.log(`   👥 Total Players: ${this.overallStats.totalPlayers.toLocaleString()}`)
    console.log('')
    console.log(`   📊 Average Match Completeness: ${this.overallStats.avgMatchCompleteness}%`)
    console.log(`   ⚽ Average Goal Completeness: ${this.overallStats.avgGoalCompleteness}%`)
    console.log('')
    
    console.log('🎯 DATA QUALITY DISTRIBUTION:')
    console.log(`   🌟 Excellent (95%+): ${this.overallStats.excellentSeasons} seasons`)
    console.log(`   ✅ Good (80-94%): ${this.overallStats.goodSeasons} seasons`)
    console.log(`   🔄 Partial (50-79%): ${this.overallStats.partialSeasons} seasons`)
    console.log(`   ⚠️ Minimal (1-49%): ${this.overallStats.minimalSeasons} seasons`)
    console.log(`   ❌ No Data (0%): ${this.overallStats.noDataSeasons} seasons`)
    console.log('')
    
    console.log('📋 SEASON-BY-SEASON BREAKDOWN:')
    console.log('')
    console.log('Year   | Season Name          | Matches | Goals | Players | Match% | Goal% | Quality')
    console.log('-------|---------------------|---------|-------|---------|--------|-------|----------')
    
    for (const season of this.seasonData) {
      const yearStr = season.year.toString().padEnd(6)
      const nameStr = season.name.padEnd(19)
      const matchStr = season.totalMatches.toString().padStart(7)
      const goalStr = season.totalGoals.toString().padStart(5)
      const playerStr = season.uniquePlayers.toString().padStart(7)
      const matchPctStr = (season.matchCompleteness + '%').padStart(6)
      const goalPctStr = (season.goalCompleteness + '%').padStart(5)
      const qualityStr = `${season.qualityIcon} ${season.qualityLevel}`
      
      console.log(`${yearStr} | ${nameStr} | ${matchStr} | ${goalStr} | ${playerStr} | ${matchPctStr} | ${goalPctStr} | ${qualityStr}`)
    }
    console.log('')
    
    // Highlight best and worst seasons
    const bestSeasons = this.seasonData
      .filter(s => s.totalMatches > 0)
      .sort((a, b) => parseFloat(b.goalCompleteness) - parseFloat(a.goalCompleteness))
      .slice(0, 5)
    
    const worstSeasons = this.seasonData
      .filter(s => s.totalMatches > 0)
      .sort((a, b) => parseFloat(a.goalCompleteness) - parseFloat(b.goalCompleteness))
      .slice(0, 5)
    
    if (bestSeasons.length > 0) {
      console.log('🏆 TOP 5 BEST DATA COVERAGE:')
      for (const season of bestSeasons) {
        console.log(`   ${season.qualityIcon} ${season.year} ${season.name}: ${season.goalCompleteness}% goal coverage (${season.totalGoals} goals)`)
      }
      console.log('')
    }
    
    if (worstSeasons.length > 0) {
      console.log('⚠️ TOP 5 PRIORITY IMPROVEMENTS:')
      for (const season of worstSeasons) {
        console.log(`   ${season.qualityIcon} ${season.year} ${season.name}: ${season.goalCompleteness}% goal coverage (${season.totalGoals} goals)`)
      }
      console.log('')
    }
    
    // Era analysis
    console.log('📊 DATA COVERAGE BY ERA:')
    console.log('')
    
    const eras = [
      { name: 'Early Premier League (1992-1999)', years: [1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999] },
      { name: 'Golden Era (2000-2009)', years: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009] },
      { name: 'Modern Era (2010-2019)', years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019] },
      { name: 'Recent Era (2020-2025)', years: [2020, 2021, 2022, 2023, 2024, 2025] }
    ]
    
    for (const era of eras) {
      const eraSeasons = this.seasonData.filter(s => era.years.includes(s.year))
      const seasonsWithData = eraSeasons.filter(s => s.totalMatches > 0)
      const avgGoalCompleteness = seasonsWithData.length > 0 ?
        (seasonsWithData.reduce((sum, s) => sum + parseFloat(s.goalCompleteness), 0) / seasonsWithData.length).toFixed(1) : 0
      const totalGoals = eraSeasons.reduce((sum, s) => sum + s.totalGoals, 0)
      
      console.log(`   📅 ${era.name}:`)
      console.log(`      Seasons: ${seasonsWithData.length}/${eraSeasons.length} with data`)
      console.log(`      Average Goal Coverage: ${avgGoalCompleteness}%`)
      console.log(`      Total Goals: ${totalGoals.toLocaleString()}`)
      console.log('')
    }
  }

  async generateRecommendations() {
    console.log('💡 DATA IMPROVEMENT RECOMMENDATIONS:')
    console.log('')
    
    // Priority 1: Seasons with no data
    const noDataSeasons = this.seasonData.filter(s => s.qualityLevel === 'No Data')
    if (noDataSeasons.length > 0) {
      console.log('🚨 PRIORITY 1 - CRITICAL GAPS (No Data):')
      for (const season of noDataSeasons.slice(0, 10)) {
        console.log(`   ❌ ${season.year} ${season.name}: Complete data import required`)
      }
      if (noDataSeasons.length > 10) {
        console.log(`   📊 ... and ${noDataSeasons.length - 10} more seasons`)
      }
      console.log('')
    }
    
    // Priority 2: Seasons with minimal data  
    const minimalSeasons = this.seasonData.filter(s => s.qualityLevel === 'Minimal')
    if (minimalSeasons.length > 0) {
      console.log('⚠️ PRIORITY 2 - MINIMAL DATA (<50% coverage):')
      for (const season of minimalSeasons) {
        console.log(`   ⚠️ ${season.year} ${season.name}: ${season.goalCompleteness}% goal coverage - needs major improvement`)
      }
      console.log('')
    }
    
    // Priority 3: Seasons with partial data
    const partialSeasons = this.seasonData.filter(s => s.qualityLevel === 'Partial')
    if (partialSeasons.length > 0) {
      console.log('🔄 PRIORITY 3 - PARTIAL DATA (50-79% coverage):')
      for (const season of partialSeasons) {
        console.log(`   🔄 ${season.year} ${season.name}: ${season.goalCompleteness}% goal coverage - enhancement opportunity`)
      }
      console.log('')
    }
    
    // Phase 5/6 Sigma recommendations
    const currentSeasonTarget = this.seasonData.find(s => s.year === 1992)
    if (currentSeasonTarget) {
      console.log('🎯 6 SIGMA IMPLEMENTATION RECOMMENDATIONS:')
      console.log('')
      console.log(`   📊 Current 1992-93 Status: ${currentSeasonTarget.goalCompleteness}% goal coverage`)
      console.log(`   🎯 Target: 99%+ goal coverage with verified historical data`)
      console.log('')
      console.log('   📋 RECOMMENDED ACTION PLAN:')
      console.log('   1. Complete 1992-93 season with Phase 5 full-scale processing')
      console.log('   2. Expand to 1993-94 and 1994-95 using proven methodology')
      console.log('   3. Implement automated web scraping for 1995-2000 era')
      console.log('   4. Build quality monitoring dashboard for real-time tracking')
      console.log('   5. Scale to modern era (2000+) with API integrations')
      console.log('')
    }
    
    console.log('🚀 STRATEGIC PRIORITIES FOR COMPLETE COVERAGE:')
    console.log('')
    console.log('   📈 SHORT TERM (Phase 5-6):')
    console.log('   • Complete early Premier League era (1992-1999)')
    console.log('   • Achieve 95%+ goal coverage for foundation seasons')
    console.log('   • Implement verified historical data sources')
    console.log('')
    console.log('   🎯 MEDIUM TERM (Phase 7-8):')
    console.log('   • Expand to golden era (2000-2009)')
    console.log('   • Integrate real-time API data sources')
    console.log('   • Build automated quality validation')
    console.log('')
    console.log('   🌟 LONG TERM (Phase 9-10):')
    console.log('   • Complete modern era (2010-2025)')
    console.log('   • Achieve 99%+ coverage across all seasons')
    console.log('   • Implement predictive data quality monitoring')
    console.log('')
    console.log('📊 SUCCESS METRICS:')
    console.log(`   • Target: ${this.overallStats.totalSeasons} seasons at 95%+ goal coverage`)
    console.log('   • Quality: 6 Sigma accuracy (99.99966%) on all verified data')
    console.log('   • Coverage: Complete Premier League historical dataset')
    console.log('   • Automation: Self-healing data quality systems')
  }
}

// Generate the report
const report = new DataCompletenessReport()
report.generateReport()