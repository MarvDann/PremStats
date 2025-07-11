#!/usr/bin/env node

import { AgentWorker } from '../base/agent-worker.js'
import { execSync } from 'child_process'
import chalk from 'chalk'
import { createClient } from 'redis'
import { v4 as uuidv4 } from 'uuid'

export class GitHubIssueMonitor {
  constructor() {
    this.redis = null
    this.running = false
    this.monitorInterval = 5 * 60 * 1000 // 5 minutes
    this.processedIssues = new Set()
    
    // Keywords that indicate frontend issues
    this.frontendKeywords = [
      'page', 'component', 'ui', 'display', 'frontend', 'react', 'solidjs',
      'css', 'style', 'layout', 'button', 'form', 'navigation', 'menu',
      'modal', 'dialog', 'chart', 'table', 'card', 'responsive', 'mobile',
      'match detail', 'team page', 'player page', 'stats page', 'home page'
    ]
  }

  async connect() {
    this.redis = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379' 
    })
    
    this.redis.on('error', err => {
      console.error(chalk.red(`Redis error: ${err}`))
    })
    
    await this.redis.connect()
    console.log(chalk.green('GitHub Issue Monitor connected to Redis'))
  }

  /**
   * Fetch open issues from GitHub
   * @returns {Promise<Array>} - Array of issue objects
   */
  async fetchOpenIssues() {
    try {
      const output = execSync('gh issue list --state open --json number,title,body,labels,assignees,createdAt --limit 50', {
        encoding: 'utf-8',
        cwd: process.cwd()
      })
      
      return JSON.parse(output)
    } catch (error) {
      console.error(chalk.red(`Failed to fetch GitHub issues: ${error.message}`))
      throw error
    }
  }

  /**
   * Check if an issue is frontend-related
   * @param {Object} issue - GitHub issue object
   * @returns {boolean} - True if issue is frontend-related
   */
  isFrontendIssue(issue) {
    const text = (issue.title + ' ' + issue.body).toLowerCase()
    
    return this.frontendKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    )
  }

  /**
   * Check if an issue is already assigned to an agent
   * @param {Object} issue - GitHub issue object
   * @returns {boolean} - True if issue is already assigned
   */
  isIssueAssigned(issue) {
    // Check if issue has assignees
    if (issue.assignees && issue.assignees.length > 0) {
      return true
    }
    
    // Check if issue has agent-related labels
    const agentLabels = ['agent:assigned', 'agent:frontend', 'agent:backend', 'agent:processing']
    return issue.labels && issue.labels.some(label => 
      agentLabels.includes(label.name)
    )
  }

  /**
   * Check if an issue already has a PR
   * @param {number} issueNumber - GitHub issue number
   * @returns {Promise<boolean>} - True if issue has a PR
   */
  async hasExistingPR(issueNumber) {
    try {
      const output = execSync(`gh pr list --search "fixes #${issueNumber}" --json number`, {
        encoding: 'utf-8',
        cwd: process.cwd()
      })
      
      const prs = JSON.parse(output)
      return prs.length > 0
    } catch (error) {
      console.error(chalk.yellow(`Failed to check PRs for issue #${issueNumber}: ${error.message}`))
      return false
    }
  }

  /**
   * Dispatch an issue to the appropriate agent
   * @param {Object} issue - GitHub issue object
   * @param {string} agentType - Agent type (frontend, backend, etc.)
   */
  async dispatchIssue(issue, agentType) {
    const taskData = {
      id: uuidv4(),
      type: 'github-issue',
      agent: agentType,
      task: `Fix GitHub Issue #${issue.number}: ${issue.title}`,
      metadata: {
        issueNumber: issue.number,
        issueTitle: issue.title,
        issueBody: issue.body,
        repository: 'MarvDann/PremStats',
        url: `https://github.com/MarvDann/PremStats/issues/${issue.number}`
      },
      priority: 'high',
      created: new Date().toISOString(),
      status: 'pending'
    }
    
    try {
      // Add task to agent queue
      const queueName = `tasks:${agentType}`
      await this.redis.lPush(queueName, JSON.stringify(taskData))
      
      // Notify agent
      await this.redis.publish(`agent:${agentType}:notification`, JSON.stringify({
        type: 'new_task',
        task: taskData
      }))
      
      // Mark issue as assigned by adding label
      try {
        execSync(`gh issue edit ${issue.number} --add-label "agent:${agentType}"`, {
          cwd: process.cwd()
        })
        
        // Add comment to issue
        const comment = `🤖 This issue has been automatically assigned to the ${agentType} agent.
        
Task ID: \`${taskData.id}\`
Agent: ${agentType}
Priority: ${taskData.priority}

The agent will analyze the issue and create a fix. You can track progress in the task queue.`
        
        execSync(`gh issue comment ${issue.number} --body "${comment}"`, {
          cwd: process.cwd()
        })
        
      } catch (labelError) {
        console.error(chalk.yellow(`Failed to add label to issue #${issue.number}: ${labelError.message}`))
      }
      
      console.log(chalk.green(`✅ Issue #${issue.number} dispatched to ${agentType} agent`))
      console.log(chalk.gray(`   Task ID: ${taskData.id}`))
      
      // Track processed issue
      this.processedIssues.add(issue.number)
      
    } catch (error) {
      console.error(chalk.red(`Failed to dispatch issue #${issue.number}: ${error.message}`))
      throw error
    }
  }

  /**
   * Process all open issues
   */
  async processIssues() {
    try {
      console.log(chalk.blue('🔍 Checking for new GitHub issues...'))
      
      const issues = await this.fetchOpenIssues()
      console.log(chalk.gray(`Found ${issues.length} open issues`))
      
      let processedCount = 0
      
      for (const issue of issues) {
        // Skip if already processed in this session
        if (this.processedIssues.has(issue.number)) {
          continue
        }
        
        // Skip if already assigned
        if (this.isIssueAssigned(issue)) {
          console.log(chalk.gray(`Issue #${issue.number} already assigned, skipping`))
          continue
        }
        
        // Skip if already has PR
        if (await this.hasExistingPR(issue.number)) {
          console.log(chalk.gray(`Issue #${issue.number} already has PR, skipping`))
          continue
        }
        
        // Check if it's a frontend issue
        if (this.isFrontendIssue(issue)) {
          console.log(chalk.cyan(`🎨 Frontend issue detected: #${issue.number} - ${issue.title}`))
          await this.dispatchIssue(issue, 'frontend')
          processedCount++
        } else {
          console.log(chalk.gray(`Issue #${issue.number} not identified as frontend issue`))
        }
      }
      
      if (processedCount === 0) {
        console.log(chalk.green('✅ No new issues to process'))
      } else {
        console.log(chalk.green(`✅ Processed ${processedCount} new issues`))
      }
      
    } catch (error) {
      console.error(chalk.red(`Failed to process issues: ${error.message}`))
    }
  }

  /**
   * Start the issue monitor
   */
  async start() {
    await this.connect()
    this.running = true
    
    console.log(chalk.blue('🚀 GitHub Issue Monitor started'))
    console.log(chalk.gray(`Monitoring interval: ${this.monitorInterval / 1000}s`))
    
    // Initial check
    await this.processIssues()
    
    // Set up periodic monitoring
    const intervalId = setInterval(async () => {
      if (this.running) {
        await this.processIssues()
      }
    }, this.monitorInterval)
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Stopping GitHub Issue Monitor...'))
      this.running = false
      clearInterval(intervalId)
      await this.redis.disconnect()
      console.log(chalk.red('GitHub Issue Monitor stopped'))
      process.exit(0)
    })
  }
}

// If run directly, start the monitor
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new GitHubIssueMonitor()
  monitor.start().catch(error => {
    console.error(chalk.red(`Failed to start monitor: ${error.message}`))
    process.exit(1)
  })
}