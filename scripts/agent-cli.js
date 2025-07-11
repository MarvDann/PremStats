#!/usr/bin/env node

import { createClient } from 'redis'
import { program } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { v4 as uuidv4 } from 'uuid'
import { execSync } from 'child_process'
import { WorktreeManager } from '../agents/base/worktree-manager.js'
import { GitHubIssueMonitor } from '../agents/github/issue-monitor.js'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

// Agent types
const AGENTS = {
  data: 'Data Collection Agent',
  frontend: 'Frontend Development Agent',
  backend: 'Backend Development Agent',
  devops: 'DevOps Agent',
  qa: 'QA Testing Agent'
}

// Task queues
const QUEUES = {
  data: 'tasks:data',
  frontend: 'tasks:frontend',
  backend: 'tasks:backend',
  devops: 'tasks:devops',
  qa: 'tasks:qa'
}

async function connectRedis() {
  const client = createClient({ url: REDIS_URL })
  await client.connect()
  return client
}

// Command: Dispatch task to agent
async function dispatchTask(agent, task, options) {
  const spinner = ora('Dispatching task...').start()
  
  try {
    const redis = await connectRedis()
    
    const taskData = {
      id: uuidv4(),
      type: options.metadata ? 'github-issue' : 'generic',
      agent,
      task,
      priority: options.priority || 'normal',
      created: new Date().toISOString(),
      status: 'pending',
      ...(options.metadata && { metadata: options.metadata })
    }
    
    await redis.lPush(QUEUES[agent], JSON.stringify(taskData))
    await redis.publish(`agent:${agent}:notification`, JSON.stringify({
      type: 'new_task',
      task: taskData
    }))
    
    spinner.succeed(chalk.green(`Task dispatched to ${AGENTS[agent]}`))
    console.log(chalk.gray(`Task ID: ${taskData.id}`))
    
    await redis.disconnect()
  } catch (error) {
    spinner.fail(chalk.red('Failed to dispatch task'))
    console.error(error)
    process.exit(1)
  }
}

// Command: Check agent status
async function checkStatus(agent) {
  const spinner = ora('Checking status...').start()
  
  try {
    const redis = await connectRedis()
    
    if (agent) {
      // Check specific agent
      const queueLength = await redis.lLen(QUEUES[agent])
      const status = await redis.get(`agent:${agent}:status`)
      const lastSeen = await redis.get(`agent:${agent}:last_seen`)
      
      spinner.stop()
      console.log(chalk.bold(`\n${AGENTS[agent]}:`))
      console.log(`  Status: ${status || 'offline'}`)
      console.log(`  Queue: ${queueLength} tasks`)
      console.log(`  Last seen: ${lastSeen || 'never'}`)
    } else {
      // Check all agents
      spinner.stop()
      console.log(chalk.bold('\nAgent Status:\n'))
      
      for (const [key, name] of Object.entries(AGENTS)) {
        const queueLength = await redis.lLen(QUEUES[key])
        const status = await redis.get(`agent:${key}:status`)
        
        const statusColor = status === 'online' ? chalk.green : chalk.gray
        console.log(`${name}: ${statusColor(status || 'offline')} (${queueLength} tasks)`)
      }
    }
    
    await redis.disconnect()
  } catch (error) {
    spinner.fail(chalk.red('Failed to check status'))
    console.error(error)
    process.exit(1)
  }
}

// Command: List tasks
async function listTasks(agent, options) {
  const spinner = ora('Fetching tasks...').start()
  
  try {
    const redis = await connectRedis()
    const limit = options.limit || 10
    
    const queues = agent ? [agent] : Object.keys(QUEUES)
    
    spinner.stop()
    
    for (const q of queues) {
      const tasks = await redis.lRange(QUEUES[q], 0, limit - 1)
      
      if (tasks.length > 0) {
        console.log(chalk.bold(`\n${AGENTS[q]} Tasks:\n`))
        
        tasks.forEach((taskStr, index) => {
          const task = JSON.parse(taskStr)
          const priorityColor = task.priority === 'high' ? chalk.red : chalk.white
          
          console.log(`${index + 1}. ${task.task}`)
          console.log(`   ID: ${chalk.gray(task.id)}`)
          console.log(`   Priority: ${priorityColor(task.priority)}`)
          console.log(`   Created: ${chalk.gray(task.created)}`)
          console.log()
        })
      }
    }
    
    await redis.disconnect()
  } catch (error) {
    spinner.fail(chalk.red('Failed to list tasks'))
    console.error(error)
    process.exit(1)
  }
}

// Command: Clear queue
async function clearQueue(agent) {
  const spinner = ora('Clearing queue...').start()
  
  try {
    const redis = await connectRedis()
    
    if (agent) {
      await redis.del(QUEUES[agent])
      spinner.succeed(chalk.green(`Cleared ${AGENTS[agent]} queue`))
    } else {
      for (const queue of Object.values(QUEUES)) {
        await redis.del(queue)
      }
      spinner.succeed(chalk.green('Cleared all queues'))
    }
    
    await redis.disconnect()
  } catch (error) {
    spinner.fail(chalk.red('Failed to clear queue'))
    console.error(error)
    process.exit(1)
  }
}

// CLI setup
program
  .name('premstats-agent')
  .description('PremStats Agent CLI')
  .version('1.0.0')

program
  .command('task <agent> <task>')
  .description('Dispatch a task to an agent')
  .option('-p, --priority <priority>', 'Task priority (low, normal, high)', 'normal')
  .action(dispatchTask)

program
  .command('status [agent]')
  .description('Check agent status')
  .action(checkStatus)

program
  .command('list [agent]')
  .description('List pending tasks')
  .option('-l, --limit <limit>', 'Number of tasks to show', '10')
  .action(listTasks)

