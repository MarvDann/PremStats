# PremStats Scripts

This directory contains organized scripts for development, data management, maintenance, and database operations.

## 📁 Directory Structure

### `/dev/` - Development Scripts
Scripts for local development, testing, and environment setup.

- **dev-restart.sh** - Streamlined API restart process
- **restart-api.sh** - Kill and restart API server
- **start-api.sh** - Start API server with proper configuration
- **start-frontend.sh** - Start frontend development server
- **run-e2e-tests.sh** - Execute end-to-end tests with dependencies
- **setup.sh** - Initial development environment setup
- **test-historical-api.js** - Test historical data API endpoints

### `/data/` - Data Import Scripts
Scripts for importing, processing, and managing football data from various sources.

- **import-fpl-data.js** - Import Fantasy Premier League player data
- **import-squad-data.js** - Import squad/team data by season
- **import-all-seasons.js** - Bulk import all historical seasons
- **import-historical-scorers.js** - Import goal scorer data
- **import-player-data.js** - Import player biographical data
- **import-top-scorers.js** - Import top scorers by season
- **manual-season-import.js** - Manual season data import utility
- **refresh-current-season.js** - Update current season data
- **debug-csv-import.js** - Debug CSV import issues
- **check-available-seasons.js** - Check data availability

### `/maintenance/` - Maintenance & Monitoring
Scripts for ongoing maintenance, monitoring, and automated tasks.

- **agent-cli.js** - Command-line interface for agent system
- **audit-seasons.js** - Database season data quality audit
- **audit-seasons-direct.sh** - Direct database audit script
- **auto-refresh.js** - Automated data refresh system
- **clean-duplicate-players.js** - Remove duplicate player records
- **daily-data-update.js** - Daily automated data updates
- **monitor-data-import.js** - Monitor data import processes
- **setup-cron.sh** - Configure automated cron jobs

### `/database/` - Database Scripts
SQL files and database schema management scripts.

- **init-db.sql** - Initial database setup
- **add-historical-teams.sql** - Add historical team data
- **add-missing-seasons.sql** - Add missing season records
- **goal-scorers-schema.sql** - Goal scorers table schema
- **player-transfers-schema.sql** - Player transfer tracking schema
- **stadium-history-schema.sql** - Stadium information schema
- **team-seasons-schema.sql** - Team participation by season schema
- **migrate-external-ids.sql** - Migrate external ID references
- **update-team-names.sql** - Standardize team names
- **add-match-stats-columns.js** - Add match statistics columns
- **add-sample-match-events.js** - Add sample match event data
- **add-sample-match-stats.js** - Add sample match statistics

## 🚀 Quick Start

### Development Setup
```bash
# Initial setup
./scripts/dev/setup.sh

# Start development environment
./scripts/dev/start-api.sh
./scripts/dev/start-frontend.sh

# Run tests
./scripts/dev/run-e2e-tests.sh
```

### Data Import
```bash
# Import basic data (run in order)
node scripts/data/import-squad-data.js
node scripts/data/import-fpl-data.js
node scripts/data/import-all-seasons.js

# Import goal scorer data
node scripts/data/import-historical-scorers.js
```

### Maintenance
```bash
# Daily maintenance
node scripts/maintenance/daily-data-update.js

# Data quality audit
node scripts/maintenance/audit-seasons.js

# Clean duplicates
node scripts/maintenance/clean-duplicate-players.js
```

## 🔧 Configuration

Most scripts read configuration from:
- Environment variables
- `package.json` in this directory
- Project root configuration files

### Common Environment Variables
```bash
DATABASE_URL=postgres://premstats:premstats@localhost:5432/premstats
API_URL=http://localhost:8081
NODE_ENV=development
```

## 📋 Script Dependencies

### Prerequisites
- Node.js 18+
- PostgreSQL running (via Docker)
- API server (for some scripts)
- Valid environment configuration

### Execution Order for Fresh Setup
1. Database initialization (`database/init-db.sql`)
2. Development setup (`dev/setup.sh`)
3. Squad data import (`data/import-squad-data.js`)
4. Season data import (`data/import-all-seasons.js`)
5. Additional data as needed

## 🔍 Troubleshooting

### Common Issues

**Script Permission Denied**
```bash
chmod +x scripts/dev/*.sh
chmod +x scripts/maintenance/*.sh
```

**Database Connection Errors**
- Ensure PostgreSQL is running via Docker
- Check DATABASE_URL environment variable
- Verify database credentials

**API Connection Errors**
- Ensure API server is running on port 8081
- Check for port conflicts
- Verify API health endpoint

**Import Failures**
- Check data source availability
- Verify file paths and permissions
- Review script logs for specific errors

## 📖 Best Practices

### Development
- Always check `pwd` before running scripts
- Use absolute paths when possible
- Test scripts in development environment first

### Data Import
- Import squad data before goal scorer data
- Validate data before bulk imports
- Keep backups before major imports

### Maintenance
- Run audits before and after major changes
- Monitor script execution logs
- Schedule maintenance during low usage

## 🔗 Related Documentation

- [Database Schema](../docs/DATABASE_SCHEMA.md)
- [Development Workflow](../docs/development-workflow.md)
- [API Documentation](../docs/API.md)
- [Agent System](../agents/README.md)