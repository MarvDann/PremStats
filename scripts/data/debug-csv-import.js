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

async function debugImport(seasonName) {
  console.log(chalk.bold(`\n🔍 Debug Import: ${seasonName}\n`))
  
  try {
    // Step 1: Check if season exists in database
    const seasonQuery = 'SELECT id, name FROM seasons WHERE name = $1'
    const seasonResult = await pool.query(seasonQuery, [seasonName])
    
    if (seasonResult.rows.length === 0) {
      console.log(chalk.red(`❌ Season ${seasonName} not found in database`))
      return
    }
    
    const season = seasonResult.rows[0]
    console.log(chalk.green(`✅ Season found: ID ${season.id}, Name: ${season.name}`))
    
    // Step 2: Check existing matches for this season
    const existingQuery = 'SELECT COUNT(*) as count FROM matches WHERE season_id = $1'
    const existingResult = await pool.query(existingQuery, [season.id])
    const existingCount = existingResult.rows[0].count
    
    console.log(chalk.blue(`📊 Existing matches: ${existingCount}`))
    
    // Step 3: Get season code for CSV
    const seasonCode = scraper.getSeasonCode(seasonName)
    console.log(chalk.blue(`📁 Season code: ${seasonCode}`))
    
    // Step 4: Test CSV download
    console.log(chalk.gray(`🌐 Testing CSV download...`))
    const url = `${scraper.baseUrl}/${seasonCode}/E0.csv`
    console.log(chalk.gray(`URL: ${url}`))
    
    try {
      const csvData = await scraper.downloadCSV(seasonCode)
      console.log(chalk.green(`✅ CSV downloaded: ${csvData.length} matches found`))
      
      // Show first few matches
      if (csvData.length > 0) {
        console.log(chalk.bold(`\n📋 First 3 matches:`))
        csvData.slice(0, 3).forEach((match, i) => {
          console.log(`  ${i + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.date})`)
          console.log(`     Score: ${match.homeScore}-${match.awayScore}`)
        })
      }
      
      // Step 5: Test team lookups
      console.log(chalk.bold(`\n🔍 Testing team lookups:`))
      const uniqueTeams = [...new Set([
        ...csvData.map(m => m.homeTeam),
        ...csvData.map(m => m.awayTeam)
      ])]
      
      let teamLookupErrors = 0
      for (const teamName of uniqueTeams.slice(0, 5)) { // Test first 5 teams
        try {
          const mappedName = scraper.mapTeamName(teamName)
          const teamQuery = 'SELECT id, name FROM teams WHERE name ILIKE $1 OR short_name ILIKE $1'
          const teamResult = await pool.query(teamQuery, [mappedName])
          
          if (teamResult.rows.length === 0) {
            console.log(chalk.red(`❌ Team not found: "${teamName}" -> "${mappedName}"`))
            teamLookupErrors++
          } else {
            console.log(chalk.green(`✅ Team found: "${teamName}" -> "${mappedName}" -> ID ${teamResult.rows[0].id}`))
          }
        } catch (error) {
          console.log(chalk.red(`❌ Team lookup error for "${teamName}": ${error.message}`))
          teamLookupErrors++
        }
      }
      
      if (teamLookupErrors > 0) {
        console.log(chalk.yellow(`\n⚠️  Found ${teamLookupErrors} team lookup issues`))
      }
      
      // Step 6: Try to import one match
      if (csvData.length > 0) {
        console.log(chalk.bold(`\n🧪 Testing single match import:`))
        const testMatch = csvData[0]
        
        try {
          const result = await scraper.storeMatches([testMatch], season.id)
          console.log(chalk.green(`✅ Test match imported: ${result.stored} stored, ${result.failed} failed`))
        } catch (error) {
          console.log(chalk.red(`❌ Test match import failed: ${error.message}`))
          console.log(chalk.gray(`Match data:`, JSON.stringify(testMatch, null, 2)))
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ CSV download failed: ${error.message}`))
    }
    
  } catch (error) {
    console.log(chalk.red(`❌ Debug import failed: ${error.message}`))
    console.error(error)
  }
}

// Get season from command line or default to 2006/07
const season = process.argv[2] || '2006/07'

console.log(chalk.bold('🐛 PremStats CSV Import Debugger'))
debugImport(season).then(() => {
  console.log(chalk.bold('\n✨ Debug complete'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Debug failed:'), error)
  process.exit(1)
})