program
  .command('clear [agent]')
  .description('Clear task queue')
  .action(clearQueue)

// Agent shortcuts
program
  .command('scrape <target>')
  .description('Scrape data (shortcut for data agent)')
  .action((target) => {
    dispatchTask('data', `Scrape ${target}`, { priority: 'normal' })
  })

program
  .command('build-ui <component>')
  .description('Build UI component (shortcut for frontend agent)')
  .action((component) => {
    dispatchTask('frontend', `Build ${component} component`, { priority: 'normal' })
  })

program
  .command('api <endpoint>')
  .description('Create API endpoint (shortcut for backend agent)')
  .action((endpoint) => {
    dispatchTask('backend', `Create ${endpoint} endpoint`, { priority: 'normal' })
  })

// GitHub Integration Commands
program
  .command('issue <number>')
  .description('Assign GitHub issue to appropriate agent')
  .option('-a, --agent <agent>', 'Force assign to specific agent')
  .action(async (number, options) => {
    await assignIssue(number, options.agent)
  })

program
  .command('pr-status')
  .description('Check status of agent-created PRs')
  .action(async () => {
    await checkPRStatus()
  })

program
  .command('worktrees')
  .description('List active worktrees')
  .action(async () => {
    await listWorktrees()
  })

program
  .command('cleanup-worktrees')
  .description('Clean up completed worktrees')
  .action(async () => {
    await cleanupWorktrees()
  })

program
  .command('monitor')
  .description('Start GitHub issue monitor')
  .action(async () => {
    await startMonitor()
  })

// GitHub Integration Command Implementations

// Assign GitHub issue to agent
async function assignIssue(issueNumber, forcedAgent) {
  const spinner = ora('Assigning GitHub issue...').start()
  
  try {
    // Fetch issue details
    const issueJson = execSync(`gh issue view ${issueNumber} --json title,body,labels`, {
      encoding: 'utf-8'
    })
    const issue = JSON.parse(issueJson)
    
    // Determine agent type
    let agentType = forcedAgent
    if (!agentType) {
      const text = (issue.title + ' ' + issue.body).toLowerCase()
      const frontendKeywords = ['page', 'component', 'ui', 'display', 'frontend', 'match detail']
      agentType = frontendKeywords.some(keyword => text.includes(keyword)) ? 'frontend' : 'backend'
    }
    
    // Dispatch task
    await dispatchTask(agentType, `Fix GitHub Issue #${issueNumber}: ${issue.title}`, {
      priority: 'high',
      metadata: {
        issueNumber: parseInt(issueNumber),
        issueTitle: issue.title,
        issueBody: issue.body,
        repository: 'MarvDann/PremStats'
      }
    })
    
    spinner.succeed(chalk.green(`Issue #${issueNumber} assigned to ${agentType} agent`))
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to assign issue'))
    console.error(error.message)
  }
}

// Check PR status
async function checkPRStatus() {
  const spinner = ora('Checking PR status...').start()
  
  try {
    const prs = execSync('gh pr list --author @me --json number,title,state,url', {
      encoding: 'utf-8'
    })
    
    const prList = JSON.parse(prs)
    spinner.stop()
    
    if (prList.length === 0) {
      console.log(chalk.yellow('No PRs found'))
      return
    }
    
    console.log(chalk.bold('\nAgent-created PRs:\n'))
    
    for (const pr of prList) {
      const statusColor = pr.state === 'OPEN' ? chalk.green : chalk.gray
      console.log(`#${pr.number}: ${pr.title}`)
      console.log(`  Status: ${statusColor(pr.state)}`)
      console.log(`  URL: ${chalk.blue(pr.url)}`)
      console.log()
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to check PR status'))
    console.error(error.message)
  }
}

// List active worktrees
async function listWorktrees() {
  const spinner = ora('Listing worktrees...').start()
  
  try {
    const worktreeManager = new WorktreeManager()
    const worktrees = await worktreeManager.listWorktrees()
    
    spinner.stop()
    
    const issueWorktrees = worktrees.filter(w => w.path.includes('issue-'))
    
    if (issueWorktrees.length === 0) {
      console.log(chalk.yellow('No active issue worktrees'))
      return
    }
    
    console.log(chalk.bold('\nActive Issue Worktrees:\n'))
    
    for (const worktree of issueWorktrees) {
      const issueMatch = worktree.path.match(/issue-(\d+)/)
      const issueNumber = issueMatch ? issueMatch[1] : 'unknown'
      
      console.log(`Issue #${issueNumber}:`)
      console.log(`  Path: ${worktree.path}`)
      console.log(`  Branch: ${worktree.branch || 'detached'}`)
      console.log(`  Status: ${worktree.detached ? 'detached' : 'active'}`)
      console.log()
    }
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to list worktrees'))
    console.error(error.message)
  }
}

// Clean up worktrees
async function cleanupWorktrees() {
  const spinner = ora('Cleaning up worktrees...').start()
  
  try {
    const worktreeManager = new WorktreeManager()
    await worktreeManager.cleanupAll()
    
    spinner.succeed(chalk.green('Worktrees cleaned up successfully'))
    
  } catch (error) {
    spinner.fail(chalk.red('Failed to cleanup worktrees'))
    console.error(error.message)
  }
}

// Start GitHub issue monitor
async function startMonitor() {
  console.log(chalk.blue('🔍 Starting GitHub Issue Monitor...'))
  console.log(chalk.gray('This will monitor for new issues and assign them to agents'))
  console.log(chalk.gray('Press Ctrl+C to stop'))
  
  try {
    const monitor = new GitHubIssueMonitor()
    await monitor.start()
    
  } catch (error) {
    console.error(chalk.red('Failed to start monitor'))
    console.error(error.message)
    process.exit(1)
  }
}

program.parse()