#!/usr/bin/env node

/**
 * 6 Sigma Root Cause Analysis
 * Identify why our data imports are failing systematically
 */

import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class RootCauseAnalysis {
  constructor() {
    this.defects = []
  }

  async analyzeRootCauses() {
    console.log('🔍 6 SIGMA ROOT CAUSE ANALYSIS')
    console.log('=' .repeat(60))
    console.log('')
    
    try {
      // 1. Analyze CSV data availability
      await this.analyzeDataSources()
      
      // 2. Check import script execution history
      await this.checkImportHistory()
      
      // 3. Analyze data pipeline failures
      await this.analyzePipelineFailures()
      
      // 4. Database schema validation
      await this.validateDatabaseSchema()
      
      // 5. Generate action plan
      await this.generateActionPlan()
      
    } catch (error) {
      console.error('❌ Root cause analysis failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async analyzeDataSources() {
    console.log('📁 DATA SOURCE AVAILABILITY:')
    
    // Check for CSV files
    const csvPaths = [
      'data/processed/matches/matches-fixed.csv',
      'data/kaggle/matches-events.csv',
      'data/raw/matches.csv'
    ]
    
    for (const path of csvPaths) {
      if (fs.existsSync(path)) {
        const stats = fs.statSync(path)
        const lines = fs.readFileSync(path, 'utf-8').split('\n').length
        console.log(`   ✅ ${path}: ${lines} lines, ${(stats.size / 1024 / 1024).toFixed(1)}MB`)
      } else {
        console.log(`   ❌ ${path}: Missing`)
        this.defects.push(`Missing data file: ${path}`)
      }
    }
    console.log('')
  }

  async checkImportHistory() {
    console.log('📊 IMPORT EXECUTION ANALYSIS:')
    
    // Check what data actually got imported and when
    const importStats = await pool.query(`
      WITH import_analysis AS (
        SELECT 
          DATE(created_at) as import_date,
          COUNT(*) as goals_imported,
          COUNT(DISTINCT match_id) as matches_affected
        FROM goals
        WHERE created_at IS NOT NULL
        GROUP BY DATE(created_at)
        ORDER BY import_date DESC
      )
      SELECT * FROM import_analysis
      LIMIT 10
    `)
    
    if (importStats.rows.length === 0) {
      console.log('   ❌ No import timestamps found - goals table missing created_at data')
      this.defects.push('No import audit trail')
    } else {
      console.log('   Recent imports:')
      for (const stat of importStats.rows) {
        console.log(`   ${stat.import_date}: ${stat.goals_imported} goals, ${stat.matches_affected} matches`)
      }
    }
    console.log('')
  }

  async analyzePipelineFailures() {
    console.log('🔧 PIPELINE FAILURE ANALYSIS:')
    
    // Find specific failure patterns
    const failures = await pool.query(`
      WITH failure_analysis AS (
        SELECT 
          s.year,
          COUNT(m.id) as total_matches,
          COUNT(CASE WHEN m.home_score + m.away_score > 0 THEN m.id END) as matches_with_scores,
          COUNT(g.match_id) as matches_with_goals,
          COUNT(CASE WHEN m.home_score + m.away_score > 0 AND g.match_id IS NULL THEN m.id END) as failed_imports
        FROM seasons s
        JOIN matches m ON s.id = m.season_id
        LEFT JOIN goals g ON m.id = g.match_id
        WHERE m.home_score IS NOT NULL AND m.away_score IS NOT NULL
        GROUP BY s.id, s.year
        ORDER BY s.year
      )
      SELECT 
        year,
        total_matches,
        matches_with_scores,
        matches_with_goals,
        failed_imports,
        ROUND(failed_imports::decimal / matches_with_scores * 100, 1) as failure_rate
      FROM failure_analysis
      WHERE matches_with_scores > 0
    `)
    
    console.log('   Failure rates by season:')
    let totalFailures = 0
    let totalMatches = 0
    
    for (const failure of failures.rows) {
      const status = failure.failure_rate > 80 ? '🚨' : failure.failure_rate > 50 ? '⚠️' : '🔄'
      console.log(`   ${status} ${failure.year}: ${failure.failure_rate}% failure rate (${failure.failed_imports}/${failure.matches_with_scores} matches)`)
      totalFailures += parseInt(failure.failed_imports)
      totalMatches += parseInt(failure.matches_with_scores)
    }
    
    const overallFailureRate = ((totalFailures / totalMatches) * 100).toFixed(1)
    console.log(`   📊 Overall failure rate: ${overallFailureRate}% (${totalFailures}/${totalMatches})`)
    
    if (parseFloat(overallFailureRate) > 50) {
      this.defects.push(`Critical import failure rate: ${overallFailureRate}%`)
    }
    console.log('')
  }

  async validateDatabaseSchema() {
    console.log('🗄️ DATABASE SCHEMA VALIDATION:')
    
    // Check for missing constraints and indexes
    const schemaCheck = await pool.query(`
      SELECT 
        table_name,
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns 
      WHERE table_name IN ('matches', 'goals', 'players', 'teams', 'seasons')
      AND table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `)
    
    // Check for foreign key constraints
    const constraintCheck = await pool.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_name IN ('matches', 'goals', 'players', 'teams', 'seasons')
      AND tc.table_schema = 'public'
      AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY')
      ORDER BY tc.table_name
    `)
    
    console.log('   Key constraints:')
    for (const constraint of constraintCheck.rows) {
      console.log(`   ${constraint.table_name}: ${constraint.constraint_type} (${constraint.constraint_name})`)
    }
    
    // Check for missing indexes on critical columns
    const indexCheck = await pool.query(`
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        array_to_string(array_agg(a.attname), ', ') as columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
      WHERE t.relname IN ('matches', 'goals', 'players', 'teams', 'seasons')
      GROUP BY t.relname, i.relname
      ORDER BY t.relname
    `)
    
    console.log('   Indexes:')
    for (const index of indexCheck.rows) {
      console.log(`   ${index.table_name}: ${index.index_name} (${index.columns})`)
    }
    console.log('')
  }

  async generateActionPlan() {
    console.log('🎯 ROOT CAUSE FINDINGS:')
    
    if (this.defects.length === 0) {
      console.log('   ✅ No critical defects found in infrastructure')
    } else {
      for (const defect of this.defects) {
        console.log(`   🚨 ${defect}`)
      }
    }
    console.log('')
    
    console.log('🔧 REQUIRED ACTIONS FOR 6 SIGMA QUALITY:')
    console.log('')
    
    console.log('1. 📁 DATA SOURCE VERIFICATION:')
    console.log('   - Verify all CSV files exist and contain valid data')
    console.log('   - Check data format consistency')
    console.log('   - Validate team name mappings')
    console.log('')
    
    console.log('2. 🔄 IMPORT PROCESS RECONSTRUCTION:')
    console.log('   - Build step-by-step import with validation at each stage')
    console.log('   - Implement automatic rollback on failure')
    console.log('   - Add comprehensive logging and error reporting')
    console.log('')
    
    console.log('3. ✅ VALIDATION FRAMEWORK:')
    console.log('   - Random sample testing (minimum 95% accuracy)')
    console.log('   - Score consistency validation (target: 99%+)')
    console.log('   - Comprehensive coverage reporting')
    console.log('')
    
    console.log('4. 🎯 SUCCESS CRITERIA (6 SIGMA STANDARDS):')
    console.log('   - 99.99966% accuracy on random samples')
    console.log('   - Zero tolerance for missing goal data')
    console.log('   - Complete audit trail for all data operations')
    console.log('   - Automated quality gates preventing regression')
    console.log('')
    
    console.log('🚨 IMMEDIATE NEXT STEPS:')
    console.log('1. Stop all "completion" claims')
    console.log('2. Identify and fix data source issues')
    console.log('3. Rebuild import pipeline with proper validation')
    console.log('4. Test with small samples before bulk processing')
    console.log('5. Implement continuous validation monitoring')
  }
}

// Execute root cause analysis
const analyzer = new RootCauseAnalysis()
analyzer.analyzeRootCauses()