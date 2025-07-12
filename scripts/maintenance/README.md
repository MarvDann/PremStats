# Maintenance Scripts

Scripts for ongoing maintenance, monitoring, data quality assurance, and automated tasks.

## 📋 Scripts Overview

### `daily-data-update.js`
**Priority: HIGH - Automated Daily Task**

Comprehensive daily maintenance and data update routine.

**Usage:**
```bash
node scripts/maintenance/daily-data-update.js
```

**Scheduling:**
```bash
# Add to crontab for daily execution at 6 AM
0 6 * * * cd /path/to/premstats && node scripts/maintenance/daily-data-update.js >> logs/maintenance/daily-update.log 2>&1
```

**Tasks Performed:**
- Refresh current season data
- Update player statistics
- Check data quality
- Generate daily reports
- Clean temporary files
- Backup critical data

**Expected Runtime:** 15-30 minutes

### `audit-seasons.js`
**Priority: HIGH - Data Quality Assurance**

Comprehensive database audit for season data integrity.

**Usage:**
```bash
node scripts/maintenance/audit-seasons.js [--season=YYYY/YY] [--fix]
```

**Options:**
- `--season` - Audit specific season only
- `--fix` - Automatically fix detected issues
- `--report` - Generate detailed audit report

**Audit Checks:**
- Season date ranges validation
- Match count verification (380 per season, 462 for early seasons)
- Score data completeness
- Team name consistency
- Duplicate match detection

**Output:** Updates `SEASON-AUDIT-SUMMARY.md` with results

### `audit-seasons-direct.sh`
**Priority: MEDIUM**

Direct database audit script using SQL queries.

**Usage:**
```bash
./scripts/maintenance/audit-seasons-direct.sh
```

**Features:**
- Faster execution than Node.js version
- Direct PostgreSQL queries
- Raw data validation
- Performance metrics

### `clean-duplicate-players.js`
**Priority: HIGH - Data Integrity**

Remove duplicate player records and merge statistics.

**Usage:**
```bash
node scripts/maintenance/clean-duplicate-players.js [--dry-run] [--aggressive]
```

**Options:**
- `--dry-run` - Show what would be cleaned without making changes
- `--aggressive` - Use fuzzy matching for name variations

**Cleaning Strategy:**
1. Exact name matches
2. Diacritic normalization
3. Fuzzy name matching
4. Manual review flagging

**Data Preservation:**
- Merges statistics from duplicate records
- Preserves most complete biographical data
- Maintains referential integrity
- Creates audit trail of changes

### `agent-cli.js`
**Priority: MEDIUM - System Management**

Command-line interface for the multi-agent system.

**Usage:**
```bash
# Dispatch task to agent
node scripts/maintenance/agent-cli.js task data "Import latest FPL data"

# Check agent status
node scripts/maintenance/agent-cli.js status

# List available agents
node scripts/maintenance/agent-cli.js list

# View agent logs
node scripts/maintenance/agent-cli.js logs data
```

**Available Commands:**
- `task <agent> <description>` - Dispatch task
- `status` - Show agent system status
- `list` - List available agents
- `logs <agent>` - View agent logs
- `restart <agent>` - Restart specific agent

### `monitor-data-import.js`
**Priority: MEDIUM - Process Monitoring**

Monitor data import processes and detect issues.

**Usage:**
```bash
node scripts/maintenance/monitor-data-import.js [--watch]
```

**Monitoring Features:**
- Import process status tracking
- Performance metrics collection
- Error rate monitoring
- Alert generation for failures

**Alerts Triggered:**
- Import failures exceeding threshold
- Unusually long import times
- Data quality degradation
- System resource exhaustion

### `auto-refresh.js`
**Priority: LOW - Automated Updates**

Automated refresh system for live data updates.

**Usage:**
```bash
node scripts/maintenance/auto-refresh.js [--interval=minutes]
```

**Configuration:**
```bash
# Environment variables
REFRESH_INTERVAL=60  # minutes
REFRESH_SOURCES=fpl,current-season
AUTO_REFRESH_ENABLED=true
```

**Refresh Targets:**
- Current season match results
- Player statistics
- Team standings
- Live match data (when available)

### `setup-cron.sh`
**Priority: MEDIUM - System Configuration**

Configure automated cron jobs for maintenance tasks.

**Usage:**
```bash
./scripts/maintenance/setup-cron.sh [--install|--remove|--list]
```

