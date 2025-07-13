#!/usr/bin/env node

import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables from .env file in project root
dotenv.config({ path: '../../.env' })

async function testDataBoundaries() {
  console.log('🔍 TESTING FOOTBALL-DATA.ORG DATA BOUNDARIES')
  console.log('==============================================')
  
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) {
    console.log('❌ No API key found!')
    return
  }
  
  console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`)
  
  // Test different time periods to find boundaries
  const testPeriods = [
    { name: '2024/25 (Current)', year: 2024 },
    { name: '2023/24 (Recent)', year: 2023 },
    { name: '2022/23 (2 years ago)', year: 2022 },
    { name: '2021/22 (3 years ago)', year: 2021 },
    { name: '2020/21 (4 years ago)', year: 2020 },
    { name: '2019/20 (5 years ago)', year: 2019 },
    { name: '2018/19 (6 years ago)', year: 2018 },
    { name: '2015/16 (9 years ago)', year: 2015 },
    { name: '2010/11 (14 years ago)', year: 2010 },
    { name: '2005/06 (19 years ago)', year: 2005 },
    { name: '2000/01 (24 years ago)', year: 2000 },
    { name: '1995/96 (29 years ago)', year: 1995 },
    { name: '1992/93 (FIRST PL)', year: 1992 },
    { name: '1990/91 (Pre-PL)', year: 1990 },
    { name: '1985/86 (40 years ago)', year: 1985 },
    { name: '1980/81 (45 years ago)', year: 1980 },
    { name: '1975/76 (50 years ago)', year: 1975 },
    { name: '1970/71 (55 years ago)', year: 1970 },
  ]
  
  const results = []
  
  for (const period of testPeriods) {
    try {
      console.log(`\\n🧪 Testing ${period.name}...`)
      
      // Wait for rate limiting
      await new Promise(resolve => setTimeout(resolve, 2100))
      
      const url = `https://api.football-data.org/v4/competitions/PL/matches?season=${period.year}&limit=1`
      const response = await fetch(url, {
        headers: {
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const matchCount = data.matches?.length || 0
        const resultCount = data.resultSet?.count || data.count || 'Unknown'
        
        console.log(`✅ ${period.name}: ${matchCount} matches returned (Total: ${resultCount})`)
        
        // Test match detail if matches exist
        if (data.matches?.[0]) {
          const match = data.matches[0]
          console.log(`   Sample: ${match.homeTeam?.name} vs ${match.awayTeam?.name} on ${new Date(match.utcDate).toDateString()}`)
          
          // Test match detail endpoint for goals
          await new Promise(resolve => setTimeout(resolve, 2100))
          const detailUrl = `https://api.football-data.org/v4/matches/${match.id}`
          const detailResponse = await fetch(detailUrl, {
            headers: {
              'X-Auth-Token': apiKey,
              'Content-Type': 'application/json'
            }
          })
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json()
            const goalCount = detailData.goals?.length || 0
            console.log(`   ⚽ Match detail available: ${goalCount} goals`)
            
            if (goalCount > 0) {
              const sampleGoal = detailData.goals[0]
              console.log(`   📝 Sample goal: ${sampleGoal.minute}' ${sampleGoal.scorer?.name} (${sampleGoal.team?.name})`)
            }
          } else {
            console.log(`   ⚠️ Match detail failed: ${detailResponse.status}`)
          }
        }
        
        results.push({
          period: period.name,
          year: period.year,
          status: 'SUCCESS',
          matches: matchCount,
          total: resultCount
        })
        
      } else {
        const errorText = await response.text()
        console.log(`❌ ${period.name}: ${response.status} - ${errorText}`)
        
        results.push({
          period: period.name,
          year: period.year,
          status: 'FAILED',
          error: response.status,
          message: errorText
        })
      }
      
    } catch (error) {
      console.log(`💥 ${period.name}: Connection error - ${error.message}`)
      results.push({
        period: period.name,
        year: period.year,
        status: 'ERROR',
        error: error.message
      })
    }
  }
  
  // Summary report
  console.log('\\n📊 DATA AVAILABILITY SUMMARY')
  console.log('==============================')
  
  const available = results.filter(r => r.status === 'SUCCESS')
  const unavailable = results.filter(r => r.status !== 'SUCCESS')
  
  console.log(`\\n✅ AVAILABLE SEASONS (${available.length}):`)
  available.forEach(result => {
    console.log(`   ${result.period}: ${result.matches} matches (Total: ${result.total})`)
  })
  
  console.log(`\\n❌ UNAVAILABLE SEASONS (${unavailable.length}):`)
  unavailable.forEach(result => {
    if (result.status === 'FAILED') {
      console.log(`   ${result.period}: HTTP ${result.error}`)
    } else {
      console.log(`   ${result.period}: ${result.error}`)
    }
  })
  
  // Find the boundary
  const successYears = available.map(r => r.year).sort((a, b) => b - a)
  const oldestAvailable = Math.min(...successYears)
  const newestUnavailable = Math.max(...unavailable.filter(r => r.year < 2020).map(r => r.year))
  
  console.log(`\\n🎯 DATA BOUNDARY ANALYSIS:`)
  console.log(`   Oldest available: ${oldestAvailable}`)
  console.log(`   Newest unavailable: ${newestUnavailable || 'N/A'}`)
  
  if (oldestAvailable) {
    console.log(`\\n💡 RECOMMENDATION:`)
    console.log(`   Your subscription covers ${oldestAvailable} onwards`)
    console.log(`   Start importing from ${oldestAvailable} season`)
    console.log(`   Focus on recent seasons for maximum data completeness`)
  }
}

testDataBoundaries()