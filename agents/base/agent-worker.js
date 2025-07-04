#!/usr/bin/env node

import { createClient } from 'redis'
import chalk from 'chalk'

export class AgentWorker {
  constructor(name, type, handler) {
    this.name = name
    this.type = type
    this.handler = handler
    this.redis = null
    this.running = false
    this.queue = `tasks:${type}`
  }

  async connect() {
    this.redis = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379' 
    })
    
    this.redis.on('error', err => {
      console.error(chalk.red(`Redis error: ${err}`))
    })
    
    await this.redis.connect()
    console.log(chalk.green(`${this.name} connected to Redis`))
  }

  async updateStatus(status) {
    await this.redis.set(`agent:${this.type}:status`, status)
    await this.redis.set(`agent:${this.type}:last_seen`, new Date().toISOString())
  }

  async start() {
    await this.connect()
    this.running = true
    
    console.log(chalk.blue(`${this.name} started`))
    await this.updateStatus('online')
    
    // Subscribe to notifications
    const subscriber = this.redis.duplicate()
    await subscriber.connect()
    
    await subscriber.subscribe(`agent:${this.type}:notification`, (message) => {
      const data = JSON.parse(message)
      if (data.type === 'new_task') {
        console.log(chalk.yellow(`New task received: ${data.task.task}`))
      }
    })
    
    // Main processing loop
    while (this.running) {
      try {
        // Get task from queue (blocking pop with 5 second timeout)
        const result = await this.redis.blPop(this.queue, 5)
        
        if (result) {
          const task = JSON.parse(result.element)
          console.log(chalk.cyan(`Processing task: ${task.task}`))
          
          // Update task status
          task.status = 'processing'
          task.started = new Date().toISOString()
          
          // Process the task
          try {
            const taskResult = await this.handler(task)
            
            // Store result
            task.status = 'completed'
            task.completed = new Date().toISOString()
            task.result = taskResult
            
            await this.redis.set(`task:${task.id}`, JSON.stringify(task), {
              EX: 86400 // Expire after 24 hours
            })
            
            console.log(chalk.green(`Task completed: ${task.id}`))
          } catch (error) {
            // Handle task failure
            task.status = 'failed'
            task.error = error.message
            task.completed = new Date().toISOString()
            
            await this.redis.set(`task:${task.id}`, JSON.stringify(task), {
              EX: 86400
            })
            
            console.error(chalk.red(`Task failed: ${error.message}`))
          }
        }
        
        // Update heartbeat
        await this.updateStatus('online')
        
      } catch (error) {
        console.error(chalk.red(`Processing error: ${error}`))
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }

  async stop() {
    console.log(chalk.yellow(`${this.name} stopping...`))
    this.running = false
    await this.updateStatus('offline')
    await this.redis.disconnect()
    console.log(chalk.red(`${this.name} stopped`))
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...')
  process.exit(0)
})