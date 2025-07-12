# Database Scripts

SQL files and database schema management scripts for PremStats.

## 📋 Scripts Overview

### Schema & Initialization

#### `init-db.sql`
**Priority: CRITICAL - Initial Setup**

Complete database initialization script.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/init-db.sql
```

**Creates:**
- All core tables (teams, players, matches, seasons, etc.)
- Indexes for performance optimization
- Foreign key constraints
- Default data and lookup tables

**Prerequisites:** Empty PostgreSQL database

#### `add-historical-teams.sql`
Add historical Premier League teams to the teams table.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/add-historical-teams.sql
```

**Adds:**
- All teams that have played in Premier League
- Historical clubs (Wimbledon FC, etc.)
- Team metadata and external IDs

#### `add-missing-seasons.sql`
Add any missing season records to ensure complete coverage.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/add-missing-seasons.sql
```

**Ensures:**
- Complete season coverage (1992/93 - 2025/26)
- Proper season metadata
- Consistent season naming

### Schema Extensions

#### `goal-scorers-schema.sql`
Enhanced goal scorers and match events schema.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/goal-scorers-schema.sql
```

**Creates:**
- Enhanced goals table with detailed tracking
- Match events table for comprehensive event logging
- Player statistics aggregation views
- Performance indexes

#### `goal-scorers-schema-fixed.sql`
Corrected version of goal scorers schema with bug fixes.

**Usage:**
```bash
# Use this instead of goal-scorers-schema.sql
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/goal-scorers-schema-fixed.sql
```

#### `player-transfers-schema.sql`
Player transfer tracking system.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/player-transfers-schema.sql
```

**Creates:**
- Transfer history table
- Transfer window tracking
- Fee and contract information
- Player career timeline views

#### `stadium-history-schema.sql`
Stadium and venue information tracking.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/stadium-history-schema.sql
```

**Creates:**
- Stadium information table
- Capacity history tracking
- Venue changes over time
- Geographic information

#### `team-seasons-schema.sql`
Team participation and performance by season.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/team-seasons-schema.sql
```

**Creates:**
- Team season participation table
- Final positions and outcomes
- Promotion/relegation tracking
- Season performance metrics

### Data Migration & Updates

#### `migrate-external-ids.sql`
Migrate and standardize external ID references.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/migrate-external-ids.sql
```

**Updates:**
- External API ID mappings
- Cross-reference tables
- Data source tracking
- ID normalization

#### `update-team-names.sql`
Standardize team names across all tables.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/update-team-names.sql
```

**Standardizes:**
- Official team names
- Common abbreviations
- Historical name changes
- Display name consistency

#### `fix-table-function.sql`
Fix table functions and stored procedures.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/fix-table-function.sql
```

**Fixes:**
- Calculation functions
- Aggregation procedures
- Performance optimizations
- Bug corrections

#### `historical-seasons.sql`
Load complete historical season data.

**Usage:**
```bash
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/historical-seasons.sql
```

**Loads:**
- All historical Premier League seasons
- Season metadata and dates
- Team participation records
- League structure changes

### Sample Data & Testing

#### `add-sample-match-events.js`
Generate sample match event data for testing.

**Usage:**
```bash
node scripts/database/add-sample-match-events.js [--matches=100]
```

**Generates:**
- Sample goal events
- Card events (yellow/red)
- Substitution events
- Match timeline data

#### `add-sample-match-stats.js`
Generate sample match statistics for testing.

**Usage:**
```bash
node scripts/database/add-sample-match-stats.js [--season=YYYY/YY]
```

**Generates:**
- Player performance statistics
- Team aggregate statistics
- Match-level metrics
- Season summary data

#### `add-match-stats-columns.js`
Add additional match statistics columns.

**Usage:**
```bash
node scripts/database/add-match-stats-columns.js
```

**Adds:**
- Extended match statistics fields
- Performance tracking columns
- Analytics-ready data structure
- Backward compatibility

## 🗄️ Schema Evolution

### Version Control
Database schema changes are versioned and tracked:

1. **v1.0** - Initial schema (teams, players, matches, seasons)
2. **v1.1** - Added match events and goals tracking
3. **v1.2** - Enhanced player statistics and transfers
4. **v1.3** - Stadium history and venue tracking
5. **v1.4** - Performance optimizations and indexes

### Migration Strategy
```bash
# Check current schema version
SELECT version FROM schema_versions ORDER BY applied_at DESC LIMIT 1;

# Apply migrations in order
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/migration-v1-1.sql
docker compose exec postgres psql -U premstats -d premstats -f scripts/database/migration-v1-2.sql
```

## 🔧 Database Management

### Backup & Restore
```bash
# Create backup
docker compose exec postgres pg_dump -U premstats premstats > backup-$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U premstats -d premstats < backup-20250112.sql
```

### Performance Optimization
```sql
-- Analyze table statistics
ANALYZE;

-- Vacuum and reindex
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('matches', 'players', 'goals');
```

### Data Validation
```sql
-- Check referential integrity
SELECT COUNT(*) FROM matches WHERE home_team_id NOT IN (SELECT id FROM teams);
SELECT COUNT(*) FROM goals WHERE match_id NOT IN (SELECT id FROM matches);

-- Validate data ranges
SELECT season_id, COUNT(*) FROM matches GROUP BY season_id HAVING COUNT(*) NOT IN (380, 462);
```

## 🔍 Troubleshooting

### Common Issues

**Schema Conflicts**
```bash
# Check for conflicting tables
docker compose exec postgres psql -U premstats -d premstats -c "\dt"

# Drop and recreate if needed
docker compose exec postgres psql -U premstats -d premstats -c "DROP TABLE IF EXISTS table_name CASCADE;"
```

**Migration Failures**
```bash
# Check PostgreSQL logs
docker compose logs postgres

# Verify database connectivity
docker compose exec postgres psql -U premstats -d premstats -c "SELECT version();"

# Check for locked tables
docker compose exec postgres psql -U premstats -d premstats -c "SELECT * FROM pg_locks;"
```

**Performance Issues**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 📊 Database Monitoring

### Key Metrics
- Table sizes and growth rates
- Index usage efficiency
- Query performance
- Connection counts
- Lock contention

### Health Checks
```sql
-- Database health overview
SELECT 
    pg_database_size('premstats') as db_size,
    (SELECT COUNT(*) FROM matches) as total_matches,
    (SELECT COUNT(*) FROM players) as total_players,
    (SELECT COUNT(DISTINCT season_id) FROM matches) as seasons_with_data;
```

### Performance Monitoring
```sql
-- Active connections
SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active';

-- Cache hit ratio (should be > 95%)
SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
FROM pg_statio_user_tables;
```

## 🔗 Related Documentation

- [Database Schema](../../docs/DATABASE_SCHEMA.md)
- [Schema Diagram](../../docs/SCHEMA_DIAGRAM.md)
- [Data Import Scripts](../data/README.md)
- [API Documentation](../../docs/API.md)