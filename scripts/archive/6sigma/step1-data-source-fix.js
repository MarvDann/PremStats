#!/usr/bin/env node

/**
 * 6 Sigma Step 1: Data Source Reconstruction
 * Fix the fundamental data source issues identified
 */

import 'dotenv/config'
import fs from 'fs'
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

class DataSourceReconstruction {
  constructor() {
    this.validationResults = {
      dataFiles: [],
      sampleValidation: [],
      teamMappings: [],
      defects: []
    }
  }

  async reconstructDataSources() {
    console.log('🔧 6 SIGMA STEP 1: DATA SOURCE RECONSTRUCTION')
    console.log('=' .repeat(60))
    console.log('')
    
    try {
      // 1. Identify and validate data sources
      await this.identifyDataSources()
      
      // 2. Validate CSV data quality
      await this.validateCSVQuality()
      
      // 3. Test small sample import
      await this.testSampleImport()
      
      // 4. Generate quality report
      await this.generateQualityReport()
      
    } catch (error) {
      console.error('❌ Data source reconstruction failed:', error.message)
    } finally {
      await pool.end()
    }
  }

  async identifyDataSources() {
    console.log('📁 DATA SOURCE IDENTIFICATION:')
    
    // Check what CSV files we actually have
    const possiblePaths = [
      'data/processed/matches/matches-fixed.csv',
      'data/kaggle/matches.csv',
      'data/kaggle/events.csv',
      'data/raw/premier_league_matches.csv',
      'scripts/data/sample-data.csv'
    ]
    
    let validSources = []
    
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        const stats = fs.statSync(path)
        const content = fs.readFileSync(path, 'utf-8')
        const lines = content.split('\n').filter(line => line.trim())
        
        console.log(`   ✅ Found: ${path}`)
        console.log(`      Size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`)
        console.log(`      Lines: ${lines.length}`)
        
        // Check first few lines to understand format
        if (lines.length > 1) {
          console.log(`      Header: ${lines[0].substring(0, 100)}...`)
          console.log(`      Sample: ${lines[1].substring(0, 100)}...`)
        }
        
        validSources.push({
          path,
          lines: lines.length,
          size: stats.size,
          content: lines
        })
        console.log('')
      }
    }
    
    if (validSources.length === 0) {
      console.log('   ❌ CRITICAL: No valid CSV data sources found')
      this.validationResults.defects.push('No valid data sources')
      return
    }
    
    this.validationResults.dataFiles = validSources
    console.log(`   📊 Found ${validSources.length} valid data sources`)
    console.log('')
  }

  async validateCSVQuality() {
    console.log('🔍 CSV DATA QUALITY VALIDATION:')
    
    if (this.validationResults.dataFiles.length === 0) {
      console.log('   ❌ No data files to validate')
      return
    }
    
    // Focus on the main CSV file we found
    const mainFile = this.validationResults.dataFiles[0]
    console.log(`   Analyzing: ${mainFile.path}`)
    
    try {
      const lines = mainFile.content
      if (lines.length < 2) {
        console.log('   ❌ File has no data rows')
        this.validationResults.defects.push('Empty data file')
        return
      }
      
      // Parse header to understand column structure
      const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''))
      console.log(`   📊 Columns (${header.length}): ${header.slice(0, 10).join(', ')}...`)
      
      // Validate sample rows
      let validRows = 0
      let invalidRows = 0
      const sampleRows = lines.slice(1, 11) // Check first 10 data rows
      
      for (let i = 0; i < sampleRows.length; i++) {
        const row = sampleRows[i]
        const columns = this.parseCSVRow(row)
        
        if (columns.length === header.length) {
          validRows++
          console.log(`   ✅ Row ${i + 2}: ${columns.length} columns`)
        } else {
          invalidRows++
          console.log(`   ❌ Row ${i + 2}: ${columns.length}/${header.length} columns`)
          this.validationResults.defects.push(`Invalid row structure at line ${i + 2}`)
        }
      }
      
      const validationRate = (validRows / sampleRows.length * 100).toFixed(1)
      console.log(`   📈 Sample validation rate: ${validationRate}% (${validRows}/${sampleRows.length})`)
      
      if (parseFloat(validationRate) < 90) {
        this.validationResults.defects.push(`Low CSV validation rate: ${validationRate}%`)
      }
      
    } catch (error) {
      console.log(`   ❌ CSV parsing error: ${error.message}`)
      this.validationResults.defects.push(`CSV parsing error: ${error.message}`)
    }
    
    console.log('')
  }

  parseCSVRow(row) {
    const result = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  async testSampleImport() {
    console.log('🧪 SAMPLE IMPORT TEST:')
    
    if (this.validationResults.dataFiles.length === 0) {
      console.log('   ❌ No data files available for testing')
      return
    }
    
    const mainFile = this.validationResults.dataFiles[0]
    console.log(`   Testing with: ${mainFile.path}`)
    
    try {
      const lines = mainFile.content
      if (lines.length < 10) {
        console.log('   ❌ Insufficient data for meaningful test')
        return
      }
      
      // Test parsing 5 sample matches
      console.log('   Testing match data parsing:')
      const sampleMatches = []
      
      for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
        const row = lines[i]
        const columns = this.parseCSVRow(row)
        
        try {
          // Try to extract basic match information
          const matchData = this.extractMatchData(columns)
          if (matchData) {
            sampleMatches.push(matchData)
            console.log(`   ✅ Row ${i + 1}: ${matchData.homeTeam} vs ${matchData.awayTeam} (${matchData.date})`)
          } else {
            console.log(`   ❌ Row ${i + 1}: Could not parse match data`)
          }
        } catch (error) {
          console.log(`   ❌ Row ${i + 1}: Parse error - ${error.message}`)
        }
      }
      
      const parseRate = (sampleMatches.length / 5 * 100).toFixed(1)
      console.log(`   📈 Parse success rate: ${parseRate}% (${sampleMatches.length}/5)`)
      
      if (parseFloat(parseRate) < 80) {
        this.validationResults.defects.push(`Low parse success rate: ${parseRate}%`)
      }
      
      this.validationResults.sampleValidation = sampleMatches
      
    } catch (error) {
      console.log(`   ❌ Sample import test failed: ${error.message}`)
      this.validationResults.defects.push(`Sample import failed: ${error.message}`)
    }
    
    console.log('')
  }

  extractMatchData(columns) {
    // Try different column arrangements to find match data
    // This is flexible parsing to handle different CSV formats
    
    let homeTeam, awayTeam, date, homeScore, awayScore
    
    // Common patterns in football CSV files
    for (let i = 0; i < columns.length - 1; i++) {
      const col = columns[i]
      
      // Look for team names (usually strings)
      if (!homeTeam && col && col.length > 2 && /^[A-Za-z\s]+$/.test(col)) {
        homeTeam = col.trim()
        if (i + 1 < columns.length && columns[i + 1] && /^[A-Za-z\s]+$/.test(columns[i + 1])) {
          awayTeam = columns[i + 1].trim()
        }
      }
      
      // Look for dates
      if (!date && col && (col.includes('/') || col.includes('-') || col.includes(' '))) {
        if (col.length >= 8 && col.length <= 12) {
          date = col.trim()
        }
      }
      
      // Look for scores (usually single digits)
      if (!homeScore && col && /^\d+$/.test(col.trim())) {
        homeScore = parseInt(col.trim())
        if (i + 1 < columns.length && /^\d+$/.test(columns[i + 1].trim())) {
          awayScore = parseInt(columns[i + 1].trim())
        }
      }
    }
    
    if (homeTeam && awayTeam && date) {
      return {
        homeTeam,
        awayTeam,
        date,
        homeScore: homeScore || 0,
        awayScore: awayScore || 0
      }
    }
    
    return null
  }

  async generateQualityReport() {
    console.log('📊 DATA SOURCE QUALITY REPORT:')
    console.log('')
    
    // Summary of findings
    console.log('🎯 VALIDATION SUMMARY:')
    console.log(`   Data Files Found: ${this.validationResults.dataFiles.length}`)
    console.log(`   Sample Matches Parsed: ${this.validationResults.sampleValidation.length}`)
    console.log(`   Defects Identified: ${this.validationResults.defects.length}`)
    console.log('')
    
    if (this.validationResults.defects.length > 0) {
      console.log('🚨 CRITICAL DEFECTS:')
      for (const defect of this.validationResults.defects) {
        console.log(`   ❌ ${defect}`)
      }
      console.log('')
    }
    
    // Determine readiness for next step
    const hasValidData = this.validationResults.dataFiles.length > 0
    const goodParseRate = this.validationResults.sampleValidation.length >= 3
    const minimalDefects = this.validationResults.defects.length <= 2
    
    const readyForNextStep = hasValidData && goodParseRate && minimalDefects
    
    console.log('✅ READINESS ASSESSMENT:')
    console.log(`   Valid Data Sources: ${hasValidData ? '✅' : '❌'}`)
    console.log(`   Good Parse Rate: ${goodParseRate ? '✅' : '❌'}`)
    console.log(`   Minimal Defects: ${minimalDefects ? '✅' : '❌'}`)
    console.log('')
    
    if (readyForNextStep) {
      console.log('🚀 READY FOR STEP 2: Controlled Import Pipeline')
      console.log('')
      console.log('NEXT ACTIONS:')
      console.log('1. Build small-batch import with validation')
      console.log('2. Test with 10 matches before scaling')
      console.log('3. Implement rollback on any failure')
      console.log('4. Validate 100% accuracy before proceeding')
    } else {
      console.log('🛑 NOT READY - MUST FIX DATA SOURCES FIRST')
      console.log('')
      console.log('REQUIRED FIXES:')
      if (!hasValidData) console.log('- Obtain valid CSV data sources')
      if (!goodParseRate) console.log('- Fix CSV parsing issues')
      if (!minimalDefects) console.log('- Resolve data quality defects')
    }
  }
}

// Execute data source reconstruction
const reconstructor = new DataSourceReconstruction()
reconstructor.reconstructDataSources()