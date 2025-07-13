#!/usr/bin/env node

import fs from 'fs'

const filePath = 'data/matches-test-fixed.csv'

console.log('🔍 Testing CSV parsing...')
console.log(`📁 File: ${filePath}`)

if (!fs.existsSync(filePath)) {
  console.log('❌ File does not exist')
  process.exit(1)
}

const csvContent = fs.readFileSync(filePath, 'utf8')
console.log(`📊 Raw content length: ${csvContent.length}`)
console.log(`📝 First 100 chars: "${csvContent.substring(0, 100)}..."`)

// Try different line splitting approaches
const methods = [
  { name: 'split(\\n)', lines: csvContent.split('\n') },
  { name: 'split(/\\r?\\n/)', lines: csvContent.split(/\r?\n/) },
  { name: 'split(/\\r\\n|\\r|\\n/)', lines: csvContent.split(/\r\n|\r|\n/) },
]

methods.forEach(({ name, lines }) => {
  const filtered = lines.filter(line => line.trim())
  console.log(`${name}: ${lines.length} total, ${filtered.length} non-empty`)
  if (filtered.length > 0) {
    console.log(`  First line: "${filtered[0].substring(0, 50)}..."`)
    if (filtered.length > 1) {
      console.log(`  Second line: "${filtered[1].substring(0, 50)}..."`)
    }
  }
})