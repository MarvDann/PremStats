#!/usr/bin/env node

import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables from .env file in project root
dotenv.config({ path: '../../.env' })

async function testApiWithCorrectAuth() {
  console.log('🧪 Testing football-data.org API with correct authentication...')
  
  // Try to find API key from environment
  const apiKey = process.env.FOOTBALL_DATA_API_KEY || process.argv[2]
  
  if (!apiKey) {
    console.log('❌ No API key found!')
    console.log('Either set: export FOOTBALL_DATA_API_KEY=your_key')
    console.log('Or run: node corrected-api-test.js your_key')
    process.exit(1)
  }
  
  console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`)
  
  try {
    // Test basic API connection with correct header
    const url = 'https://api.football-data.org/v4/competitions/PL'
    console.log(`📡 Testing: ${url}`)
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Response status: ${response.status}`)
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)
      
      if (response.status === 403) {
        console.log('\\n🔍 403 Troubleshooting:')
        console.log('  • Check if API key is correct')
        console.log('  • Verify subscription covers Premier League data')
        console.log('  • Ensure API key has proper permissions')
      }
      
      return false
    }
    
    const data = await response.json()
    console.log('✅ API Connection successful!')
    console.log(`🏆 Competition: ${data.name}`)
    console.log(`📅 Current season: ${data.currentSeason?.startDate} - ${data.currentSeason?.endDate}`)
    console.log(`🔢 Available seasons: ${data.seasons?.length || 'Unknown'}`)
    
    // Test a simple match request with a more basic endpoint
    console.log('\\n🔍 Testing simpler endpoint...')
    await new Promise(resolve => setTimeout(resolve, 2100)) // Rate limit
    
    const simpleUrl = 'https://api.football-data.org/v4/competitions/PL/standings'
    const standingsResponse = await fetch(simpleUrl, {
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (standingsResponse.ok) {
      const standingsData = await standingsResponse.json()
      console.log(`✅ Standings endpoint working`)
      console.log(`📊 Teams in table: ${standingsData.standings?.[0]?.table?.length || 0}`)
    } else {
      console.log(`⚠️ Standings endpoint failed: ${standingsResponse.status}`)
    }
    
    // Test recent matches
    console.log('\\n🔍 Testing recent matches...')
    await new Promise(resolve => setTimeout(resolve, 2100)) // Rate limit
    
    const matchesUrl = 'https://api.football-data.org/v4/competitions/PL/matches?status=FINISHED&limit=1'
    const matchesResponse = await fetch(matchesUrl, {
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      }
    })
    
    if (matchesResponse.ok) {
      const matchesData = await matchesResponse.json()
      console.log(`✅ Recent matches endpoint working`)
      console.log(`🏈 Matches found: ${matchesData.matches?.length || 0}`)
      
      if (matchesData.matches?.[0]) {
        const match = matchesData.matches[0]
        console.log(`📝 Sample: ${match.homeTeam?.name} ${match.score?.fullTime?.home}-${match.score?.fullTime?.away} ${match.awayTeam?.name}`)
        
        // Test match detail for goals
        if (match.id) {
          console.log('\\n🔍 Testing match detail (goals)...')
          await new Promise(resolve => setTimeout(resolve, 2100))
          
          const matchDetailUrl = `https://api.football-data.org/v4/matches/${match.id}`
          const detailResponse = await fetch(matchDetailUrl, {
            headers: {
              'X-Auth-Token': apiKey,
              'Content-Type': 'application/json'
            }
          })
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json()
            console.log(`✅ Match detail working`)
            console.log(`⚽ Goals available: ${detailData.goals?.length || 0}`)
            
            if (detailData.goals?.length > 0) {
              detailData.goals.forEach(goal => {
                console.log(`   ${goal.minute}' ${goal.scorer?.name} (${goal.team?.name})`)
              })
            }
          } else {
            console.log(`⚠️ Match detail failed: ${detailResponse.status}`)
          }
        }
      }
    } else {
      console.log(`⚠️ Matches endpoint failed: ${matchesResponse.status}`)
    }
    
    console.log('\\n🎉 API Testing Complete!')
    console.log('✅ Ready to import professional goal data!')
    
    return true
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    return false
  }
}

testApiWithCorrectAuth()