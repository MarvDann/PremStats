#!/usr/bin/env node

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

// Test just the 1998 season to see corruption patterns
async function testCorruptionPatterns() {
  console.log(chalk.bold('🔍 Testing corruption patterns for 1998/99 season...'))
  
  const seasonPath = 'data/kaggle-premier-league/DATA_CSV/Season_1998'
  
  if (!fs.existsSync(seasonPath)) {
    console.log(chalk.red('Season 1998 directory not found'))
    return
  }
  
  const teamFiles = fs.readdirSync(seasonPath)
    .filter(file => file.endsWith('.csv'))
    .slice(0, 3) // Test just first 3 teams
  
  for (const teamFile of teamFiles) {
    const teamFilePath = path.join(seasonPath, teamFile)
    const teamName = teamFile.replace('.csv', '').split('_').slice(0, -2).join(' ')
    
    console.log(chalk.blue(`\n📋 Testing ${teamName} (${teamFile})`))
    
    try {
      const csvContent = fs.readFileSync(teamFilePath, 'utf8')
      const lines = csvContent.split('\n').filter(line => line.trim())
      
      console.log(chalk.gray(`   Total lines: ${lines.length}`))
      
      if (lines.length < 1) continue
      
      // Show header
      const headers = parseCSVLine(lines[0])
      console.log(chalk.gray(`   Headers (${headers.length}): ${headers.join(' | ')}`))
      
      const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name')
      console.log(chalk.gray(`   Name column at index: ${nameIndex}`))
      
      // Test first 5 data rows
      console.log(chalk.yellow(`\n   📊 Sample Data Rows:`))
      for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
        const values = parseCSVLine(lines[i])
        const name = values[nameIndex]
        const validation = validatePlayerNameDetailed(name)
        
        const status = validation.valid ? chalk.green('✅') : chalk.red('❌')
        console.log(`   ${status} Row ${i}: "${name}" | Columns: ${values.length} | ${validation.reason}`)
        
        if (!validation.valid) {
          console.log(chalk.gray(`      Raw line: ${lines[i].substring(0, 120)}${lines[i].length > 120 ? '...' : ''}`))
          console.log(chalk.gray(`      Parsed as: [${values.slice(0, 6).map(v => `"${v}"`).join(', ')}...]`))
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`   Error: ${error.message}`))
    }
  }
}

function parseCSVLine(line) {
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

function validatePlayerNameDetailed(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Name is null, undefined, or not a string' }
  }
  
  const originalName = name
  name = name.replace(/^"|"$/g, '').trim()
  
  if (name.length === 0) {
    return { valid: false, reason: 'Name is empty after cleaning' }
  }
  
  if (/^[A-Z][a-z]{2} \d{1,2}/.test(name)) {
    return { valid: false, reason: `Date pattern detected: "${name}"` }
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(name)) {
    return { valid: false, reason: `Date format MM/DD/YYYY: "${name}"` }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(name)) {
    return { valid: false, reason: `Date format YYYY-MM-DD: "${name}"` }
  }
  
  if (/^\d+$/.test(name)) {
    return { valid: false, reason: `Numbers only: "${name}"` }
  }
  
  if (!/[a-zA-ZÀ-ÿ]/.test(name)) {
    return { valid: false, reason: `No letters found: "${name}"` }
  }
  
  if (name.length < 2) {
    return { valid: false, reason: `Name too short: "${name}" (${name.length} characters)` }
  }
  
  return { valid: true, reason: 'Valid player name' }
}

testCorruptionPatterns().then(() => {
  console.log(chalk.bold('\n✨ Corruption pattern test complete!'))
}).catch(error => {
  console.error(chalk.red('\n💥 Test failed:'), error.message)
})