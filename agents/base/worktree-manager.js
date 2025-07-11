#!/usr/bin/env node

import { execSync, exec } from 'child_process'
import path from 'path'
import fs from 'fs'
import chalk from 'chalk'

export class WorktreeManager {
  constructor(baseRepoPath, worktreeBasePath) {
    this.baseRepoPath = baseRepoPath || process.cwd()
    this.worktreeBasePath = worktreeBasePath || path.join(this.baseRepoPath, '..', 'worktrees')
    
    // Ensure worktree base directory exists
    if (!fs.existsSync(this.worktreeBasePath)) {
      fs.mkdirSync(this.worktreeBasePath, { recursive: true })
    }
  }

  /**
   * Create a worktree for a GitHub issue
   * @param {number} issueNumber - GitHub issue number
   * @param {string} branchName - Optional custom branch name
   * @returns {Promise<string>} - Path to the created worktree
   */
  async createWorktree(issueNumber, branchName = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const safeBranchName = branchName || `fix/issue-${issueNumber}-${timestamp}`
    const worktreePath = path.join(this.worktreeBasePath, `issue-${issueNumber}-${timestamp}`)
    
    try {
      // Check if worktree already exists
      if (fs.existsSync(worktreePath)) {
        console.log(chalk.yellow(`Worktree for issue #${issueNumber} already exists at ${worktreePath}`))
        return worktreePath
      }

      // Create the worktree with a new branch
      console.log(chalk.blue(`Creating worktree for issue #${issueNumber}...`))
      const command = `git worktree add "${worktreePath}" -b "${safeBranchName}"`
      
      execSync(command, { 
        cwd: this.baseRepoPath, 
        stdio: 'inherit' 
      })
      
      console.log(chalk.green(`✅ Worktree created successfully!`))
      console.log(chalk.gray(`   Path: ${worktreePath}`))
      console.log(chalk.gray(`   Branch: ${safeBranchName}`))
      
      return worktreePath
    } catch (error) {
      console.error(chalk.red(`Failed to create worktree for issue #${issueNumber}: ${error.message}`))
      throw error
    }
  }

  /**
   * Remove a worktree for a GitHub issue
   * @param {number} issueNumber - GitHub issue number
   * @returns {Promise<void>}
   */
  async removeWorktree(issueNumber) {
    const worktreePath = path.join(this.worktreeBasePath, `issue-${issueNumber}`)
    
    try {
      if (!fs.existsSync(worktreePath)) {
        console.log(chalk.yellow(`Worktree for issue #${issueNumber} does not exist`))
        return
      }

      console.log(chalk.blue(`Removing worktree for issue #${issueNumber}...`))
      
      // Remove the worktree
      const command = `git worktree remove "${worktreePath}"`
      execSync(command, { 
        cwd: this.baseRepoPath, 
        stdio: 'inherit' 
      })
      
      console.log(chalk.green(`✅ Worktree removed successfully!`))
    } catch (error) {
      console.error(chalk.red(`Failed to remove worktree for issue #${issueNumber}: ${error.message}`))
      
      // If git worktree remove fails, try to force remove
      try {
        execSync(`git worktree remove --force "${worktreePath}"`, { 
          cwd: this.baseRepoPath, 
          stdio: 'inherit' 
        })
        console.log(chalk.green(`✅ Worktree force-removed successfully!`))
      } catch (forceError) {
        console.error(chalk.red(`Failed to force-remove worktree: ${forceError.message}`))
        throw forceError
      }
    }
  }

  /**
   * List all active worktrees
   * @returns {Promise<Array>} - Array of worktree info objects
   */
  async listWorktrees() {
    try {
      const output = execSync('git worktree list --porcelain', { 
        cwd: this.baseRepoPath, 
        encoding: 'utf-8' 
      })
      
      const worktrees = []
      const lines = output.trim().split('\n')
      let currentWorktree = {}
      
      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          if (Object.keys(currentWorktree).length > 0) {
            worktrees.push(currentWorktree)
          }
          currentWorktree = { path: line.replace('worktree ', '') }
        } else if (line.startsWith('HEAD ')) {
          currentWorktree.head = line.replace('HEAD ', '')
        } else if (line.startsWith('branch ')) {
          currentWorktree.branch = line.replace('branch ', '').replace('refs/heads/', '')
        } else if (line === 'bare') {
          currentWorktree.bare = true
        } else if (line === 'detached') {
          currentWorktree.detached = true
        }
      }
      
      if (Object.keys(currentWorktree).length > 0) {
        worktrees.push(currentWorktree)
      }
      
      return worktrees
    } catch (error) {
      console.error(chalk.red(`Failed to list worktrees: ${error.message}`))
      throw error
    }
  }

  /**
   * Get worktree path for a specific issue (finds most recent)
   * @param {number} issueNumber - GitHub issue number
   * @returns {string} - Path to the worktree
   */
  getWorktreePath(issueNumber) {
    // Find the most recent worktree for this issue
    const worktrees = fs.readdirSync(this.worktreeBasePath)
      .filter(dir => dir.startsWith(`issue-${issueNumber}-`))
      .sort()
      .reverse()
    
    if (worktrees.length > 0) {
      return path.join(this.worktreeBasePath, worktrees[0])
    }
    
    return path.join(this.worktreeBasePath, `issue-${issueNumber}`)
  }

  /**
   * Check if a worktree exists for an issue
   * @param {number} issueNumber - GitHub issue number
   * @returns {boolean} - True if worktree exists
   */
  worktreeExists(issueNumber) {
    const worktreePath = this.getWorktreePath(issueNumber)
    return fs.existsSync(worktreePath)
  }

  /**
   * Get branch name for an issue
   * @param {number} issueNumber - GitHub issue number
   * @returns {string} - Branch name
   */
  getBranchName(issueNumber) {
    return `fix/issue-${issueNumber}`
  }

  /**
   * Clean up all worktrees (for maintenance)
   * @returns {Promise<void>}
   */
  async cleanupAll() {
    try {
      const worktrees = await this.listWorktrees()
      const issueWorktrees = worktrees.filter(w => 
        w.path.includes('issue-') && !w.path.includes(this.baseRepoPath)
      )

      console.log(chalk.blue(`Found ${issueWorktrees.length} issue worktrees to clean up`))
      
      for (const worktree of issueWorktrees) {
        try {
          execSync(`git worktree remove "${worktree.path}"`, { 
            cwd: this.baseRepoPath, 
            stdio: 'inherit' 
          })
          console.log(chalk.green(`✅ Cleaned up worktree: ${worktree.path}`))
        } catch (error) {
          console.error(chalk.red(`Failed to clean up ${worktree.path}: ${error.message}`))
        }
      }
    } catch (error) {
      console.error(chalk.red(`Failed to cleanup worktrees: ${error.message}`))
      throw error
    }
  }

  /**
   * Execute a command in a worktree directory
   * @param {number} issueNumber - GitHub issue number
   * @param {string} command - Command to execute
   * @returns {Promise<string>} - Command output
   */
  async executeInWorktree(issueNumber, command) {
    const worktreePath = this.getWorktreePath(issueNumber)
    
    if (!fs.existsSync(worktreePath)) {
      throw new Error(`Worktree for issue #${issueNumber} does not exist`)
    }

    return new Promise((resolve, reject) => {
      exec(command, { cwd: worktreePath }, (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })
  }
}