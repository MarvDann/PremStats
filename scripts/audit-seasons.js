#!/usr/bin/env node

import http from 'http'
import fs from 'fs'

const API_BASE = 'http://localhost:8081'

// Helper function to make API requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8081,
      path: url,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`))
        }
      })
    })

    req.on('error', (e) => {
      reject(e)
    })

    req.setTimeout(10000, () => {
      req.abort()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

// Get season name from season ID
function getSeasonName(seasonId) {
  const startYear = 1992 + (seasonId - 1)
  const endYear = startYear + 1
  return `${startYear}/${endYear.toString().slice(-2)}`
}

// Expected match counts based on season
function getExpectedMatches(seasonId) {
  // 1992/93 to 1994/95 had 22 teams = 462 matches
  // 1995/96 onwards had 20 teams = 380 matches
  return seasonId <= 3 ? 462 : 380
}

// Analyze date corruption patterns
function analyzeDateCorruption(matches, seasonId) {
  if (!matches || matches.length === 0) {
    return { corrupted: false, reason: 'No matches to analyze' }
  }

  const seasonName = getSeasonName(seasonId)
  const expectedStartYear = 1992 + (seasonId - 1)
  const expectedEndYear = expectedStartYear + 1

  const dates = matches.map(m => new Date(m.date)).filter(d => !isNaN(d.getTime()))
  
  if (dates.length === 0) {
    return { corrupted: true, reason: 'No valid dates found' }
  }

  const years = dates.map(d => d.getFullYear())
  const uniqueYears = [...new Set(years)]
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  // Check if dates make sense for the season
  const expectedYears = [expectedStartYear, expectedEndYear]
  const hasExpectedYears = expectedYears.some(year => uniqueYears.includes(year))
  
  // Check for common corruption patterns
  const all2020 = uniqueYears.length === 1 && uniqueYears[0] === 2020
  const yearTooFarOff = Math.abs(minYear - expectedStartYear) > 2
  
  if (all2020) {
    return { corrupted: true, reason: 'All dates show 2020 (data corruption)' }
  }
  
  if (yearTooFarOff && !hasExpectedYears) {
    return { corrupted: true, reason: `Dates in ${minYear}-${maxYear}, expected ${expectedStartYear}-${expectedEndYear}` }
  }

  if (!hasExpectedYears) {
    return { corrupted: true, reason: `No matches in expected years ${expectedStartYear}-${expectedEndYear}` }
  }

  return { corrupted: false, reason: 'Dates appear correct' }
}

// Main audit function
async function auditSeason(seasonId) {
  try {
    console.log(`\n🔍 Auditing Season ${seasonId} (${getSeasonName(seasonId)})...`)
    
    const response = await makeRequest(`/api/v1/matches?season=${seasonId}&limit=1000`)
    const matches = response.matches || []
    
    const matchCount = matches.length
    const expectedCount = getExpectedMatches(seasonId)
    const seasonName = getSeasonName(seasonId)
    
    let dateRange = 'No matches'
    let earliestDate = null
    let latestDate = null
    
    if (matches.length > 0) {
      const dates = matches.map(m => new Date(m.date)).filter(d => !isNaN(d.getTime()))
      if (dates.length > 0) {
        dates.sort((a, b) => a - b)
        earliestDate = dates[0]
        latestDate = dates[dates.length - 1]
        dateRange = `${earliestDate.toISOString().split('T')[0]} to ${latestDate.toISOString().split('T')[0]}`
      }
    }
    
    const dateAnalysis = analyzeDateCorruption(matches, seasonId)
    
    // Categorize the season
    let category = '✅ Good'
    let issues = []
    
    if (dateAnalysis.corrupted) {
      category = '❌ Corrupted'
      issues.push(`Date corruption: ${dateAnalysis.reason}`)
    }
    
    const countDiff = Math.abs(matchCount - expectedCount)
    const countTolerance = expectedCount * 0.1 // 10% tolerance
    
    if (countDiff > countTolerance) {
      if (category === '✅ Good') category = '⚠️ Suspicious'
      if (category === '❌ Corrupted') category = '❌ Corrupted'
      issues.push(`Match count: ${matchCount} (expected ~${expectedCount})`)
    }
    
    if (matchCount === 0) {
      category = '❌ Corrupted'
      issues.push('No matches found')
    }
    
    return {
      seasonId,
      seasonName,
      matchCount,
      expectedCount,
      dateRange,
      earliestDate,
      latestDate,
      category,
      issues,
      dateAnalysis
    }
    
  } catch (error) {
    console.error(`❌ Error auditing season ${seasonId}:`, error.message)
    return {
      seasonId,
      seasonName: getSeasonName(seasonId),
      matchCount: 0,
      expectedCount: getExpectedMatches(seasonId),
      dateRange: 'Error',
      earliestDate: null,
      latestDate: null,
      category: '❌ Corrupted',
      issues: [`API Error: ${error.message}`],
      dateAnalysis: { corrupted: true, reason: `API Error: ${error.message}` }
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive season audit...')
  console.log('=' * 60)
  
  const results = []
  
  // Test all 34 seasons
  for (let seasonId = 1; seasonId <= 34; seasonId++) {
    const result = await auditSeason(seasonId)
    results.push(result)
    
    // Brief pause to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // Generate summary report
  console.log('\n' + '=' * 60)
  console.log('📊 COMPREHENSIVE SEASON AUDIT REPORT')
  console.log('=' * 60)
  
  // Summary statistics
  const good = results.filter(r => r.category === '✅ Good')
  const suspicious = results.filter(r => r.category === '⚠️ Suspicious')
  const corrupted = results.filter(r => r.category === '❌ Corrupted')
  
  console.log(`\n📈 SUMMARY STATISTICS:`)
  console.log(`✅ Good seasons: ${good.length}`)
  console.log(`⚠️ Suspicious seasons: ${suspicious.length}`)
  console.log(`❌ Corrupted seasons: ${corrupted.length}`)
  console.log(`📊 Total seasons audited: ${results.length}`)
  
  // Detailed results
  console.log(`\n📋 DETAILED RESULTS:`)
  console.log(`${'ID'.padEnd(3)} | ${'Season'.padEnd(7)} | ${'Matches'.padEnd(7)} | ${'Expected'.padEnd(8)} | ${'Date Range'.padEnd(25)} | ${'Status'.padEnd(12)} | Issues`)
  console.log('-'.repeat(90))
  
  results.forEach(r => {
    const issues = r.issues.length > 0 ? r.issues.join('; ') : 'None'
    console.log(`${r.seasonId.toString().padEnd(3)} | ${r.seasonName.padEnd(7)} | ${r.matchCount.toString().padEnd(7)} | ${r.expectedCount.toString().padEnd(8)} | ${r.dateRange.padEnd(25)} | ${r.category.padEnd(12)} | ${issues}`)
  })
  
  // Category breakdowns
  if (corrupted.length > 0) {
    console.log(`\n❌ CORRUPTED SEASONS (${corrupted.length}):`)
    corrupted.forEach(r => {
      console.log(`   ${r.seasonId} (${r.seasonName}): ${r.issues.join(', ')}`)
    })
  }
  
  if (suspicious.length > 0) {
    console.log(`\n⚠️ SUSPICIOUS SEASONS (${suspicious.length}):`)
    suspicious.forEach(r => {
      console.log(`   ${r.seasonId} (${r.seasonName}): ${r.issues.join(', ')}`)
    })
  }
  
  if (good.length > 0) {
    console.log(`\n✅ GOOD SEASONS (${good.length}):`)
    good.forEach(r => {
      console.log(`   ${r.seasonId} (${r.seasonName}): ${r.matchCount} matches, ${r.dateRange}`)
    })
  }
  
  // Save detailed report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      good: good.length,
      suspicious: suspicious.length,
      corrupted: corrupted.length
    },
    seasons: results
  }
  
  fs.writeFileSync('/home/marvdann/projects/PremStats/season-audit-report.json', JSON.stringify(reportData, null, 2))
  console.log(`\n💾 Detailed report saved to: season-audit-report.json`)
  
  console.log('\n🎯 RECOMMENDATIONS:')
  if (corrupted.length > 0) {
    console.log(`❌ ${corrupted.length} seasons need complete re-import`)
  }
  if (suspicious.length > 0) {
    console.log(`⚠️ ${suspicious.length} seasons need investigation`)
  }
  if (good.length > 0) {
    console.log(`✅ ${good.length} seasons have reliable data`)
  }
}

// Run the audit
main().catch(console.error)