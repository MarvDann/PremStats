#!/usr/bin/env node

import fetch from 'node-fetch'

async function testFootballDataOrg() {
  console.log('🧪 Testing football-data.org API directly...')
  
  // Prompt for API key
  console.log('Please provide your football-data.org API key:')
  const apiKey = process.argv[2]
  
  if (!apiKey) {
    console.log('Usage: node test-api-directly.js YOUR_API_KEY')
    process.exit(1)
  }
  
  console.log(`API Key provided: ${apiKey.substring(0, 8)}...`)
  
  try {
    // Test basic API connection
    const url = 'https://api.football-data.org/v4/competitions/PL'
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey
      }
    })
    
    console.log(`Response status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      return false
    }
    
    const data = await response.json()
    console.log('✅ API Connection successful!')
    console.log(`Competition: ${data.name}`)
    console.log(`Current season: ${data.currentSeason?.startDate} - ${data.currentSeason?.endDate}`)
    
    // Test matches endpoint
    console.log('\\n🔍 Testing matches endpoint...')
    const matchesUrl = 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED&limit=3'
    const matchesResponse = await fetch(matchesUrl, {
      headers: {
        'X-Auth-Token': apiKey
      }
    })
    
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json()
      console.log(`✅ Matches endpoint working: ${matchesData.matches?.length || 0} matches found`)
      
      if (matchesData.matches?.[0]) {
        const match = matchesData.matches[0]
        console.log(`Sample: ${match.homeTeam?.name} vs ${match.awayTeam?.name}`)
      }
    } else {
      console.log('⚠️ Matches endpoint failed')
    }
    
    // Test historical seasons
    console.log('\\n🔍 Testing available seasons...')
    if (data.seasons) {
      console.log(`Available seasons: ${data.seasons.length}`)
      for (const season of data.seasons.slice(0, 5)) {
        const startYear = new Date(season.startDate).getFullYear()
        const endYear = new Date(season.endDate).getFullYear()
        console.log(`  ${startYear}/${endYear} - ID: ${season.id}`)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
}

testFootballDataOrg()