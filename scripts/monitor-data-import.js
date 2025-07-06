#!/usr/bin/env node

import { createClient } from 'redis'
import { Client } from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const DB_CONFIG = {
  user: 'premstats',
  host: 'localhost',
  database: 'premstats',
  password: 'premstats',
  port: 5432,
}

async function checkDataImportProgress() {
  const spinner = ora('Checking data import progress...').start()
  
  try {
    // Connect to database
    const db = new Client(DB_CONFIG)
    await db.connect()
    
    // Get seasons with and without data
    const query = `
      SELECT 
        s.id, 
        s.name, 
        COUNT(m.id) as match_count,
        CASE 
          WHEN COUNT(m.id) > 0 THEN 'imported'
          ELSE 'pending'
        END as status
      FROM seasons s 
      LEFT JOIN matches m ON s.id = m.season_id 
      WHERE s.id NOT IN (1, 2, 4)  -- Exclude future/invalid seasons
      GROUP BY s.id, s.name 
      ORDER BY s.id
    `
    
    const result = await db.query(query)
    const seasons = result.rows
    
    await db.end()
    
    // Connect to Redis to check agent status
    const redis = createClient({ url: REDIS_URL })
    await redis.connect()
    
    const agentStatus = await redis.get('agent:data:status')
    const queueLength = await redis.lLen('tasks:data')
    
    await redis.disconnect()
    
    spinner.stop()
    
    console.log(chalk.bold('\n🏆 PremStats Data Import Status\n'))
    
    const imported = seasons.filter(s => s.status === 'imported')
    const pending = seasons.filter(s => s.status === 'pending')
    
    console.log(chalk.green(`✅ Imported: ${imported.length} seasons`))
    console.log(chalk.yellow(`⏳ Pending: ${pending.length} seasons`))
    console.log(chalk.blue(`📊 Total matches: ${imported.reduce((sum, s) => sum + parseInt(s.match_count), 0)}`))
    
    console.log(chalk.bold('\n📋 Data Agent Status:'))
    console.log(`Status: ${agentStatus === 'online' ? chalk.green('Online') : chalk.red('Offline')}`)
    console.log(`Queue: ${queueLength} tasks`)
    
    if (pending.length > 0) {
      console.log(chalk.bold('\n⏳ Seasons Still Processing:'))
      pending.forEach(season => {
        console.log(`  • ${season.name} (ID: ${season.id})`)
      })
    }
    
    if (imported.length > 0) {
      console.log(chalk.bold('\n✅ Seasons Complete:'))
      imported.slice(0, 5).forEach(season => {
        console.log(`  • ${season.name}: ${season.match_count} matches`)
      })
      if (imported.length > 5) {
        console.log(`  • ... and ${imported.length - 5} more`)
      }
    }
    
    console.log('')
    
  } catch (error) {
    spinner.fail('Failed to check data import progress')
    console.error(error)
    process.exit(1)
  }
}

// Run the check
checkDataImportProgress()