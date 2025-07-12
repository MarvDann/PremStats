#!/usr/bin/env node

import 'dotenv/config'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function cleanNationalities() {
  const spinner = ora('Starting nationality cleanup...').start()
  
  try {
    // Get all unique nationality formats
    const nationalitiesResult = await pool.query(`
      SELECT DISTINCT nationality, COUNT(*) as count 
      FROM players 
      WHERE nationality IS NOT NULL 
      GROUP BY nationality 
      ORDER BY count DESC
    `)
    
    spinner.succeed(`Found ${nationalitiesResult.rows.length} unique nationality formats`)
    
    let totalUpdated = 0
    let alreadyClean = 0
    
    console.log(chalk.blue('\n🧹 Processing nationality formats...'))
    
    for (const row of nationalitiesResult.rows) {
      const originalNationality = row.nationality
      const cleanedNationality = cleanNationalityString(originalNationality)
      const count = parseInt(row.count)
      
      if (originalNationality !== cleanedNationality) {
        // Update this nationality format
        const updateResult = await pool.query(
          'UPDATE players SET nationality = $1 WHERE nationality = $2',
          [cleanedNationality, originalNationality]
        )
        
        console.log(chalk.green(`  ✅ "${originalNationality}" → "${cleanedNationality}" (${count} players)`))
        totalUpdated += count
      } else {
        console.log(chalk.gray(`  ✓ "${originalNationality}" already clean (${count} players)`))
        alreadyClean += count
      }
    }
    
    console.log(chalk.bold('\n📊 Cleanup Summary:'))
    console.log(chalk.green(`• Players updated: ${totalUpdated}`))
    console.log(chalk.gray(`• Already clean: ${alreadyClean}`))
    
    // Show sample of cleaned results
    const sampleResult = await pool.query(`
      SELECT name, nationality 
      FROM players 
      WHERE nationality IS NOT NULL AND nationality LIKE '%,%'
      ORDER BY name 
      LIMIT 10
    `)
    
    if (sampleResult.rows.length > 0) {
      console.log(chalk.blue('\n🎯 Sample of multi-nationality players:'))
      sampleResult.rows.forEach(player => {
        console.log(chalk.cyan(`  • ${player.name}: ${player.nationality}`))
      })
    }
    
    // Show final nationality distribution
    const finalResult = await pool.query(`
      SELECT nationality, COUNT(*) as count 
      FROM players 
      WHERE nationality IS NOT NULL 
      GROUP BY nationality 
      ORDER BY count DESC 
      LIMIT 10
    `)
    
    console.log(chalk.blue('\n🏆 Top 10 Nationalities (after cleanup):'))
    finalResult.rows.forEach((row, index) => {
      const emoji = index < 3 ? '🥇🥈🥉'[index] : '⚽'
      console.log(chalk.yellow(`${emoji} ${row.nationality}: ${row.count} players`))
    })
    
    spinner.succeed(chalk.green('🎉 Nationality cleanup completed successfully!'))
    
  } catch (error) {
    spinner.fail(chalk.red(`Cleanup failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

function cleanNationalityString(nationality) {
  if (!nationality || typeof nationality !== 'string') {
    return nationality
  }
  
  // Remove surrounding brackets and quotes
  let cleaned = nationality.replace(/^\[|\]$/g, '').trim()
  
  // Split by comma and clean each nationality
  const nationalities = cleaned.split(',').map(nat => {
    // Remove quotes and extra whitespace
    return nat.replace(/['"]/g, '').trim()
  }).filter(nat => nat.length > 0) // Remove empty entries
  
  // Join back with comma and space
  return nationalities.join(', ')
}

// Test the cleaning function
function testCleaningFunction() {
  console.log(chalk.bold('🧪 Testing nationality cleaning function:'))
  
  const testCases = [
    "['England']",
    "['Brazil', 'Portugal']", 
    "['Ireland', 'England']",
    "England",
    "Brazil, Portugal",
    "['Northern Ireland']",
    "['England', 'Jamaica']",
    null,
    ""
  ]
  
  testCases.forEach(test => {
    const result = cleanNationalityString(test)
    const color = test !== result ? chalk.green : chalk.gray
    console.log(color(`  "${test}" → "${result}"`))
  })
  
  console.log('')
}

console.log(chalk.bold('🌍 Premier League Nationality Cleanup'))
console.log(chalk.gray('Cleaning nationality field formatting from ["Country"] to "Country"'))

testCleaningFunction()

cleanNationalities().then(() => {
  console.log(chalk.bold('\n✨ Nationality cleanup complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Nationality cleanup failed:'), error.message)
  process.exit(1)
})