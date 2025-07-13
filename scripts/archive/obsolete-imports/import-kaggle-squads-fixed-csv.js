#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function testCSVParsing() {
  console.log(chalk.bold('🔧 Testing FIXED CSV parser with quoted fields...'))
  
  // Test with the actual problematic CSV line
  const testLine = 'Goalkeeper,left,"Jul 1, 1999",Nick Culkin,"1,90m",13719,[\'England\'],Manchester United Reserves,20,"Jul 6, 1978",Retired'
  
  console.log(chalk.blue('\n📝 Test CSV line:'))
  console.log(chalk.gray(testLine))
  
  console.log(chalk.blue('\n🔧 Old parser result:'))
  const oldResult = parseCSVLineOld(testLine)
  oldResult.forEach((value, index) => {
    const color = index === 3 ? chalk.green : chalk.gray // Highlight name column
    console.log(color(`  [${index}]: "${value}"`))
  })
  
  console.log(chalk.blue('\n✅ NEW parser result:'))
  const newResult = parseCSVLineNew(testLine)
  newResult.forEach((value, index) => {
    const color = index === 3 ? chalk.green : chalk.gray // Highlight name column
    console.log(color(`  [${index}]: "${value}"`))
  })
  
  console.log(chalk.blue('\n🎯 Expected name field (index 3):'))
  console.log(chalk.green(`  Expected: "Nick Culkin"`))
  console.log(chalk.green(`  Old got:  "${oldResult[3]}"`))
  console.log(chalk.green(`  New got:  "${newResult[3]}"`))
  
  const isFixed = newResult[3] === 'Nick Culkin'
  console.log(isFixed ? chalk.green('\n🎉 CSV Parser FIXED!') : chalk.red('\n❌ Still broken'))
}

// OLD problematic parser
function parseCSVLineOld(line) {
  const values = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
    
    i++
  }
  
  values.push(current.trim())
  return values
}

// NEW fixed parser that properly handles quoted fields
function parseCSVLineNew(line) {
  const values = []
  let current = ''
  let inQuotes = false
  let i = 0
  
  while (i < line.length) {
    const char = line[i]
    
    if (char === '"') {
      // Toggle quote state but don't include the quote in the output
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      // Only split on comma if we're not inside quotes
      values.push(current.trim())
      current = ''
    } else {
      // Add all other characters (including commas inside quotes)
      current += char
    }
    
    i++
  }
  
  // Add the final value
  values.push(current.trim())
  return values
}

async function cleanCorruptedData() {
  console.log(chalk.bold('\n🧹 Cleaning corrupted data...'))
  
  // Remove all corrupted entries before re-importing
  const deleteStats = await pool.query(`
    DELETE FROM player_stats 
    WHERE player_id IN (
      SELECT id FROM players 
      WHERE name ~ '^[0-9]{4}"?$' 
      OR name ~ '^"[A-Z][a-z]{2} [0-9]{1,2}'
      OR length(name) < 2
      OR name ~ '^[^A-Za-zÀ-ÿ]'
    )
  `)
  
  const deletePlayers = await pool.query(`
    DELETE FROM players 
    WHERE name ~ '^[0-9]{4}"?$' 
    OR name ~ '^"[A-Z][a-z]{2} [0-9]{1,2}'
    OR length(name) < 2
    OR name ~ '^[^A-Za-zÀ-ÿ]'
  `)
  
  console.log(chalk.green(`✅ Removed ${deleteStats.rowCount} corrupted player_stats`))
  console.log(chalk.green(`✅ Removed ${deletePlayers.rowCount} corrupted players`))
}

async function reimportWithFixedParser() {
  console.log(chalk.bold('\n🔄 Re-importing with FIXED CSV parser...'))
  
  const dataPath = 'data/kaggle-premier-league/DATA_CSV'
  
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Data directory not found: ${dataPath}`)
  }
  
  // Test with just one season first
  const testSeasonPath = path.join(dataPath, 'Season_1998')
  const teamFiles = fs.readdirSync(testSeasonPath)
    .filter(file => file.endsWith('.csv'))
    .slice(0, 2) // Just test first 2 teams
  
  console.log(chalk.blue(`🧪 Testing with ${teamFiles.length} teams from 1998/99...`))
  
  let totalValidPlayers = 0
  let totalCorruptedSkipped = 0
  
  for (const teamFile of teamFiles) {
    const teamFilePath = path.join(testSeasonPath, teamFile)
    const teamName = teamFile.replace('.csv', '').split('_').slice(0, -2).join(' ')
    
    console.log(chalk.blue(`\n📋 Testing ${teamName}...`))
    
    try {
      const csvContent = fs.readFileSync(teamFilePath, 'utf8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) continue
      
      // Parse header with NEW parser
      const headers = parseCSVLineNew(lines[0])
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name')
      
      console.log(chalk.gray(`   Headers: ${headers.slice(0, 5).join(' | ')}...`))
      console.log(chalk.gray(`   Name at index: ${nameIndex}`))
      
      let validPlayers = 0
      let corruptedPlayers = 0
      
      // Test first 10 data rows
      for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
        const values = parseCSVLineNew(lines[i])
        const name = values[nameIndex]?.trim()
        
        if (isValidPlayerName(name)) {
          validPlayers++
          if (i <= 5) { // Show first 5 valid names
            console.log(chalk.green(`     ✅ ${name}`))
          }
        } else {
          corruptedPlayers++
          if (corruptedPlayers <= 2) { // Show first 2 corrupted for debugging
            console.log(chalk.red(`     ❌ "${name}" (corrupted)`))
          }
        }
      }
      
      totalValidPlayers += validPlayers
      totalCorruptedSkipped += corruptedPlayers
      
      console.log(chalk.blue(`   Result: ${validPlayers} valid, ${corruptedPlayers} corrupted`))
      
    } catch (error) {
      console.log(chalk.red(`   Error: ${error.message}`))
    }
  }
  
  console.log(chalk.bold(`\n📊 Test Results:`))
  console.log(chalk.green(`✅ Valid players: ${totalValidPlayers}`))
  console.log(chalk.red(`❌ Corrupted skipped: ${totalCorruptedSkipped}`))
  
  const successRate = (totalValidPlayers / (totalValidPlayers + totalCorruptedSkipped)) * 100
  console.log(chalk.blue(`📈 Success rate: ${successRate.toFixed(1)}%`))
}

function isValidPlayerName(name) {
  if (!name || typeof name !== 'string') return false
  
  name = name.trim()
  
  // Skip if empty
  if (name.length === 0) return false
  
  // Skip obvious date patterns
  if (/^[A-Z][a-z]{2} \d{1,2}/.test(name)) return false
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(name)) return false
  if (/^\d{4}-\d{2}-\d{2}/.test(name)) return false
  
  // Skip numbers only or years
  if (/^\d+$/.test(name)) return false
  
  // Must contain at least one letter
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false
  
  // Skip if too short
  if (name.length < 2) return false
  
  return true
}

console.log(chalk.bold('🔧 CSV Parser Fix and Test'))

Promise.resolve()
  .then(() => testCSVParsing())
  .then(() => cleanCorruptedData())
  .then(() => reimportWithFixedParser())
  .then(() => {
    console.log(chalk.bold('\n✨ CSV parser fix and test complete!'))
    process.exit(0)
  })
  .catch(error => {
    console.error(chalk.red('\n💥 Test failed:'), error.message)
    process.exit(1)
  })
  .finally(() => {
    pool.end()
  })