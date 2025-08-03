#!/usr/bin/env node

/**
 * Hook Logger Script - Node.js version
 * Reads JSON input from stdin and appends to hook-specific JSON files
 * Maintains valid JSON array format in each file
 * Includes log rotation to prevent files from becoming too large
 * 
 * Usage: echo '{"hook_event_name": "PreToolUse", ...}' | node scripts/hook-logger.js
 */

import fs from 'fs';
import path from 'path';

// Configuration
const CONFIG = {
  maxFileSize: 1024 * 1024, // 1MB in bytes
  maxArchives: 5,            // Keep 5 archived files
  rotationEnabled: true      // Enable/disable rotation
};

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs', 'hooks');
fs.mkdirSync(logsDir, { recursive: true });

/**
 * Rotate log file if it exceeds max size
 * @param {string} filePath - Path to the current log file
 */
function rotateLogFile(filePath) {
  if (!CONFIG.rotationEnabled) return;
  
  try {
    const stats = fs.statSync(filePath);
    if (stats.size <= CONFIG.maxFileSize) return;
    
    const dir = path.dirname(filePath);
    const basename = path.basename(filePath, '.json');
    
    // Shift existing archives (file.4.json -> file.5.json, etc.)
    for (let i = CONFIG.maxArchives; i >= 1; i--) {
      const currentArchive = path.join(dir, `${basename}.${i}.json`);
      const nextArchive = path.join(dir, `${basename}.${i + 1}.json`);
      
      if (fs.existsSync(currentArchive)) {
        if (i === CONFIG.maxArchives) {
          // Delete oldest archive
          fs.unlinkSync(currentArchive);
        } else {
          // Move to next archive number
          fs.renameSync(currentArchive, nextArchive);
        }
      }
    }
    
    // Move current file to .1 archive
    const firstArchive = path.join(dir, `${basename}.1.json`);
    fs.renameSync(filePath, firstArchive);
    
    console.log(`Log rotated: ${path.basename(filePath)} -> ${path.basename(firstArchive)}`);
    
  } catch (error) {
    console.warn(`Warning: Log rotation failed for ${filePath}:`, error.message);
  }
}

// Read JSON from stdin
let inputData = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    // Parse the JSON input
    const hookData = JSON.parse(inputData.trim());
    
    // Extract hook event name
    const hookEvent = hookData.hook_event_name || 'unknown';
    
    // Add timestamp to the data
    const timestampedData = {
      ...hookData,
      processed_timestamp: new Date().toISOString(),
      hook_id: `${hookEvent}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Determine output file based on hook event only (no tool name)
    const outputFile = path.join(logsDir, `${hookEvent}.json`);
    
    // Check if rotation is needed before writing
    if (fs.existsSync(outputFile)) {
      rotateLogFile(outputFile);
    }
    
    // Read existing file or create new array
    let existingData = [];
    if (fs.existsSync(outputFile)) {
      try {
        const existingContent = fs.readFileSync(outputFile, 'utf8').trim();
        if (existingContent) {
          existingData = JSON.parse(existingContent);
          if (!Array.isArray(existingData)) {
            existingData = [existingData]; // Convert single object to array
          }
        }
      } catch (parseError) {
        // If existing file is corrupted, start fresh
        console.warn(`Warning: Existing file ${outputFile} is corrupted, starting fresh`);
        existingData = [];
      }
    }
    
    // Add new entry to array
    existingData.push(timestampedData);
    
    // Write back the complete array as valid JSON
    fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
    
    // Also log to console for debugging
    console.log(`Hook logged: ${hookEvent} -> ${outputFile} (${existingData.length} entries)`);
    
    // Optionally maintain an index file for easy overview
    const indexFile = path.join(logsDir, 'index.log');
    const summary = `[${timestampedData.processed_timestamp}] ${hookEvent}: ${hookData.tool_name || 'unknown'}\n`;
    fs.appendFileSync(indexFile, summary);
    
  } catch (error) {
    // If JSON parsing fails, still log the raw input
    const errorFile = path.join(logsDir, 'error.json');
    const errorEntry = {
      error: 'JSON parsing failed',
      raw_input: inputData,
      timestamp: new Date().toISOString(),
      error_message: error.message
    };
    
    // Handle error file as array too
    let errorData = [];
    if (fs.existsSync(errorFile)) {
      try {
        const errorContent = fs.readFileSync(errorFile, 'utf8').trim();
        if (errorContent) {
          errorData = JSON.parse(errorContent);
          if (!Array.isArray(errorData)) {
            errorData = [errorData];
          }
        }
      } catch (e) {
        errorData = [];
      }
    }
    
    errorData.push(errorEntry);
    fs.writeFileSync(errorFile, JSON.stringify(errorData, null, 2));
    
    console.error('Hook logging error:', error.message);
    process.exit(1);
  }
});

process.stdin.on('error', (error) => {
  console.error('Stdin error:', error);
  process.exit(1);
});