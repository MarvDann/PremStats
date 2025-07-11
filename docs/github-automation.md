# GitHub Issue Automation System

## Overview

The PremStats project now includes an automated GitHub issue resolution system that can:
- Monitor GitHub issues automatically
- Analyze issues and assign them to appropriate agents
- Create isolated worktrees for each issue
- Implement fixes automatically
- Run tests and create Pull Requests

## Architecture

### Components

1. **GitHub Issue Monitor** (`agents/github/issue-monitor.js`)
   - Monitors GitHub issues every 5 minutes
   - Filters frontend-related issues
   - Automatically assigns issues to agents

2. **Frontend Agent** (`agents/frontend/index.js`)
   - Processes GitHub issue tasks
   - Handles component fixes, page improvements, and bug fixes
   - Integrates with the worktree system

3. **Worktree Manager** (`agents/base/worktree-manager.js`)
   - Creates isolated Git worktrees for each issue
   - Manages branch creation and cleanup
   - Provides utilities for worktree operations

4. **GitHub Issue Handler** (`agents/frontend/github-issue-handler.js`)
   - Analyzes issues to determine required changes
   - Implements fixes based on issue type
   - Runs tests and creates Pull Requests

5. **Enhanced Agent CLI** (`scripts/agent-cli.js`)
   - New GitHub-specific commands
   - Worktree management
   - PR status checking

## Usage

### Manual Issue Assignment

Assign a specific issue to an agent:
```bash
node scripts/agent-cli.js issue 1
```

Force assign to a specific agent:
```bash
node scripts/agent-cli.js issue 1 --agent frontend
```

### Monitoring

Start the automated issue monitor:
```bash
node scripts/agent-cli.js monitor
```

Check agent status:
```bash
node scripts/agent-cli.js status
```

List pending tasks:
```bash
node scripts/agent-cli.js list frontend
```

### Worktree Management

List active worktrees:
```bash
node scripts/agent-cli.js worktrees
```

Clean up completed worktrees:
```bash
node scripts/agent-cli.js cleanup-worktrees
```

### PR Tracking

Check status of agent-created PRs:
```bash
node scripts/agent-cli.js pr-status
```

## Workflow

### Enhanced Automatic Workflow

1. **Issue Detection**: Monitor scans GitHub issues every 5 minutes
2. **Classification**: Issues are analyzed for keywords to determine agent type
3. **Task Dispatch**: Issue is added to appropriate agent queue
4. **Worktree Creation**: Agent creates isolated worktree with feature branch
5. **Dependency Installation**: Full dependency installation and UI package build
6. **Issue Analysis**: Agent analyzes issue content to determine required changes
7. **Implementation**: Agent implements fixes based on issue type
8. **Quality Assurance**: Comprehensive testing pipeline
   - ESLint code style and quality checks
   - TypeScript compilation and type safety
   - Unit test execution and validation
9. **Visual Documentation**: Automated generation of change documentation
10. **Commit**: Changes committed with QA summary and metadata
11. **PR Creation**: Professional Pull Request with quality assurance details
12. **Issue Updates**: Original issue updated with comprehensive status
13. **Cleanup**: Worktree marked for cleanup after PR merge

### Manual Workflow

1. **Issue Assignment**: Use CLI to assign specific issues
2. **Agent Processing**: Start frontend agent to process queued tasks
3. **Monitoring**: Track progress through CLI commands
4. **Review**: Review and merge generated Pull Requests

## Issue Types Supported

### Frontend Issues

The system automatically detects and handles:

- **Match Detail Pages** (`match-detail-scores`)
  - Adds score displays with large fonts
  - Removes unnecessary status text
  - Improves page layout

- **Match Events** (`match-events`)
  - Adds event timelines
  - Displays goals, cards, substitutions
  - Adds proper fallback states

- **Page Improvements** (`page-improvement`)
  - General page functionality improvements
  - Display and layout fixes

## Configuration

### Environment Variables

```bash
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=ghp_your_token_here
WORKTREE_BASE_PATH=/path/to/worktrees
```

### Keywords for Frontend Detection

The system recognizes these keywords as frontend-related:
- page, component, ui, display, frontend
- react, solidjs, css, style, layout
- button, form, navigation, menu, modal
- chart, table, card, responsive, mobile
- match detail, team page, player page, stats page

## Testing

Run the workflow test:
```bash
node test-github-workflow.js
```

This simulates the complete workflow without making actual changes.

## Quality Assurance

The enhanced workflow includes comprehensive quality assurance:

### Dependency Management
- **Full Installation**: Complete `pnpm install` in worktree
- **UI Package Build**: Ensures component library is available
- **Dependency Verification**: Confirms all packages are properly installed

### Code Quality Checks
- **ESLint Validation**: Code style, best practices, and error prevention
- **TypeScript Compilation**: Type safety and interface compliance
- **Unit Test Execution**: Functionality verification and regression prevention

### Documentation Generation
- **Visual Documentation**: Automated change documentation with examples
- **Implementation Notes**: Code location and modification details
- **Preview Instructions**: Steps to view changes locally

### Professional PRs
- **Quality Assurance Checklist**: Detailed validation summary
- **Enhanced Descriptions**: Comprehensive change documentation
- **Visual References**: Documentation of UI/UX modifications
- **Review-Ready Format**: Professional structure and formatting

## File Structure

```
agents/
├── base/
│   ├── agent-worker.js          # Base agent class
│   └── worktree-manager.js      # Git worktree management
├── frontend/
│   ├── index.js                 # Frontend agent main file
│   └── github-issue-handler.js  # Issue processing logic
└── github/
    └── issue-monitor.js         # GitHub issue monitoring

scripts/
└── agent-cli.js                 # Enhanced CLI with GitHub commands

docs/
└── github-automation.md         # This documentation
```

## Security

- All PRs require manual review before merging
- Agent only processes clearly defined issue types
- Changes are isolated in separate worktrees
- Tests must pass before PR creation
- GitHub token permissions are limited to repository access

## Limitations

- Currently supports frontend issues only
- Requires manual PR review and merge
- Limited to predefined issue patterns
- Depends on GitHub CLI for repository operations

## Future Enhancements

- Backend issue support
- Machine learning for issue classification
- Automated testing in PR environments
- Integration with project management tools
- Support for more complex issue types