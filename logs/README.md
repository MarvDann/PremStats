# Logs Directory

Organized storage for application and script logs.

## 📁 Directory Structure

### `/api/` - API Server Logs
- `api.log` - Main API server logs
- `error.log` - API error logs
- `access.log` - HTTP request logs
- `database.log` - Database query logs

### `/agents/` - Agent System Logs
- `data-agent.log` - Data processing agent logs
- `frontend-agent.log` - Frontend development agent logs
- `backend-agent.log` - Backend development agent logs
- `agent-cli.log` - Agent CLI command logs

### `/scripts/` - Script Execution Logs
- `dev-restart.log` - Development restart script logs
- `e2e-tests.log` - End-to-end test execution logs
- `maintenance.log` - Maintenance script logs
- `setup.log` - Environment setup logs

### `/data-import/` - Data Import Process Logs
- `squad-import.log` - Squad data import logs
- `season-import.log` - Season data import logs
- `player-import.log` - Player data import logs
- `audit.log` - Data quality audit logs

## 🔧 Log Configuration

### Log Levels
- **ERROR** - Error conditions requiring attention
- **WARN** - Warning conditions that should be monitored
- **INFO** - General information about operations
- **DEBUG** - Detailed information for debugging

### Log Rotation
Logs are rotated based on:
- Size: Maximum 100MB per file
- Time: Daily rotation for active logs
- Retention: Keep 30 days of historical logs

### Log Format
```
[TIMESTAMP] [LEVEL] [SOURCE] MESSAGE
2025-01-12T15:30:00Z [INFO] [API] Server started on port 8081
```

## 📋 Best Practices

### For Scripts
```bash
# Redirect output to appropriate log
./script.sh >> logs/scripts/script-name.log 2>&1

# With timestamp
echo "$(date): Starting script" >> logs/scripts/script-name.log
```

### For Applications
- Use structured logging (JSON format)
- Include correlation IDs for request tracking
- Log both successes and failures
- Avoid logging sensitive information

## 🔍 Log Monitoring

### Common Monitoring Commands
```bash
# Watch API logs in real-time
tail -f logs/api/api.log

# Search for errors
grep "ERROR" logs/api/*.log

# Monitor data imports
tail -f logs/data-import/squad-import.log

# Check script execution
grep "$(date +%Y-%m-%d)" logs/scripts/*.log
```

### Log Analysis
- Use `grep`, `awk`, and `sed` for log analysis
- Consider tools like `jq` for JSON log parsing
- Monitor disk usage of log directories

## 🚨 Alert Conditions

Monitor logs for:
- Error patterns in API logs
- Failed data imports
- Script execution failures
- Database connection issues
- High memory or CPU usage patterns

## 🗂️ Log Retention Policy

- **Active logs**: Keep indefinitely while in use
- **Daily logs**: Rotate and keep for 30 days
- **Error logs**: Keep for 90 days
- **Import logs**: Keep for 60 days (for audit trail)

## 🔗 Related Documentation

- [Development Scripts](../scripts/dev/README.md)
- [Data Import Scripts](../scripts/data/README.md)
- [Maintenance Scripts](../scripts/maintenance/README.md)