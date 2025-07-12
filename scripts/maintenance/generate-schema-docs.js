#!/usr/bin/env node

/**
 * Automated Database Schema Documentation Generator
 * 
 * This script connects to the PostgreSQL database and generates
 * an updated DATABASE_SCHEMA.md file with current schema information.
 */

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  database: 'premstats',
  user: 'premstats',
  password: 'premstats'
}

const OUTPUT_FILE = path.join(__dirname, '../../docs/DATABASE_SCHEMA.md')

class SchemaDocGenerator {
  constructor() {
    this.client = new Client(DB_CONFIG)
    this.tables = new Map()
    this.indexes = new Map()
    this.foreignKeys = new Map()
    this.stats = {}
  }

  async connect() {
    try {
      await this.client.connect()
      console.log('✅ Connected to database')
    } catch (error) {
      console.error('❌ Database connection failed:', error.message)
      process.exit(1)
    }
  }

  async disconnect() {
    await this.client.end()
    console.log('🔌 Disconnected from database')
  }

  async gatherTableInfo() {
    console.log('📊 Gathering table information...')
    
    const query = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.is_nullable,
        c.column_default,
        tc.constraint_type,
        kcu.constraint_name
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN information_schema.key_column_usage kcu ON c.column_name = kcu.column_name 
        AND c.table_name = kcu.table_name
      LEFT JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
      WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `

    const result = await this.client.query(query)
    
    for (const row of result.rows) {
      if (!this.tables.has(row.table_name)) {
        this.tables.set(row.table_name, { columns: [], constraints: [] })
      }
      
      const table = this.tables.get(row.table_name)
      
      if (row.column_name) {
        table.columns.push({
          name: row.column_name,
          type: this.formatDataType(row.data_type, row.character_maximum_length),
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
          constraint: row.constraint_type
        })
      }
    }
  }

  async gatherIndexInfo() {
    console.log('🔍 Gathering index information...')
    
    const query = `
      SELECT 
        t.relname as table_name,
        i.relname as index_name,
        array_agg(a.attname ORDER BY c.ordinality) as columns
      FROM pg_class t
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN unnest(ix.indkey) WITH ORDINALITY AS c(colnum, ordinality) ON true
      JOIN pg_attribute a ON t.oid = a.attrelid AND a.attnum = c.colnum
      WHERE t.relkind = 'r'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND NOT ix.indisprimary
      GROUP BY t.relname, i.relname
      ORDER BY t.relname, i.relname;
    `

    const result = await this.client.query(query)
    
    for (const row of result.rows) {
      if (!this.indexes.has(row.table_name)) {
        this.indexes.set(row.table_name, [])
      }
      this.indexes.get(row.table_name).push({
        name: row.index_name,
        columns: row.columns
      })
    }
  }

  async gatherForeignKeys() {
    console.log('🔗 Gathering foreign key information...')
    
    const query = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name;
    `

    const result = await this.client.query(query)
    
    for (const row of result.rows) {
      if (!this.foreignKeys.has(row.table_name)) {
        this.foreignKeys.set(row.table_name, [])
      }
      this.foreignKeys.get(row.table_name).push({
        column: row.column_name,
        referencesTable: row.foreign_table_name,
        referencesColumn: row.foreign_column_name,
        constraintName: row.constraint_name
      })
    }
  }

  async gatherDatabaseStats() {
    console.log('📈 Gathering database statistics...')
    
    // Get table counts
    const countQueries = [
      'SELECT COUNT(*) as count FROM teams',
      'SELECT COUNT(*) as count FROM players', 
      'SELECT COUNT(*) as count FROM matches',
      'SELECT COUNT(*) as count FROM seasons',
      'SELECT COUNT(*) as count FROM goals',
      'SELECT COUNT(DISTINCT season_id) as count FROM matches WHERE home_score IS NOT NULL'
    ]

    const [teams, players, matches, seasons, goals, seasonsWithData] = await Promise.all(
      countQueries.map(query => this.client.query(query))
    )

    // Get date range
    const dateRange = await this.client.query(`
      SELECT 
        MIN(EXTRACT(year FROM match_date)) as min_year,
        MAX(EXTRACT(year FROM match_date)) as max_year
      FROM matches
    `)

    this.stats = {
      teams: teams.rows[0].count,
      players: players.rows[0].count,
      matches: matches.rows[0].count,
      seasons: seasons.rows[0].count,
      goals: goals.rows[0].count,
      seasonsWithData: seasonsWithData.rows[0].count,
      minYear: dateRange.rows[0].min_year,
      maxYear: dateRange.rows[0].max_year
    }
  }

  formatDataType(type, length) {
    if (type === 'character varying' && length) {
      return `varchar(${length})`
    }
    if (type === 'timestamp without time zone') {
      return 'timestamp'
    }
    return type
  }