**Configured Jobs:**
```bash
# Daily data update at 6 AM
0 6 * * * daily-data-update.js

# Weekly data audit on Sundays at 2 AM
0 2 * * 0 audit-seasons.js

# Hourly current season refresh during season
0 * * * * refresh-current-season.js

# Monthly duplicate cleanup
0 3 1 * * clean-duplicate-players.js
```

## 🔧 Configuration

### Environment Variables
```bash
# Maintenance Settings
MAINTENANCE_ENABLED=true
AUDIT_AUTO_FIX=false
CLEANUP_TEMP_FILES=true
BACKUP_BEFORE_MAINTENANCE=true

# Monitoring
ALERT_EMAIL=admin@premstats.com
ALERT_WEBHOOK=https://hooks.slack.com/...
MONITOR_INTERVAL=300  # seconds

# Performance
MAX_CONCURRENT_JOBS=3
MAINTENANCE_TIMEOUT=3600  # seconds
```

### Scheduling Configuration
```json
{
  "maintenance": {
    "daily": {
      "time": "06:00",
      "tasks": ["data-update", "audit", "cleanup"]
    },
    "weekly": {
      "day": "sunday",
      "time": "02:00", 
      "tasks": ["full-audit", "duplicate-cleanup"]
    }
  }
}
```

## 📊 Monitoring & Alerts

### Health Checks
Maintenance scripts include health checks for:
- Database connectivity
- API endpoint availability
- Data quality metrics
- System resource usage

### Alert Conditions
Monitor and alert on:
- Failed maintenance tasks
- Data quality degradation
- Import errors exceeding thresholds
- System performance issues
- Storage space warnings

### Reporting
Generate reports on:
- Maintenance task success rates
- Data quality trends
- System performance metrics
- Error patterns and resolutions

## 🚨 Troubleshooting

### Common Issues

**Maintenance Script Failures**
```bash
# Check script logs
tail -f logs/maintenance/daily-update.log

# Verify database connectivity
docker compose exec postgres psql -U premstats -d premstats -c "SELECT 1"

# Check system resources
df -h  # disk space
free -h  # memory usage
```

**Cron Job Issues**
```bash
# Check cron status
systemctl status cron

# View cron logs
grep "premstats" /var/log/syslog

# Test cron job manually
cd /path/to/premstats && node scripts/maintenance/daily-data-update.js
```

**Data Quality Issues**
```bash
# Run comprehensive audit
node scripts/maintenance/audit-seasons.js --report

# Check for duplicates
node scripts/maintenance/clean-duplicate-players.js --dry-run

# Verify data integrity
node scripts/maintenance/monitor-data-import.js
```

**Performance Issues**
```bash
# Check database performance
docker compose exec postgres pg_stat_activity

# Monitor script execution times
grep "DURATION" logs/maintenance/*.log

# Check system load
top
htop
```

## 📋 Maintenance Schedules

### Daily (Automated)
- Data updates and refresh
- Basic quality checks
- Temporary file cleanup
- Performance monitoring

### Weekly (Automated)
- Comprehensive data audit
- Duplicate player cleanup
- Full system health check
- Performance report generation

### Monthly (Manual)
- Deep data validation
- Database optimization
- Archive old logs
- Security updates

### Quarterly (Manual)
- Complete system audit
- Data source validation
- Performance optimization
- Documentation updates

## 🔍 Best Practices

### Before Running Maintenance
1. Backup critical data
2. Check system resources
3. Verify external dependencies
4. Review recent error logs

### During Maintenance
1. Monitor script progress
2. Watch for error conditions
3. Verify data integrity
4. Check system performance

### After Maintenance
1. Verify task completion
2. Review generated reports
3. Check data quality metrics
4. Update maintenance logs

## 📈 Performance Optimization

### Database Maintenance
- Regular VACUUM and ANALYZE
- Index optimization
- Query performance monitoring
- Connection pool management

### Script Optimization
- Batch processing for large datasets
- Parallel execution where safe
- Memory usage optimization
- Timeout management

### System Monitoring
- Resource usage tracking
- Performance baseline establishment
- Trend analysis
- Capacity planning

## 🔗 Related Documentation

- [Data Import Scripts](../data/README.md)
- [Development Scripts](../dev/README.md)
- [Database Schema](../../docs/DATABASE_SCHEMA.md)
- [System Monitoring](../../docs/monitoring.md)