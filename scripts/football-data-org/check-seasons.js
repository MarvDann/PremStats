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

async function checkSeasons() {
  const client = await pool.connect()
  try {
    const seasons = await client.query('SELECT id, name, start_date, end_date FROM seasons ORDER BY start_date DESC LIMIT 10')
    console.log('Available seasons in database:')
    for (const season of seasons.rows) {
      const startYear = new Date(season.start_date).getFullYear()
      console.log(`ID: ${season.id}, Name: ${season.name}, Start: ${startYear}`)
    }
  } finally {
    client.release()
    await pool.end()
  }
}

checkSeasons()