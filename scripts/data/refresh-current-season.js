#!/usr/bin/env node

import { createClient } from 'redis'
import { Client } from 'pg'
import chalk from 'chalk'
import ora from 'ora'
import { v4 as uuidv4 } from 'uuid'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const DB_CONFIG = {
  user: 'premstats',
  host: 'localhost',
  database: 'premstats',
  password: 'premstats',
  port: 5432,
}

async function refreshCurrentSeason() {
  const spinner = ora('Refreshing current season data...').start()
  
  try {
    // Connect to database
    const db = new Client(DB_CONFIG)
    await db.connect()
    
    // Get current season (2024/25)
    const seasonQuery = `
      SELECT id, name FROM seasons 
      WHERE name = '2024/25' 
      LIMIT 1
    `
    
    const result = await db.query(seasonQuery)
    if (result.rows.length === 0) {
      spinner.fail('Current season 2024/25 not found in database')
      await db.end()
      return
    }
    
    const currentSeason = result.rows[0]
    await db.end()
    
    // Connect to Redis
    const redis = createClient({ url: REDIS_URL })
    await redis.connect()
    
    // Dispatch refresh tasks
    const tasks = [
      {
        id: uuidv4(),
        agent: 'data',
        task: `Refresh current season ${currentSeason.name} matches from Premier League API`,
        priority: 'high',
        created: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: uuidv4(),
        agent: 'data',
        task: `Update current season ${currentSeason.name} standings and statistics`,
        priority: 'high',
        created: new Date().toISOString(),
        status: 'pending'
      }
    ]
    
    for (const task of tasks) {
      await redis.lPush('tasks:data', JSON.stringify(task))
      await redis.publish('agent:data:notification', JSON.stringify({
        type: 'new_task',
        task: task
      }))
    }
    
    await redis.disconnect()
    
    spinner.succeed(chalk.green('Current season refresh tasks dispatched'))
    
    console.log(chalk.bold(`\n📊 Dispatched ${tasks.length} refresh tasks for ${currentSeason.name}`))
    tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.task}`)
      console.log(`     Priority: ${chalk.yellow(task.priority)} | ID: ${chalk.gray(task.id)}`)
    })
    
    console.log(chalk.blue('\n💡 Run `node scripts/monitor-data-import.js` to check progress'))
    
  } catch (error) {
    spinner.fail('Failed to refresh current season')
    console.error(error)
    process.exit(1)
  }
}

// Run the refresh
refreshCurrentSeason()