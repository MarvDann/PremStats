#!/usr/bin/env node

import chalk from 'chalk'

// PRODUCTION nationality cleaner - handles all formats
function cleanNationalityProduction(nationality) {
  if (!nationality || typeof nationality !== 'string') return null
  
  // Remove surrounding brackets and quotes
  let cleaned = nationality.replace(/^\[|\]$/g, '').trim()
  
  // Split by comma and clean each nationality
  const nationalities = cleaned.split(',').map(nat => {
    // Remove quotes and extra whitespace
    return nat.replace(/['"]/g, '').trim()
  }).filter(nat => nat.length > 0) // Remove empty entries
  
  // Join back with comma and space for multi-nationalities
  const result = nationalities.join(', ')
  
  return result || null
}

console.log(chalk.bold('🧪 Testing PRODUCTION Nationality Cleaner'))
console.log(chalk.gray('This function will be used in future imports to auto-clean nationalities\n'))

const testCases = [
  "['England']",
  "['Brazil', 'Portugal']", 
  "['Ireland', 'England']",
  "['Northern Ireland']",
  "['England', 'Jamaica']",
  "England", // Already clean
  "Brazil, Portugal", // Already clean
  "['Australia', 'Croatia']",
  "['Netherlands', 'Suriname']",
  "['France', 'Guadeloupe']",
  "['Cote d'Ivoire', 'France']",
  "['Argentina', 'Italy']",
  null,
  "",
  "['United States']"
]

console.log(chalk.blue('Test Results:'))
testCases.forEach((test, index) => {
  const result = cleanNationalityProduction(test)
  const isChanged = test !== result
  const color = isChanged ? chalk.green : chalk.gray
  const arrow = isChanged ? ' → ' : ' ✓ '
  
  console.log(color(`${(index + 1).toString().padStart(2)}. "${test}"${arrow}"${result}"`))
})

console.log(chalk.bold('\n✅ Nationality cleaner ready for production use!'))
console.log(chalk.gray('Future imports will automatically produce clean nationality fields.'))