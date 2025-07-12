#!/usr/bin/env node

import pg from 'pg'
import chalk from 'chalk'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function addMatchStatsColumns() {
  console.log(chalk.bold('🔧 Adding match statistics columns to matches table...'))
  
  try {
    // Add match statistics columns
    const alterTableQuery = `
      ALTER TABLE matches
      ADD COLUMN IF NOT EXISTS home_shots INTEGER,
      ADD COLUMN IF NOT EXISTS away_shots INTEGER,
      ADD COLUMN IF NOT EXISTS home_shots_on_target INTEGER,
      ADD COLUMN IF NOT EXISTS away_shots_on_target INTEGER,
      ADD COLUMN IF NOT EXISTS home_corners INTEGER,
      ADD COLUMN IF NOT EXISTS away_corners INTEGER,
      ADD COLUMN IF NOT EXISTS home_fouls INTEGER,
      ADD COLUMN IF NOT EXISTS away_fouls INTEGER,
      ADD COLUMN IF NOT EXISTS home_yellow_cards INTEGER,
      ADD COLUMN IF NOT EXISTS away_yellow_cards INTEGER,
      ADD COLUMN IF NOT EXISTS home_red_cards INTEGER,
      ADD COLUMN IF NOT EXISTS away_red_cards INTEGER,
      ADD COLUMN IF NOT EXISTS home_possession DECIMAL(4,1),
      ADD COLUMN IF NOT EXISTS away_possession DECIMAL(4,1),
      ADD COLUMN IF NOT EXISTS attendance INTEGER
    `
    
    await pool.query(alterTableQuery)
    console.log(chalk.green('✅ Match statistics columns added successfully!'))
    
    // Check the table structure
    const checkQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
        AND column_name LIKE '%shot%' 
        OR column_name LIKE '%corner%' 
        OR column_name LIKE '%foul%'
        OR column_name LIKE '%card%'
        OR column_name LIKE '%possession%'
        OR column_name = 'attendance'
      ORDER BY column_name
    `
    
    const result = await pool.query(checkQuery)
    console.log(chalk.blue('\nNew columns added:'))
    result.rows.forEach(row => {
      console.log(chalk.gray(`  - ${row.column_name} (${row.data_type})`))
    })
    
  } catch (error) {
    console.error(chalk.red('Error adding columns:'), error)
  } finally {
    await pool.end()
  }
}

// Run the script
addMatchStatsColumns()