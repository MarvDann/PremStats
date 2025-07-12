#!/usr/bin/env node

import dotenv from 'dotenv'
import { FootballDataClient } from '../agents/data/football-data-client.js'

// Load environment variables
dotenv.config({ path: new URL('../.env', import.meta.url).pathname })

const client = new FootballDataClient()

async function checkAvailableData() {
  console.log('Checking what seasons are actually accessible...\n')
  
  try {
    // Get current season matches to see the format
    console.log('1. Fetching current season matches...')
    const currentMatches = await client.getMatches()
    console.log(`Current season: ${currentMatches.matches?.length || 0} matches found`)
    
    if (currentMatches.matches && currentMatches.matches.length > 0) {
      const match = currentMatches.matches[0]
      console.log('\nMatch structure:')
      console.log(`- ID: ${match.id}`)
      console.log(`- Date: ${match.utcDate}`)
      console.log(`- Home: ${match.homeTeam.name} vs Away: ${match.awayTeam.name}`)
      console.log(`- Score: ${match.score?.fullTime?.home || '-'} - ${match.score?.fullTime?.away || '-'}`)
      console.log(`- Has goals data: ${match.goals ? 'Yes' : 'No'}`)
    }
    
    // Check for seasons endpoint
    console.log('\n2. Checking seasons endpoint...')
    try {
      const seasons = await client.request('/competitions/PL/seasons')
      console.log(`Found ${seasons.seasons?.length || 0} seasons`)
      if (seasons.seasons && seasons.seasons.length > 0) {
        // Check last few seasons
        const recent = seasons.seasons.slice(-5)
        console.log('\nRecent seasons available:')
        recent.forEach(s => {
          console.log(`- ${s.startDate} to ${s.endDate} (ID: ${s.id})`)
        })
      }
    } catch (error) {
      console.log(`Seasons endpoint failed: ${error.message}`)
    }
    
    // Try to get previous season
    console.log('\n3. Testing access to recent historical data...')
    const testYears = [2024, 2023, 2022, 2021, 2020]
    
    for (const year of testYears) {
      try {
        const url = `/competitions/PL/matches?season=${year}`
        console.log(`\nTrying ${year}/${year+1} season...`)
        const matches = await client.request(url)
        console.log(`✓ Success! ${matches.matches?.length || 0} matches available`)
        
        // Check if goals data is included
        if (matches.matches && matches.matches.length > 0) {
          const withGoals = matches.matches.filter(m => m.goals && m.goals.length > 0)
          console.log(`  ${withGoals.length} matches have goal scorer data`)
        }
        break // Stop on first success
      } catch (error) {
        console.log(`✗ ${year}: ${error.message.includes('403') ? 'Access denied' : error.message}`)
      }
    }
    
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
}

checkAvailableData()