  generateMermaidDiagram() {
    const tables = Array.from(this.tables.keys()).sort()
    let diagram = '```mermaid\\nerDiagram\\n'
    
    // Define tables
    for (const tableName of tables) {
      const table = this.tables.get(tableName)
      const tableNameUpper = tableName.toUpperCase()
      
      diagram += `    ${tableNameUpper} {\\n`
      
      for (const column of table.columns) {
        const pkIndicator = column.constraint === 'PRIMARY KEY' ? ' PK' : ''
        const fkIndicator = this.foreignKeys.has(tableName) && 
          this.foreignKeys.get(tableName).some(fk => fk.column === column.name) ? ' FK' : ''
        const nullable = column.nullable ? ' "nullable"' : ''
        
        diagram += `        ${column.type} ${column.name}${pkIndicator}${fkIndicator}${nullable}\\n`
      }
      
      diagram += '    }\\n\\n'
    }

    // Add relationships
    diagram += '    %% Relationships\\n'
    for (const [tableName, fks] of this.foreignKeys) {
      for (const fk of fks) {
        const fromTable = tableName.toUpperCase()
        const toTable = fk.referencesTable.toUpperCase()
        diagram += `    ${toTable} ||--o{ ${fromTable} : "has"\\n`
      }
    }
    
    diagram += '```'
    return diagram
  }

  generateTableDetails() {
    let content = '## Table Details\\n\\n'
    const sortedTables = Array.from(this.tables.keys()).sort()
    
    for (const tableName of sortedTables) {
      const table = this.tables.get(tableName)
      
      content += `### \\`${tableName}\\`\\n`
      content += `Database table for ${this.getTableDescription(tableName)}.\\n\\n`
      
      // Column details
      content += '| Column | Type | Constraints | Description |\\n'
      content += '|--------|------|-------------|-------------|\\n'
      
      for (const column of table.columns) {
        const constraints = []
        
        if (column.constraint === 'PRIMARY KEY') constraints.push('PRIMARY KEY')
        if (this.foreignKeys.has(tableName)) {
          const fk = this.foreignKeys.get(tableName).find(f => f.column === column.name)
          if (fk) constraints.push('FOREIGN KEY')
        }
        if (!column.nullable) constraints.push('NOT NULL')
        if (column.default) constraints.push(`DEFAULT ${column.default}`)
        
        const constraintText = constraints.join(', ') || 'NULLABLE'
        const description = this.getColumnDescription(tableName, column.name)
        
        content += `| \\`${column.name}\\` | \\`${column.type}\\` | ${constraintText} | ${description} |\\n`
      }
      
      // Indexes
      if (this.indexes.has(tableName)) {
        content += '\\n**Indexes:**\\n'
        for (const index of this.indexes.get(tableName)) {
          content += `- \\`${index.name}\\` on \\`${index.columns.join(', ')}\\`\\n`
        }
      }
      
      // Foreign keys
      if (this.foreignKeys.has(tableName)) {
        content += '\\n**Foreign Keys:**\\n'
        for (const fk of this.foreignKeys.get(tableName)) {
          content += `- \\`${fk.column}\\` → \\`${fk.referencesTable}.${fk.referencesColumn}\\`\\n`
        }
      }
      
      content += '\\n'
    }
    
    return content
  }

  getTableDescription(tableName) {
    const descriptions = {
      seasons: 'Premier League seasons from 1992/93 to present',
      teams: 'All Premier League teams (current and historical)',
      matches: 'Match results and fixture data',
      players: 'Player biographical information and current team tracking',
      goals: 'Individual goal events within matches',
      match_events: 'Detailed in-match events and occurrences',
      standings: 'League table positions and statistics',
      player_stats: 'Season-by-season player statistics',
      team_seasons: 'Team participation and outcomes by season'
    }
    return descriptions[tableName] || 'database records'
  }

  getColumnDescription(tableName, columnName) {
    // Add specific column descriptions based on common patterns
    if (columnName === 'id') return 'Auto-increment primary key'
    if (columnName === 'created_at') return 'Record creation timestamp'
    if (columnName === 'updated_at') return 'Last update timestamp'
    if (columnName.endsWith('_id')) return `Reference to ${columnName.replace('_id', '')} table`
    if (columnName === 'name') return 'Name identifier'
    
    // Table-specific descriptions
    const specific = {
      matches: {
        home_score: 'Home team final score',
        away_score: 'Away team final score',
        match_date: 'Match date and time'
      },
      players: {
        current_team_id: 'Current team reference',
        position: 'Playing position',
        nationality: 'Player nationality'
      }
    }
    
    return specific[tableName]?.[columnName] || 'Data field'
  }

