# 🚀 PremStats Launch Troubleshooting Guide

## ✅ Fixed Issues

### Frontend Launch Task
**Problem**: VS Code launch task for frontend was failing.

**Solution**: Updated launch configuration to use dedicated shell scripts that:
- Check for built UI components
- Build them if missing
- Start the development server with proper flags

## 🎯 Current Working Launch Options

### 1. Command Line (Recommended)
```bash
# Full application
./launch.sh

# Quick start for development
./quick-start.sh

# Individual services
./scripts/start-frontend.sh
./scripts/start-api.sh
```

### 2. VS Code Launch Configurations
Access via `F5` or `Ctrl+Shift+P` → "Debug: Select and Start Debugging":

- **🚀 Launch PremStats (Full Setup)** - Complete application
- **⚡ Quick Start PremStats** - Quick development setup
- **🔧 Start Go API Only** - Backend only
- **📱 Start Frontend Only** - Frontend only ✅ FIXED
- **📚 Start Storybook** - UI component development
- **🗄️ Start Docker Services** - Infrastructure only

### 3. VS Code Tasks
Access via `Ctrl+Shift+P` → "Tasks: Run Task":

- **🚀 Start PremStats** - Full application launch
- **⚡ Quick Start** - Quick development start
- **🛑 Stop PremStats** - Stop all services

## 🔧 Launch Scripts Created

### Main Launchers
- `launch.sh` - Full setup with prerequisites check
- `quick-start.sh` - Quick development start
- `stop.sh` - Stop all services

### Individual Service Scripts
- `scripts/start-frontend.sh` - Frontend with UI build check
- `scripts/start-api.sh` - Go API with binary build check

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8081/api/v1/health
- **Storybook**: http://localhost:6006

## 🚨 Common Issues & Solutions

### Issue: "Port already in use"
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8081

# Kill processes
pkill -f "vite.*3000"
pkill -f "go.*api"
```

### Issue: "UI components not found"
```bash
# Build UI components
pnpm --filter @premstats/ui build
```

### Issue: "Database connection failed"
```bash
# Start database
docker compose up -d postgres redis

# Check database is running
docker compose ps
```

### Issue: "Go binary not found"
```bash
# Build API binary
cd packages/api
go build -o bin/api cmd/api/main.go
```

### Issue: VS Code launch fails
1. Use Command Line instead: `./quick-start.sh`
2. Or use VS Code Tasks instead of Launch Configurations

## ✅ Verification Steps

1. **Check Prerequisites**:
   ```bash
   docker --version
   pnpm --version
   go version
   ```

2. **Test Services Individually**:
   ```bash
   # Test database
   curl -s localhost:5432 || echo "DB not ready"
   
   # Test API
   curl -s http://localhost:8081/api/v1/health
   
   # Test frontend
   curl -s http://localhost:3000
   ```

3. **Full Application Test**:
   ```bash
   ./launch.sh
   # Wait for "🎉 PremStats Application is now running!"
   # Open http://localhost:3000
   ```

## 🎯 Recommended Development Workflow

1. **First Time Setup**:
   ```bash
   git clone <repo>
   cd PremStats
   ./launch.sh
   ```

2. **Daily Development**:
   ```bash
   ./quick-start.sh
   ```

3. **Individual Development**:
   ```bash
   # Backend only
   ./scripts/start-api.sh
   
   # Frontend only
   ./scripts/start-frontend.sh
   
   # UI Components
   pnpm ui:dev
   ```

The launch configurations are now working correctly with proper error handling and dependency checking!