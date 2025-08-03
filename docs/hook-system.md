# Hook System Documentation

## Overview
The enhanced hook system provides comprehensive logging and monitoring of all Claude Code tool usage. Every tool call is logged with detailed context, parameters, and execution results.

## Features

### 📝 Comprehensive Logging
- **Pre-tool execution**: Logs tool parameters and context before execution
- **Post-tool execution**: Logs results, success status, and execution details
- **Detailed context**: Captures environment, git status, and timing information
- **Structured data**: JSON context files for programmatic analysis

### 🔍 Log Organization
```
logs/hooks/
├── all-hooks.log          # Combined log of all hook activity
├── session-YYYYMMDD.log   # Daily session logs
├── detailed/              # Tool-specific detailed logs
│   ├── bash.log
│   ├── task.log
│   ├── edit.log
│   └── ...
└── context-*.json         # Structured context snapshots
```

### 🛠️ Supported Tools
All major Claude Code tools are monitored:
- **Task**: Agent orchestration and delegation
- **File Operations**: Write, Edit, MultiEdit, Read
- **System Commands**: Bash execution with command details
- **Search**: Glob and Grep operations
- **Web**: WebFetch and WebSearch activities
- **Task Management**: TodoWrite operations

## Usage

### View Hook Activity
```bash
# Show recent activity
./scripts/view-hook-logs.sh

# Show today's activity only
./scripts/view-hook-logs.sh --today

# Follow logs in real-time
./scripts/view-hook-logs.sh --live

# Show activity statistics
./scripts/view-hook-logs.sh --stats

# Show failed operations
./scripts/view-hook-logs.sh --failed

# Filter by tool type
./scripts/view-hook-logs.sh Bash
./scripts/view-hook-logs.sh Task
```

### Log Analysis
```bash
# Show context snapshots
./scripts/view-hook-logs.sh --context

# View specific tool logs
cat logs/hooks/detailed/bash.log
cat logs/hooks/detailed/task.log
```

## Log Format

### Standard Log Entry
```
[2025-08-03 14:30:15] PRE_TOOL_USE: Bash - Command: echo "test"
[2025-08-03 14:30:15] POST_TOOL_USE: Bash - Command execution completed - Success: true - Exit Code: 0
```

### Context Snapshot (JSON)
```json
{
  "timestamp": "2025-08-03 14:30:15",
  "event_type": "PRE_TOOL_USE",
  "tool_name": "Bash",
  "working_directory": "/Users/marv/projects/PremStats",
  "git_branch": "main",
  "git_status": "1 files modified",
  "process_id": 12345,
  "additional_data": "Command: echo test"
}
```

## Configuration

The hook system is configured in `.claude/settings.local.json`:

### Pre-Tool Hooks
- Capture tool parameters and execution context
- Log specific information per tool type
- Create context snapshots for detailed analysis

### Post-Tool Hooks
- Record execution results and success status
- Log performance metrics where available
- Track failure patterns for debugging

## Maintenance

### Automatic Cleanup
- Session logs older than 7 days are automatically removed
- Context files older than 7 days are automatically removed
- Main activity log persists for historical analysis

### Manual Cleanup
```bash
# Clear all hook logs
rm -rf logs/hooks/

# Clear only old logs
find logs/hooks/ -name "session-*.log" -mtime +7 -delete
find logs/hooks/ -name "context-*.json" -mtime +7 -delete
```

## Troubleshooting

### No Logs Appearing
1. Check that hooks are properly configured in `.claude/settings.local.json`
2. Verify script permissions: `chmod +x scripts/hook-logger.sh`
3. Ensure the logs directory can be created: `mkdir -p logs/hooks`

### Performance Impact
- Hooks add minimal overhead to tool execution
- Log files are efficiently managed with automatic rotation
- Context snapshots are created sparingly to avoid disk usage issues

### Privacy Considerations
- Hooks may log sensitive command parameters
- Review logs before sharing or committing to version control
- Consider adding `logs/` to `.gitignore` if not already present

## Integration

The hook system integrates seamlessly with:
- **AI Agent System**: Tracks agent orchestration and delegation
- **Development Workflow**: Monitors file changes and command execution
- **Quality Assurance**: Provides audit trail for testing and validation
- **Performance Monitoring**: Identifies slow or failing operations