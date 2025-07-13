#!/usr/bin/env node

import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: 'premstats',
  host: 'localhost',
  database: 'premstats',
  password: 'premstats',
  port: 5432,
})

async function cleanSlateDataRemoval() {
  const client = await pool.connect()
  
  try {
    console.log('🧹 CLEAN SLATE: Removing all faulty match event data')
    console.log('================================================')
    
    // Count current data before removal
    const goalCount = await client.query('SELECT COUNT(*) as count FROM goals')
    const eventCount = await client.query('SELECT COUNT(*) as count FROM match_events WHERE 1=0') // Table may not exist
    
    console.log(`Current data to be removed:`)
    console.log(`- Goals: ${goalCount.rows[0].count}`)
    
    // Remove all goals data (only 5.3% complete and unreliable)
    console.log('\n🗑️ Removing all goal data...')
    const deletedGoals = await client.query('DELETE FROM goals')
    console.log(`✅ Deleted ${deletedGoals.rowCount} unreliable goal records`)
    
    // Check if match_events table exists and remove if it does
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'match_events'
      )
    `)
    
    if (tableExists.rows[0].exists) {
      console.log('\n🗑️ Removing match events data...')
      const deletedEvents = await client.query('DELETE FROM match_events')
      console.log(`✅ Deleted ${deletedEvents.rowCount} match event records`)
    }
    
    // Reset any sequences
    await client.query('ALTER SEQUENCE goals_id_seq RESTART WITH 1')
    console.log('✅ Reset goals sequence')
    
    console.log('\n🎯 DATABASE CLEANED - READY FOR PROFESSIONAL DATA')
    console.log('Next steps:')
    console.log('1. Build football-data.org API integration')
    console.log('2. Import reliable, complete, accurate data')
    console.log('3. Never look back at unreliable scraping again!')
    
  } finally {
    client.release()
    await pool.end()
  }
}

cleanSlateDataRemoval()