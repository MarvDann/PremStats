#!/usr/bin/env node

/**
 * Clear Hook Logs - Node.js version
 * Removes hook log files with optional filtering
 * 
 * Usage: 
 *   node scripts/clear-hook-logs.js                   # Clear all logs
 *   node scripts/clear-hook-logs.js PreToolUse        # Clear only PreToolUse logs
 *   node scripts/clear-hook-logs.js --confirm         # Skip confirmation prompt
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const logsDir = path.join(process.cwd(), 'logs', 'hooks');
const args = process.argv.slice(2);

// Parse command line arguments
let filterHook = null;
let skipConfirmation = false;

for (const arg of args) {
  if (arg === '--confirm') {
    skipConfirmation = true;
  } else if (!arg.startsWith('--')) {
    filterHook = arg;
  }
}

async function promptConfirmation(message) {
  if (skipConfirmation) return true;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  try {
    if (!fs.existsSync(logsDir)) {
      console.log('No hook logs directory found.');
      return;
    }

    const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('No hook log files found.');
      return;
    }

    let filesToDelete = files;
    
    // Apply hook filter if specified
    if (filterHook) {
      filesToDelete = files.filter(f => {
        const hookType = path.basename(f, '.json');
        return hookType === filterHook;
      });
      
      if (filesToDelete.length === 0) {
        console.log(`No log files found for hook: ${filterHook}`);
        return;
      }
    }

    // Show what will be deleted
    console.log('\nFiles to be deleted:');
    filesToDelete.forEach(file => {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const size = stats.size;
      const hookType = path.basename(file, '.json');
      
      // Count entries in the JSON array
      let entryCount = 0;
      try {
        const content = fs.readFileSync(filePath, 'utf8').trim();
        if (content) {
          const parsed = JSON.parse(content);
          entryCount = Array.isArray(parsed) ? parsed.length : 1;
        }
      } catch (e) {
        entryCount = 0;
      }
      
      console.log(`  - ${file} (${hookType}, ${entryCount} entries, ${size} bytes)`);
    });

    // Confirm deletion
    const message = filterHook 
      ? `Delete ${filesToDelete.length} log file(s) for hook '${filterHook}'?`
      : `Delete all ${filesToDelete.length} hook log files?`;
      
    const confirmed = await promptConfirmation(message);
    
    if (!confirmed) {
      console.log('Operation cancelled.');
      return;
    }

    // Delete files
    let deletedCount = 0;
    for (const file of filesToDelete) {
      try {
        const filePath = path.join(logsDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted: ${file}`);
      } catch (error) {
        console.error(`Error deleting ${file}:`, error.message);
      }
    }

    // Also clean up index.log if deleting all files
    if (!filterHook && deletedCount > 0) {
      const indexFile = path.join(logsDir, 'index.log');
      if (fs.existsSync(indexFile)) {
        fs.unlinkSync(indexFile);
        console.log('Deleted: index.log');
      }
    }

    console.log(`\nDeleted ${deletedCount} log file(s).`);

  } catch (error) {
    console.error('Error clearing hook logs:', error.message);
    process.exit(1);
  }
}

main();