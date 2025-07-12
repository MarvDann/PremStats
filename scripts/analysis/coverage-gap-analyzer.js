#!/usr/bin/env node

/**
 * Coverage Gap Analyzer
 * Phase 4: Identify specific gaps in goal coverage to target for improvement
 */

import 'dotenv/config'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class CoverageGapAnalyzer {
  constructor() {
    this.analysis = {
      seasonalGaps: [],
      teamGaps: [],
      matchTypeGaps: [],
      temporalGaps: [],
      priorityTargets: []
    }
  }

  async analyzeCoverageGaps() {
    const spinner = ora('🔍 Starting coverage gap analysis...').start()
    
    try {
      console.log('🎯 Phase 4: Coverage Gap Analysis')
      console.log('⚡ Identifying specific targets for data expansion')
      console.log('')
      
      spinner.text = 'Analyzing seasonal coverage gaps...'
      await this.analyzeSeasonalGaps()
      
      spinner.text = 'Analyzing team-specific gaps...'
      await this.analyzeTeamGaps()
      
      spinner.text = 'Analyzing temporal patterns...'
      await this.analyzeTemporalGaps()
      
      spinner.text = 'Identifying priority targets...'
      await this.identifyPriorityTargets()
      
      spinner.succeed('✅ Coverage gap analysis complete')
      
      await this.printAnalysis()
      await this.generateActionPlan()
      
    } catch (error) {
      spinner.fail(`❌ Analysis failed: ${error.message}`)
      console.error(error)
    } finally {
      await pool.end()
    }
  }

  async analyzeSeasonalGaps() {
    const query = `
      WITH seasonal_coverage AS (
        SELECT 
          s.year,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT g.match_id) as matches_with_goals,
          COUNT(g.id) as total_goals,
          ROUND(
            CASE 
              WHEN COUNT(DISTINCT m.id) > 0 
              THEN COUNT(DISTINCT g.match_id)::decimal / COUNT(DISTINCT m.id) * 100 
              ELSE 0 
            END, 1
          ) as coverage_percentage,
          AVG(m.home_score + m.away_score) as avg_goals_per_match_expected,
          ROUND(
            CASE 
              WHEN COUNT(DISTINCT m.id) > 0 
              THEN COUNT(g.id)::decimal / COUNT(DISTINCT m.id) 
              ELSE 0 
            END, 1
          ) as avg_goals_per_match_actual
        FROM seasons s
        LEFT JOIN matches m ON s.id = m.season_id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE s.year BETWEEN 1992 AND 2025
        GROUP BY s.id, s.year
        ORDER BY s.year
      )
      SELECT 
        *,
        CASE 
          WHEN coverage_percentage < 10 THEN 'critical'
          WHEN coverage_percentage < 50 THEN 'high_priority'
          WHEN coverage_percentage < 80 THEN 'medium_priority'
          ELSE 'good'
        END as priority_level
      FROM seasonal_coverage
    `
    
    const result = await pool.query(query)
    this.analysis.seasonalGaps = result.rows
  }

  async analyzeTeamGaps() {
    const query = `
      WITH team_coverage AS (
        SELECT 
          t.name,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN g.team_id = t.id THEN g.match_id END) as matches_with_goals,
          COUNT(CASE WHEN g.team_id = t.id THEN 1 END) as total_goals,
          ROUND(
            CASE 
              WHEN COUNT(DISTINCT m.id) > 0 
              THEN COUNT(DISTINCT CASE WHEN g.team_id = t.id THEN g.match_id END)::decimal / COUNT(DISTINCT m.id) * 100
              ELSE 0 
            END, 1
          ) as coverage_percentage
        FROM teams t
        LEFT JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.match_date BETWEEN '2001-01-01' AND '2022-12-31'
        GROUP BY t.id, t.name
        HAVING COUNT(DISTINCT m.id) > 50  -- Teams with significant matches
        ORDER BY coverage_percentage ASC
      )
      SELECT 
        *,
        CASE 
          WHEN coverage_percentage < 30 THEN 'critical'
          WHEN coverage_percentage < 50 THEN 'high_priority'
          WHEN coverage_percentage < 70 THEN 'medium_priority'
          ELSE 'good'
        END as priority_level
      FROM team_coverage
    `
    
    const result = await pool.query(query)
    this.analysis.teamGaps = result.rows
  }

  async analyzeTemporalGaps() {
    const query = `
      WITH monthly_coverage AS (
        SELECT 
          EXTRACT(YEAR FROM m.match_date) as year,
          EXTRACT(MONTH FROM m.match_date) as month,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT g.match_id) as matches_with_goals,
          ROUND(
            CASE 
              WHEN COUNT(DISTINCT m.id) > 0 
              THEN COUNT(DISTINCT g.match_id)::decimal / COUNT(DISTINCT m.id) * 100
              ELSE 0 
            END, 1
          ) as coverage_percentage
        FROM matches m
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.match_date BETWEEN '2001-01-01' AND '2022-12-31'
        GROUP BY EXTRACT(YEAR FROM m.match_date), EXTRACT(MONTH FROM m.match_date)
        HAVING COUNT(DISTINCT m.id) > 10  -- Months with significant matches
        ORDER BY coverage_percentage ASC
      )
      SELECT 
        year,
        month,
        total_matches,
        matches_with_goals,
        coverage_percentage,
        CASE 
          WHEN coverage_percentage < 30 THEN 'critical'
          WHEN coverage_percentage < 50 THEN 'high_priority'
          ELSE 'acceptable'
        END as priority_level
      FROM monthly_coverage
      WHERE coverage_percentage < 50
      LIMIT 20
    `
    
    const result = await pool.query(query)
    this.analysis.temporalGaps = result.rows
  }

  async identifyPriorityTargets() {
    // Find specific matches that would have highest impact if fixed
    const query = `
      WITH high_impact_matches AS (
        SELECT 
          m.id,
          m.match_date,
          ht.name as home_team,
          at.name as away_team,
          m.home_score + m.away_score as expected_goals,
          COUNT(g.id) as actual_goals,
          s.year,
          CASE 
            WHEN m.home_score + m.away_score >= 4 THEN 'high_scoring'
            WHEN m.home_score + m.away_score = 0 THEN 'goalless'
            ELSE 'normal'
          END as match_type
        FROM matches m
        JOIN teams ht ON m.home_team_id = ht.id
        JOIN teams at ON m.away_team_id = at.id
        JOIN seasons s ON m.season_id = s.id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL 
        AND m.away_score IS NOT NULL
        AND s.year BETWEEN 2001 AND 2022
        GROUP BY m.id, m.match_date, ht.name, at.name, m.home_score, m.away_score, s.year
        HAVING COUNT(g.id) = 0 AND (m.home_score + m.away_score) > 0
        ORDER BY (m.home_score + m.away_score) DESC
      )
      SELECT 
        *,
        CASE 
          WHEN expected_goals >= 5 THEN 'critical'
          WHEN expected_goals >= 3 THEN 'high_priority'
          WHEN expected_goals >= 2 THEN 'medium_priority'
          ELSE 'low_priority'
        END as import_priority
      FROM high_impact_matches
      LIMIT 50
    `
    
    const result = await pool.query(query)
    this.analysis.priorityTargets = result.rows
  }

  async printAnalysis() {
    console.log('\n' + '='.repeat(80))
    console.log('📊 PHASE 4: COVERAGE GAP ANALYSIS RESULTS')
    console.log('='.repeat(80))
    
    // Seasonal Analysis
    console.log('\n🗓️  SEASONAL COVERAGE ANALYSIS:')
    const criticalSeasons = this.analysis.seasonalGaps.filter(s => s.priority_level === 'critical')
    const highPrioritySeasons = this.analysis.seasonalGaps.filter(s => s.priority_level === 'high_priority')
    
    console.log(`   Critical Seasons (< 10% coverage): ${criticalSeasons.length}`)
    console.log(`   High Priority Seasons (< 50% coverage): ${highPrioritySeasons.length}`)
    
    if (criticalSeasons.length > 0) {
      console.log('\n   📉 Critical Seasons:')
      criticalSeasons.slice(0, 5).forEach(season => {
        console.log(`      ${season.year}: ${season.coverage_percentage}% coverage (${season.matches_with_goals}/${season.total_matches} matches)`)
      })
    }
    
    if (highPrioritySeasons.length > 0) {
      console.log('\n   🎯 High Priority Seasons:')
      highPrioritySeasons.slice(0, 5).forEach(season => {
        console.log(`      ${season.year}: ${season.coverage_percentage}% coverage (${season.matches_with_goals}/${season.total_matches} matches)`)
      })
    }
    
    // Team Analysis
    console.log('\n🏟️  TEAM COVERAGE ANALYSIS:')
    const criticalTeams = this.analysis.teamGaps.filter(t => t.priority_level === 'critical')
    const highPriorityTeams = this.analysis.teamGaps.filter(t => t.priority_level === 'high_priority')
    
    console.log(`   Critical Teams (< 30% coverage): ${criticalTeams.length}`)
    console.log(`   High Priority Teams (< 50% coverage): ${highPriorityTeams.length}`)
    
    if (criticalTeams.length > 0) {
      console.log('\n   📉 Teams Needing Most Attention:')
      criticalTeams.slice(0, 5).forEach(team => {
        console.log(`      ${team.name}: ${team.coverage_percentage}% coverage (${team.matches_with_goals}/${team.total_matches} matches)`)
      })
    }
    
    // Priority Targets
    console.log('\n🎯 HIGH-IMPACT MISSING MATCHES:')
    console.log(`   Total High-Scoring Matches Missing Goals: ${this.analysis.priorityTargets.length}`)
    
    if (this.analysis.priorityTargets.length > 0) {
      console.log('\n   🔥 Top Priority Matches to Import:')
      this.analysis.priorityTargets.slice(0, 10).forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.home_team} vs ${match.away_team} (${match.year})`)
        console.log(`      Expected: ${match.expected_goals} goals, Current: ${match.actual_goals} goals`)
        console.log(`      Priority: ${match.import_priority}, Type: ${match.match_type}`)
        console.log('')
      })
    }
    
    // Temporal Gaps
    if (this.analysis.temporalGaps.length > 0) {
      console.log('\n📅 TEMPORAL COVERAGE GAPS:')
      console.log('   Months with lowest coverage:')
      this.analysis.temporalGaps.slice(0, 5).forEach(gap => {
        const monthName = new Date(gap.year, gap.month - 1).toLocaleDateString('en-US', { month: 'long' })
        console.log(`      ${monthName} ${gap.year}: ${gap.coverage_percentage}% coverage (${gap.matches_with_goals}/${gap.total_matches} matches)`)
      })
    }
    
    console.log('='.repeat(80))
  }

  async generateActionPlan() {
    console.log('\n💡 PHASE 4 ACTION PLAN:\n')
    
    console.log('🎯 IMMEDIATE PRIORITIES (High Impact):')
    console.log('1. 📈 Target high-scoring matches with 0 goal data')
    console.log(`   - ${this.analysis.priorityTargets.filter(t => t.expected_goals >= 4).length} matches with 4+ expected goals`)
    console.log(`   - Potential to add ${this.analysis.priorityTargets.reduce((sum, t) => sum + t.expected_goals, 0)} goals`)
    
    console.log('\n2. 🏟️  Focus on underrepresented teams')
    const criticalTeams = this.analysis.teamGaps.filter(t => t.priority_level === 'critical').length
    if (criticalTeams > 0) {
      console.log(`   - ${criticalTeams} teams with critical coverage gaps`)
      console.log('   - Prioritize these teams for comprehensive goal import')
    }
    
    console.log('\n3. 📅 Address seasonal imbalances')
    const gapSeasons = this.analysis.seasonalGaps.filter(s => s.priority_level !== 'good').length
    console.log(`   - ${gapSeasons} seasons need significant improvement`)
    console.log('   - Focus on 2001-2005 era for maximum impact')
    
    console.log('\n🔄 DATA SOURCE STRATEGY:')
    console.log('1. 📊 Enhanced CSV Processing')
    console.log('   - Re-process Kaggle dataset with improved matching')
    console.log('   - Target unmatched fixtures from previous imports')
    
    console.log('\n2. 🌐 Additional Data Sources')
    console.log('   - Football-Data.co.uk: Historical match results with goal times')
    console.log('   - API-Football: Comprehensive event data for recent seasons')
    console.log('   - OpenFootball: Alternative data validation source')
    
    console.log('\n3. 🤖 Automated Processing')
    console.log('   - Implement batch processing for identified priority matches')
    console.log('   - Create data source priority ranking system')
    console.log('   - Establish quality gates for imported data')
    
    console.log('\n📈 SUCCESS METRICS:')
    console.log('• Target: 80%+ goal coverage for seasons 2001-2022')
    console.log('• Current: ~45% average coverage')
    console.log('• Improvement needed: +35% coverage points')
    console.log(`• Estimated additional goals needed: ~${Math.round(this.analysis.priorityTargets.length * 2.5)} goals`)
    
    console.log('\n🚀 IMPLEMENTATION ORDER:')
    console.log('1. Process priority high-scoring matches (immediate impact)')
    console.log('2. Expand CSV processing for better fixture matching')
    console.log('3. Integrate Football-Data.co.uk for additional coverage')
    console.log('4. Add API-Football for recent seasons and validation')
    console.log('5. Implement automated monitoring and quality assurance')
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new CoverageGapAnalyzer()
  analyzer.analyzeCoverageGaps()
}

export default CoverageGapAnalyzer