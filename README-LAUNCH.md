# 🚀 PremStats Launch Guide

This guide explains how to start the PremStats application using the various launch configurations provided.

## 🎯 Quick Start Options

### Option 1: One-Command Launch (Recommended)
```bash
# Full setup with prerequisites check
./launch.sh

# OR using pnpm scripts
pnpm start
```

### Option 2: Quick Start (For Development)
```bash
# Quick start (assumes setup is done)
./quick-start.sh

# OR using pnpm scripts
pnpm dev
```

### Option 3: Manual Step-by-Step
```bash
# 1. Start infrastructure
docker compose up -d postgres redis

# 2. Start API
cd packages/api && PORT=8081 go run cmd/api/main.go &

# 3. Start frontend
cd apps/web && pnpm dev
```

## 🛠️ VS Code Integration

### Launch Configurations (F5 or Ctrl+Shift+P → "Debug: Start Debugging")
**✅ FIXED** - All configurations now work properly with shell scripts:

- **🚀 Launch PremStats (Full Setup)** - Complete setup with checks
- **⚡ Quick Start PremStats** - Fast development start  
- **🔧 Debug Go API** - Go debugging with breakpoints
- **📱 Start Frontend Only** - Frontend development server
- **📚 Start Storybook** - UI component development
- **🗄️ Start Docker Services** - Infrastructure only
- **🏗️ Full Development Setup** - Compound launch (all services)

### VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")
**Enhanced with comprehensive development workflow**:

#### Main Operations
- **🚀 Start PremStats** - Full application launch
- **⚡ Quick Start** - Quick development start
- **🛑 Stop PremStats** - Stop all services
- **🏗️ Setup Project** - Initial project setup

#### Development Servers
- **Start Frontend Dev Server** - Frontend only
- **Start Go API Server** - Backend only  
- **📚 Start Storybook** - UI component development

#### Build Operations
- **🔧 Build API** - Go binary build
- **📦 Build UI Components** - Component library build
- **🎨 Build Frontend** - Production frontend build

#### Testing & Quality
- **🧪 Run Tests** - Execute all test suites
- **🧪 Test UI Components** - UI component tests only
- **🧪 Test UI Components (Watch)** - UI tests in watch mode
- **🔍 Lint Code** - Code quality check
- **🔧 Type Check** - TypeScript validation

#### Infrastructure
- **🗄️ Start Docker Services** - PostgreSQL & Redis
- **🗄️ Stop Docker Services** - Stop infrastructure
- **📊 View Docker Logs** - Container logs
- **🧹 Clean Install** - Clean dependencies and rebuild

#### Health Checks
- **🔧 Check API Health** - Test API endpoint
- **🌐 Check Frontend** - Test frontend accessibility  
- **📈 Check All Services** - Comprehensive service check

## 📋 Available Scripts

### Main Commands
```bash
pnpm start          # Launch full application
pnpm stop           # Stop all services
pnpm dev            # Quick development start
pnpm setup          # Initial project setup
```

### Development Scripts
```bash
pnpm api            # Start Go API only
pnpm frontend       # Start frontend only
pnpm ui:dev         # Start Storybook
pnpm ui:build       # Build UI components
pnpm ui:test        # Test UI components
```

### Build & Test
```bash
pnpm build          # Build all packages
pnpm test           # Run all tests
pnpm lint           # Lint all code
pnpm typecheck      # TypeScript validation
```

### Docker Management
```bash
pnpm docker:up      # Start Docker services
pnpm docker:down    # Stop Docker services
pnpm docker:logs    # View Docker logs
```

### Agent Scripts
```bash
pnpm agent:data     # Start data agent
pnpm agent:cli      # Agent CLI interface
```

## 🌐 Service URLs

Once launched, access these URLs:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8081
- **API Health**: http://localhost:8081/api/v1/health
- **Storybook**: http://localhost:6006
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Prerequisites

Ensure these are installed:
- **Node.js** ≥ 18.0.0
- **pnpm** ≥ 8.0.0
- **Go** ≥ 1.21
- **Docker** with Docker Compose

## 🚨 Troubleshooting

### VS Code Launch Issues ✅ FIXED
**Previous Error**: `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".sh"`

**Solution Applied**: 
- Updated launch configurations to use `"runtimeExecutable": "bash"`
- Changed from `"program": "script.sh"` to `"runtimeArgs": ["script.sh"]`
- Added proper Go debugging configuration
- Enhanced tasks for better development workflow

**VS Code Usage**:
- Use **Tasks** (`Ctrl+Shift+P` → "Tasks: Run Task") for development servers and builds
- Use **Launch Configs** (`F5`) for debugging and full application launches

### Port Conflicts
If ports are in use:
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8081

# Kill processes if needed
pkill -f "vite.*3000"
pkill -f "go.*api"

# Or use VS Code task: "🛑 Stop PremStats"
```

### Clean Restart
```bash
# Stop everything and clean restart
./stop.sh
docker compose down
./launch.sh

# Or use VS Code tasks:
# 1. "🛑 Stop PremStats"
# 2. "🧹 Clean Install"  
# 3. "🚀 Start PremStats"
```

### Build Issues
```bash
# Clean install and rebuild
rm -rf node_modules */node_modules
pnpm install
pnpm ui:build

# Or use VS Code task: "🧹 Clean Install"
```

### Database Issues
```bash
# Reset database
docker compose down -v
docker compose up -d postgres redis

# Or use VS Code tasks:
# 1. "🗄️ Stop Docker Services"
# 2. "🗄️ Start Docker Services"
```

### Service Health Checks
```bash
# Check all services manually
./launch.sh  # Shows service status

# Or use VS Code task: "📈 Check All Services"
```

## 📂 Project Structure
```
PremStats/
├── apps/web/           # SolidJS frontend
├── packages/
│   ├── api/           # Go backend API
│   └── ui/            # Component library
├── agents/            # Data processing agents
├── scripts/           # Utility scripts
├── launch.sh          # Full launch script
├── quick-start.sh     # Quick development start
└── stop.sh           # Stop all services
```

## 🎯 Development Workflow

1. **First Time Setup**:
   ```bash
   pnpm setup
   ./launch.sh
   ```

2. **Daily Development**:
   ```bash
   ./quick-start.sh
   ```

3. **Component Development**:
   ```bash
   pnpm ui:dev  # Storybook
   ```

4. **Stop Everything**:
   ```bash
   ./stop.sh
   ```

The launch configurations provide multiple ways to start PremStats based on your development needs!