#!/usr/bin/env node

import { spawn } from 'child_process'
import chalk from 'chalk'

// Seasons to import (2004/05 to 2024/25) - continuing from where we left off
const seasons = []
for (let year = 2004; year <= 2024; year++) {
  seasons.push(year)
}

async function dispatchTask(year) {
  return new Promise((resolve, reject) => {
    const task = `scrape historical ${year}`
    console.log(chalk.blue(`Dispatching: ${task}`))
    
    const proc = spawn('node', ['scripts/agent-cli.js', 'task', 'data', task])
    
    let output = ''
    proc.stdout.on('data', (data) => {
      output += data.toString()
    })
    
    proc.stderr.on('data', (data) => {
      console.error(chalk.red(data.toString()))
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/Task ID: ([\w-]+)/)
        const taskId = match ? match[1] : 'unknown'
        console.log(chalk.green(`✓ ${year}/${year+1} dispatched (${taskId})`))
        resolve(taskId)
      } else {
        reject(new Error(`Failed to dispatch task for ${year}`))
      }
    })
  })
}

async function importAllSeasons() {
  console.log(chalk.yellow(`\nImporting ${seasons.length} seasons of Premier League data...\n`))
  
  const batchSize = 5 // Process 5 seasons at a time
  const results = []
  
  for (let i = 0; i < seasons.length; i += batchSize) {
    const batch = seasons.slice(i, i + batchSize)
    console.log(chalk.cyan(`\nProcessing batch: ${batch.map(y => `${y}/${y+1}`).join(', ')}`))
    
    // Dispatch tasks in parallel for this batch
    const promises = batch.map(year => dispatchTask(year))
    const batchResults = await Promise.allSettled(promises)
    
    results.push(...batchResults)
    
    // Wait between batches to avoid overwhelming the system
    if (i + batchSize < seasons.length) {
      console.log(chalk.gray('\nWaiting 30 seconds before next batch...'))
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
  }
  
  // Summary
  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length
  
  console.log(chalk.yellow('\n=== Import Summary ==='))
  console.log(chalk.green(`✓ Succeeded: ${succeeded} seasons`))
  if (failed > 0) {
    console.log(chalk.red(`✗ Failed: ${failed} seasons`))
  }
  console.log(chalk.yellow('====================\n'))
}

// Run the import
importAllSeasons().catch(error => {
  console.error(chalk.red(`Import failed: ${error.message}`))
  process.exit(1)
})