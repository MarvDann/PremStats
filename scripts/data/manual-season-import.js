#!/usr/bin/env node

import { HistoricalCSVScraper } from '../agents/data/historical-csv-scraper.js'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

const scraper = new HistoricalCSVScraper(pool)

async function importFullSeason(seasonName) {
  const spinner = ora(`Importing full season: ${seasonName}`).start()
  
  try {
    // Get season from database
    const seasonQuery = 'SELECT id, name FROM seasons WHERE name = $1'
    const seasonResult = await pool.query(seasonQuery, [seasonName])
    
    if (seasonResult.rows.length === 0) {
      spinner.fail(`Season ${seasonName} not found in database`)
      return
    }
    
    const season = seasonResult.rows[0]
    
    // Check existing matches
    const existingQuery = 'SELECT COUNT(*) as count FROM matches WHERE season_id = $1'
    const existingResult = await pool.query(existingQuery, [season.id])
    const existingCount = existingResult.rows[0].count
    
    if (existingCount > 0) {
      spinner.warn(`Season ${seasonName} already has ${existingCount} matches. Skipping.`)
      return
    }
    
    // Download CSV data
    const seasonCode = scraper.getSeasonCode(seasonName)
    const csvData = await scraper.downloadCSV(seasonCode)
    
    spinner.text = `Importing ${csvData.length} matches for ${seasonName}...`
    
    // Store all matches
    const result = await scraper.storeMatches(csvData, season.id)
    
    if (result.failed > 0) {
      spinner.warn(`Season ${seasonName} imported with issues: ${result.stored} stored, ${result.failed} failed`)
    } else {
      spinner.succeed(`Season ${seasonName} imported successfully: ${result.stored} matches`)
    }
    
    return result
    
  } catch (error) {
    spinner.fail(`Failed to import season ${seasonName}: ${error.message}`)
    console.error(error)
    throw error
  }
}

// Get season from command line
const season = process.argv[2]

if (!season) {
  console.log(chalk.red('Usage: node manual-season-import.js <season>'))
  console.log(chalk.gray('Example: node manual-season-import.js "2007/08"'))
  process.exit(1)
}

console.log(chalk.bold('🏆 Manual Season Import'))
importFullSeason(season).then(() => {
  console.log(chalk.bold('\n✨ Import complete'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Import failed:'), error.message)
  process.exit(1)
})