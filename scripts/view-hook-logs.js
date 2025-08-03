#!/usr/bin/env node

/**
 * View Hook Logs - Node.js version
 * Displays hook logs from JSON files with optional filtering
 * 
 * Usage: 
 *   node scripts/view-hook-logs.js                    # Show all logs
 *   node scripts/view-hook-logs.js PreToolUse         # Show only PreToolUse logs  
 *   node scripts/view-hook-logs.js --recent 10        # Show last 10 entries
 */

import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs', 'hooks');
const args = process.argv.slice(2);

// Parse command line arguments
let filterHook = null;
let recentCount = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--recent' && i + 1 < args.length) {
    recentCount = parseInt(args[i + 1]);
    i++; // Skip the next argument
  } else if (!args[i].startsWith('--')) {
    filterHook = args[i];
  }
}

function readJsonArray(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return [];
    
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    } else {
      // Handle legacy single object format
      return [parsed];
    }
  } catch (error) {
    return [];
  }
}

function formatLogEntry(entry) {
  const timestamp = entry.processed_timestamp || entry.timestamp || 'Unknown time';
  const hookEvent = entry.hook_event_name || 'Unknown event';
  const toolName = entry.tool_name || 'Unknown tool';
  const hookId = entry.hook_id || 'No ID';
  
  let details = '';
  if (entry.tool_input) {
    // Extract key details from tool_input
    if (entry.tool_input.subagent_type) {
      details += ` (${entry.tool_input.subagent_type})`;
    }
    if (entry.tool_input.file_path) {
      details += ` -> ${entry.tool_input.file_path}`;
    }
    if (entry.tool_input.command) {
      details += ` -> ${entry.tool_input.command.substring(0, 50)}${entry.tool_input.command.length > 50 ? '...' : ''}`;
    }
    if (entry.tool_input.pattern) {
      details += ` -> ${entry.tool_input.pattern}`;
    }
  }
  
  return `[${timestamp}] ${hookEvent}: ${toolName}${details} (ID: ${hookId})`;
}

try {
  if (!fs.existsSync(logsDir)) {
    console.log('No hook logs directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.json') && f !== 'error.json');
  
  if (files.length === 0) {
    console.log('No hook log files found.');
    process.exit(0);
  }

  let allEntries = [];

  // Read all log files
  for (const file of files) {
    const hookType = path.basename(file, '.json');
    
    // Apply hook filter if specified
    if (filterHook && hookType !== filterHook) {
      continue;
    }
    
    const filePath = path.join(logsDir, file);
    const entries = readJsonArray(filePath);
    
    // Add source file info to each entry
    entries.forEach(entry => {
      entry._sourceFile = hookType;
    });
    
    allEntries = allEntries.concat(entries);
  }

  // Sort by timestamp
  allEntries.sort((a, b) => {
    const timeA = new Date(a.processed_timestamp || a.timestamp || 0);
    const timeB = new Date(b.processed_timestamp || b.timestamp || 0);
    return timeA - timeB;
  });

  // Apply recent count filter
  if (recentCount && recentCount > 0) {
    allEntries = allEntries.slice(-recentCount);
  }

  if (allEntries.length === 0) {
    console.log('No matching log entries found.');
    process.exit(0);
  }

  console.log(`\n=== Hook Logs ${filterHook ? `(${filterHook})` : ''} ===`);
  console.log(`Found ${allEntries.length} entries\n`);

  allEntries.forEach(entry => {
    console.log(formatLogEntry(entry));
  });

  console.log(`\n=== End of Logs ===`);

} catch (error) {
  console.error('Error reading hook logs:', error.message);
  process.exit(1);
}