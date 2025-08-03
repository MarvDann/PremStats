#!/usr/bin/env node

/**
 * Log Rotation Management Script
 * Provides utilities to manage hook log rotation manually
 * 
 * Usage:
 *   node scripts/manage-log-rotation.js status           # Show rotation status
 *   node scripts/manage-log-rotation.js rotate [hook]    # Force rotate specific hook or all
 *   node scripts/manage-log-rotation.js clean [days]     # Clean archives older than N days
 *   node scripts/manage-log-rotation.js list             # List all log files including archives
 */

import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs', 'hooks');
const CONFIG = {
  maxFileSize: 1024 * 1024, // 1MB in bytes
  maxArchives: 5,            // Keep 5 archived files
};

/**
 * Get file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get all hook log files (current and archived)
 */
function getAllLogFiles() {
  if (!fs.existsSync(logsDir)) return [];
  
  const files = fs.readdirSync(logsDir)
    .filter(file => file.endsWith('.json') && file !== 'error.json')
    .sort();
  
  return files.map(file => {
    const filePath = path.join(logsDir, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      path: filePath,
      size: stats.size,
      modified: stats.mtime,
      isArchive: /\.\d+\.json$/.test(file)
    };
  });
}

/**
 * Force rotate a specific hook log file
 */
function forceRotateFile(hookName) {
  const filePath = path.join(logsDir, `${hookName}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`No log file found for hook: ${hookName}`);
    return false;
  }
  
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath, '.json');
  
  try {
    // Shift existing archives
    for (let i = CONFIG.maxArchives; i >= 1; i--) {
      const currentArchive = path.join(dir, `${basename}.${i}.json`);
      const nextArchive = path.join(dir, `${basename}.${i + 1}.json`);
      
      if (fs.existsSync(currentArchive)) {
        if (i === CONFIG.maxArchives) {
          fs.unlinkSync(currentArchive);
          console.log(`Deleted oldest archive: ${basename}.${i}.json`);
        } else {
          fs.renameSync(currentArchive, nextArchive);
          console.log(`Moved: ${basename}.${i}.json -> ${basename}.${i + 1}.json`);
        }
      }
    }
    
    // Move current file to .1 archive
    const firstArchive = path.join(dir, `${basename}.1.json`);
    fs.renameSync(filePath, firstArchive);
    console.log(`Rotated: ${hookName}.json -> ${hookName}.1.json`);
    
    return true;
  } catch (error) {
    console.error(`Error rotating ${hookName}.json:`, error.message);
    return false;
  }
}

/**
 * Clean old archive files
 */
function cleanOldArchives(maxDays = 30) {
  const cutoffTime = Date.now() - (maxDays * 24 * 60 * 60 * 1000);
  const files = getAllLogFiles().filter(file => file.isArchive);
  
  let deletedCount = 0;
  
  for (const file of files) {
    if (file.modified.getTime() < cutoffTime) {
      try {
        fs.unlinkSync(file.path);
        console.log(`Deleted old archive: ${file.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting ${file.name}:`, error.message);
      }
    }
  }
  
  console.log(`Cleaned ${deletedCount} old archive files (older than ${maxDays} days)`);
}

/**
 * Show rotation status
 */
function showStatus() {
  const files = getAllLogFiles();
  const currentFiles = files.filter(f => !f.isArchive);
  const archiveFiles = files.filter(f => f.isArchive);
  
  console.log('=== Hook Log Rotation Status ===\n');
  
  console.log('Configuration:');
  console.log(`  Max file size: ${formatFileSize(CONFIG.maxFileSize)}`);
  console.log(`  Max archives: ${CONFIG.maxArchives}`);
  console.log('');
  
  console.log('Current log files:');
  if (currentFiles.length === 0) {
    console.log('  No current log files found');
  } else {
    for (const file of currentFiles) {
      const needsRotation = file.size > CONFIG.maxFileSize;
      const status = needsRotation ? ' (NEEDS ROTATION)' : '';
      console.log(`  ${file.name}: ${formatFileSize(file.size)}${status}`);
    }
  }
  console.log('');
  
  console.log('Archive files:');
  if (archiveFiles.length === 0) {
    console.log('  No archive files found');
  } else {
    const archiveGroups = {};
    archiveFiles.forEach(file => {
      const baseName = file.name.replace(/\.\d+\.json$/, '');
      if (!archiveGroups[baseName]) archiveGroups[baseName] = [];
      archiveGroups[baseName].push(file);
    });
    
    for (const [baseName, archives] of Object.entries(archiveGroups)) {
      console.log(`  ${baseName}: ${archives.length} archives`);
      archives.sort((a, b) => a.name.localeCompare(b.name)).forEach(archive => {
        console.log(`    ${archive.name}: ${formatFileSize(archive.size)}`);
      });
    }
  }
}

/**
 * List all log files
 */
function listFiles() {
  const files = getAllLogFiles();
  
  console.log('=== All Hook Log Files ===\n');
  
  if (files.length === 0) {
    console.log('No log files found');
    return;
  }
  
  const groups = {};
  files.forEach(file => {
    let baseName;
    if (file.isArchive) {
      baseName = file.name.replace(/\.\d+\.json$/, '');
    } else {
      baseName = file.name.replace(/\.json$/, '');
    }
    
    if (!groups[baseName]) groups[baseName] = [];
    groups[baseName].push(file);
  });
  
  for (const [baseName, groupFiles] of Object.entries(groups)) {
    console.log(`${baseName}:`);
    groupFiles.sort((a, b) => {
      // Sort current file first, then archives by number
      if (!a.isArchive && b.isArchive) return -1;
      if (a.isArchive && !b.isArchive) return 1;
      return a.name.localeCompare(b.name);
    }).forEach(file => {
      const type = file.isArchive ? '(archive)' : '(current)';
      console.log(`  ${file.name}: ${formatFileSize(file.size)} ${type}`);
    });
    console.log('');
  }
}

// Main execution
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'status':
    showStatus();
    break;
    
  case 'rotate':
    if (arg) {
      forceRotateFile(arg);
    } else {
      // Rotate all current files
      const currentFiles = getAllLogFiles().filter(f => !f.isArchive);
      console.log(`Rotating ${currentFiles.length} log files...`);
      currentFiles.forEach(file => {
        const hookName = file.name.replace('.json', '');
        forceRotateFile(hookName);
      });
    }
    break;
    
  case 'clean':
    const days = arg ? parseInt(arg) : 30;
    cleanOldArchives(days);
    break;
    
  case 'list':
    listFiles();
    break;
    
  default:
    console.log('Hook Log Rotation Manager');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/manage-log-rotation.js status           # Show rotation status');
    console.log('  node scripts/manage-log-rotation.js rotate [hook]    # Force rotate specific hook or all');
    console.log('  node scripts/manage-log-rotation.js clean [days]     # Clean archives older than N days (default: 30)');
    console.log('  node scripts/manage-log-rotation.js list             # List all log files including archives');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/manage-log-rotation.js status');
    console.log('  node scripts/manage-log-rotation.js rotate PreToolUse');
    console.log('  node scripts/manage-log-rotation.js clean 7');
    break;
}