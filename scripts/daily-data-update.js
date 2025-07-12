#!/usr/bin/env node

import 'dotenv/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import ora from 'ora'

const execAsync = promisify(exec)

// Configuration
const UPDATE_SCRIPTS = [
  {
    name: 'Squad Data Update',
    script: 'scripts/import-squad-data.js',
    description: 'Update squad rosters from Football-Data.org',
    frequency: 'weekly' // Only run weekly as squads don't change often
  },
  {
    name: 'FPL Statistics Update', 
    script: 'scripts/import-fpl-data.js',
    description: 'Update player goals/assists from Fantasy Premier League API',
    frequency: 'daily' // Run daily for fresh statistics
  }
]

async function runScript(scriptConfig) {
  const spinner = ora(`Running ${scriptConfig.name}...`).start()
  
  try {
    // Run script and capture both stdout and exit code
    const result = await execAsync(`node ${scriptConfig.script}`, { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 // 1MB buffer for large outputs
    })
    
    spinner.succeed(`✅ ${scriptConfig.name} completed`)
    
    // Extract key metrics from stdout
    const lines = result.stdout.split('\n')
    const summaryLine = lines.find(line => 
      line.includes('Import Summary') || 
      line.includes('complete!')
    )
    
    if (summaryLine) {
      console.log(chalk.gray(`   📊 ${summaryLine.trim()}`))
    }
    
    return { success: true, output: result.stdout }
    
  } catch (error) {
    spinner.fail(`❌ ${scriptConfig.name} failed`)
    
    // Only show actual error messages, not spinner output
    const errorMessage = error.code ? 
      `Script exited with code ${error.code}` : 
      error.message.split('\n')[0] // Just first line of error
      
    console.error(chalk.red(`   Error: ${errorMessage}`))
    return { success: false, error: errorMessage }
  }
}

async function dailyDataUpdate() {
  console.log(chalk.bold('🔄 Starting Daily Data Update...'))
  console.log(chalk.gray(`⏰ ${new Date().toISOString()}`))
  console.log()
  
  const results = []
  
  for (const scriptConfig of UPDATE_SCRIPTS) {
    // Check if script should run based on frequency
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    if (scriptConfig.frequency === 'weekly' && dayOfWeek !== 1) {
      console.log(chalk.yellow(`⏭️  Skipping ${scriptConfig.name} (weekly, runs on Mondays)`))
      continue
    }
    
    console.log(chalk.blue(`🚀 ${scriptConfig.description}`))
    const result = await runScript(scriptConfig)
    results.push({ ...scriptConfig, ...result })
    
    // Wait between scripts to avoid overwhelming APIs
    if (scriptConfig !== UPDATE_SCRIPTS[UPDATE_SCRIPTS.length - 1]) {
      console.log(chalk.gray('   ⏳ Waiting 30 seconds before next update...'))
      await new Promise(resolve => setTimeout(resolve, 30000))
    }
    
    console.log()
  }
  
  // Summary report
  console.log(chalk.bold('📋 Update Summary:'))
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`   ✅ Successful updates: ${successful}`)
  console.log(`   ❌ Failed updates: ${failed}`)
  
  if (failed > 0) {
    console.log(chalk.red('\n⚠️  Some updates failed. Check logs above.'))
    process.exit(1)
  } else {
    console.log(chalk.green('\n🎉 All data updates completed successfully!'))
    process.exit(0)
  }
}

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⏹️  Update process interrupted'))
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n⏹️  Update process terminated'))
  process.exit(0)
})

// Check if running in CI/automated environment
const isAutomated = process.env.CI || process.env.AUTOMATED || process.argv.includes('--automated')

if (isAutomated) {
  console.log(chalk.cyan('🤖 Running in automated mode'))
}

// Run the daily update
dailyDataUpdate().catch(error => {
  console.error(chalk.red('\n💥 Daily update failed:'), error.message)
  process.exit(1)
})