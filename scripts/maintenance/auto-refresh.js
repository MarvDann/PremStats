#!/usr/bin/env node

import { createClient } from 'redis'
import chalk from 'chalk'
import ora from 'ora'
import { v4 as uuidv4 } from 'uuid'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

async function autoRefresh() {
  const spinner = ora('Dispatching automatic data refresh tasks...').start()
  
  try {
    // Connect to Redis
    const redis = createClient({ url: REDIS_URL })
    await redis.connect()
    
    // Current date for logging
    const now = new Date().toISOString()
    
    // Dispatch refresh tasks
    const tasks = [
      {
        id: uuidv4(),
        agent: 'data',
        task: 'Refresh current season 2024/25 matches and standings',
        priority: 'normal',
        created: now,
        status: 'pending'
      },
      {
        id: uuidv4(),
        agent: 'data',
        task: 'Update team statistics and league tables',
        priority: 'normal',
        created: now,
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
    
    spinner.succeed(chalk.green('Automatic refresh tasks dispatched'))
    
    console.log(chalk.bold(`\n🔄 Auto-refresh completed at ${new Date().toLocaleString()}`))
    console.log(chalk.blue(`📊 Dispatched ${tasks.length} refresh tasks`))
    
    // Log for cron monitoring
    console.log(chalk.gray(`[${now}] Auto-refresh: ${tasks.length} tasks dispatched`))
    
  } catch (error) {
    spinner.fail('Failed to dispatch auto-refresh tasks')
    console.error(`[${new Date().toISOString()}] Auto-refresh error:`, error)
    process.exit(1)
  }
}

// Run the auto-refresh
autoRefresh()