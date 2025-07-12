#!/usr/bin/env node

import dotenv from 'dotenv'
import { FootballDataClient } from '../agents/data/football-data-client.js'

// Load environment variables
dotenv.config({ path: new URL('../.env', import.meta.url).pathname })

const client = new FootballDataClient()

async function testHistoricalData() {
  console.log('Testing football-data.org API for historical data...\n')
  
  try {
    // Test 1: Get competition info
    console.log('1. Fetching Premier League competition info...')
    const competition = await client.getCompetition()
    console.log(`Competition: ${competition.name}`)
    console.log(`Current Season: ${competition.currentSeason?.startDate} to ${competition.currentSeason?.endDate}`)
    console.log(`Available Seasons: ${competition.seasons?.length || 0}`)
    
    if (competition.seasons) {
      console.log('\nAvailable seasons:')
      const sorted = competition.seasons.sort((a, b) => a.startDate.localeCompare(b.startDate))
      console.log(`Earliest: ${sorted[0]?.startDate} to ${sorted[0]?.endDate}`)
      console.log(`Latest: ${sorted[sorted.length-1]?.startDate} to ${sorted[sorted.length-1]?.endDate}`)
    }
    
    // Test 2: Try to get historical matches
    console.log('\n2. Testing historical match access...')
    try {
      // Try different date filters
      const testUrl = `/competitions/PL/matches?season=1992`
      console.log(`Testing: ${testUrl}`)
      const historicalMatches = await client.request(testUrl)
      console.log(`Success! Found ${historicalMatches.matches?.length || 0} matches`)
    } catch (error) {
      console.log(`Failed: ${error.message}`)
      
      // Try alternative approach
      console.log('\nTrying alternative date filter...')
      const testUrl2 = `/competitions/PL/matches?dateFrom=1992-08-15&dateTo=1993-05-11`
      try {
        const matches = await client.request(testUrl2)
        console.log(`Found ${matches.matches?.length || 0} matches`)
      } catch (err2) {
        console.log(`Also failed: ${err2.message}`)
      }
    }
    
    // Test 3: Check what's available for free tier
    console.log('\n3. Checking free tier limitations...')
    console.log('Note: Free tier may have restrictions on historical data')
    
  } catch (error) {
    console.error(`Error: ${error.message}`)
  }
}

testHistoricalData()