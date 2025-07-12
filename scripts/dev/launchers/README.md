# Launch Scripts

Collection of scripts for starting the PremStats development environment in different configurations.

## Scripts

### `launch.sh`
Main launch script for complete development environment.

**Usage:**
```bash
./scripts/dev/launchers/launch.sh
```

**What it starts:**
- Docker services (PostgreSQL, Redis)
- API server
- Frontend development server
- Required dependencies

### `launch-simple.sh`
Simplified launch script with minimal dependencies.

**Usage:**
```bash
./scripts/dev/launchers/launch-simple.sh
```

**Use cases:**
- Quick API-only development
- Minimal resource usage
- Testing backend changes

### `quick-start.sh`
Rapid development start with smart dependency checking.

**Usage:**
```bash
./scripts/dev/launchers/quick-start.sh
```

**Features:**
- Checks what's already running
- Skips unnecessary restarts
- Fast development iteration

### `stop.sh`
Stop all PremStats services and cleanup.

**Usage:**
```bash
./scripts/dev/launchers/stop.sh
```

**What it stops:**
- All Docker services
- API and frontend processes
- Cleanup temporary files

## Recommended Usage

For new development, consider using the modern process manager instead:

```bash
# Modern approach (recommended)
./scripts/dev/process-manager.sh start-all
./scripts/dev/process-manager.sh status
./scripts/dev/process-manager.sh stop-all

# Legacy launchers (for specific use cases)
./scripts/dev/launchers/launch.sh
```

## Migration Notes

These scripts are maintained for compatibility but the process manager (`scripts/dev/process-manager.sh`) provides:
- Better process tracking with PID files
- Port conflict detection
- More reliable service management
- Enhanced error handling

Consider migrating workflows to use the process manager for improved reliability.