  async generateDocumentation() {
    const timestamp = new Date().toISOString().split('T')[0]
    
    let content = `# PremStats Database Schema Documentation

## Overview

The PremStats database is designed to store comprehensive Premier League historical data from 1992/93 to present. The schema supports match results, team information, player statistics, and historical tracking across seasons.

## Database Statistics

- **Total Matches**: ${this.stats.matches.toLocaleString()} (${this.stats.seasonsWithData} complete seasons)
- **Teams**: ${this.stats.teams} (all teams that have played in Premier League)
- **Players**: ${this.stats.players.toLocaleString()} (with current team tracking)
- **Seasons**: ${this.stats.seasons} (${this.stats.minYear} to ${this.stats.maxYear})
- **Database Engine**: PostgreSQL 16
- **Last Updated**: ${timestamp}

## Schema Diagram

${this.generateMermaidDiagram()}

${this.generateTableDetails()}

## Key Relationships

### Primary Relationships
- **Seasons → Matches**: One-to-many (each season has many matches)
- **Teams → Matches**: One-to-many (teams play multiple matches as home/away)
- **Matches → Goals**: One-to-many (matches contain multiple goals)
- **Matches → Match Events**: One-to-many (matches contain multiple events)
- **Players → Goals**: One-to-many (players score multiple goals)
- **Players → Match Events**: One-to-many (players participate in multiple events)

### Statistical Relationships
- **Seasons → Standings**: One-to-many (season has league table entries)
- **Teams → Standings**: One-to-many (team appears in multiple season tables)
- **Players → Player Stats**: One-to-many (player has stats for multiple seasons)

## Database Triggers

### Automatic Timestamp Updates
The following tables have \`updated_at\` triggers:
- \`teams\`
- \`matches\` 
- \`players\`
- \`player_stats\`

**Trigger Function**: \`update_updated_at_column()\` - Updates \`updated_at\` to current timestamp on row modification.

## Data Integrity Features

### Foreign Key Constraints
All relationships are enforced with foreign key constraints to maintain referential integrity.

### Unique Constraints
- Season names must be unique
- Team names must be unique
- External IDs must be unique (where present)
- Player stats are unique per player/season/team combination

### Default Values
- Most statistical fields default to 0
- Timestamps default to current time
- Boolean flags default to false
- Match status defaults to 'scheduled'

## Performance Optimizations

### Indexes
${Array.from(this.indexes.entries()).map(([table, indexes]) => 
  `- **${table}**: ${indexes.map(idx => `\`${idx.name}\``).join(', ')}`
).join('\\n')}

### Query Patterns
The schema is optimized for common query patterns:
- Season-based match listings
- Team vs team historical records
- League table generation
- Player goal/assist statistics
- Historical team performance analysis

## Data Sources & Import Process

### Historical Data (1992/93 - ${this.stats.maxYear})
- **Source**: football-data.co.uk CSV files, OpenFootball Project, Fantasy Premier League API
- **Coverage**: Complete match results with scores, dates, player information
- **Team Mapping**: Automated mapping from CSV names to database team names

### Current Season Updates
- **Source**: Multiple APIs and data feeds
- **Update Frequency**: Automated refresh via maintenance scripts
- **Quality Assurance**: Comprehensive data validation and audit trails

## Future Enhancements

### Planned Features
1. **Enhanced Match Events**: Comprehensive event tracking (cards, substitutions, etc.)
2. **Player Transfers**: Complete transfer history and valuations
3. **Stadium History**: Venue changes and capacity information
4. **Advanced Analytics**: Performance metrics and predictive modeling

### Schema Extensions
The current schema is designed to accommodate future enhancements while maintaining backward compatibility.

This schema provides a robust foundation for comprehensive Premier League statistical analysis while maintaining flexibility for future enhancements.

---
*Generated automatically on ${timestamp} by schema documentation generator*
`

    return content
  }

  async run() {
    try {
      console.log('🚀 Starting schema documentation generation...')
      
      await this.connect()
      await this.gatherTableInfo()
      await this.gatherIndexInfo()
      await this.gatherForeignKeys()
      await this.gatherDatabaseStats()
      
      console.log('📝 Generating documentation...')
      const documentation = await this.generateDocumentation()
      
      console.log('💾 Writing to file...')
      fs.writeFileSync(OUTPUT_FILE, documentation)
      
      console.log(`✅ Schema documentation generated successfully!`)
      console.log(`📄 Output: ${OUTPUT_FILE}`)
      console.log(`📊 Statistics: ${this.stats.matches} matches, ${this.stats.players} players, ${this.stats.teams} teams`)
      
    } catch (error) {
      console.error('❌ Error generating schema documentation:', error)
      process.exit(1)
    } finally {
      await this.disconnect()
    }
  }
}

// Run the generator
const generator = new SchemaDocGenerator()
generator.run()