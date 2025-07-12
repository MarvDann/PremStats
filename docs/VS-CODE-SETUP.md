# 🚀 VS Code Setup Guide for PremStats

## ✅ Issue Resolution Summary

### **Problem**: VS Code Launch Configuration Error
```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".sh"
```

### **Root Cause**: 
VS Code launch configurations were using `"type": "node"` with `"program": "script.sh"`, but Node.js cannot execute shell scripts directly.

### **Solution Applied**:
1. **Fixed Shell Script Execution**: Updated launch configs to use `"runtimeExecutable": "bash"` with `"runtimeArgs"`
2. **Enhanced Task Workflow**: Added comprehensive VS Code tasks for development operations
3. **Proper Go Debugging**: Set up actual Go debugging configuration
4. **Improved Documentation**: Clear guidance on when to use tasks vs launches

---

## 🎯 VS Code Usage Guide

### **Launch Configurations** (Press `F5` or `Ctrl+Shift+P` → "Debug: Start Debugging")
**Best for**: Application launches and debugging

| Configuration | Purpose | Use Case |
|--------------|---------|----------|
| 🚀 Launch PremStats (Full Setup) | Complete application start | First-time setup, full restart |
| ⚡ Quick Start PremStats | Fast development start | Daily development |
| 🔧 Debug Go API | Go debugging with breakpoints | Backend debugging |
| 📱 Start Frontend Only | Frontend development server | Frontend development |
| 📚 Start Storybook | UI component development | Component work |
| 🗄️ Start Docker Services | Infrastructure only | Database/Redis setup |

### **Tasks** (Press `Ctrl+Shift+P` → "Tasks: Run Task")
**Best for**: Build operations, testing, and development workflow

#### Quick Development Tasks
- **🚀 Start PremStats** - Full application (equivalent to `./launch.sh`)
- **⚡ Quick Start** - Fast start (equivalent to `./quick-start.sh`)
- **🛑 Stop PremStats** - Stop all services (equivalent to `./stop.sh`)

#### Individual Services
- **Start Frontend Dev Server** - Frontend only with hot reload
- **Start Go API Server** - Backend only for API development
- **📚 Start Storybook** - Component library development

#### Build & Test Operations
- **🔧 Build API** - Compile Go binary
- **📦 Build UI Components** - Build component library
- **🎨 Build Frontend** - Production frontend build
- **🧪 Run Tests** - Execute all tests
- **🧪 Test UI Components** - UI tests only
- **🔍 Lint Code** - Code quality check
- **🔧 Type Check** - TypeScript validation

#### Infrastructure Management
- **🗄️ Start Docker Services** - PostgreSQL & Redis
- **🗄️ Stop Docker Services** - Stop infrastructure
- **📊 View Docker Logs** - Monitor containers
- **🧹 Clean Install** - Clean rebuild everything

#### Health Monitoring
- **🔧 Check API Health** - Test API endpoint
- **🌐 Check Frontend** - Test frontend status
- **📈 Check All Services** - Comprehensive health check

---

## 🔧 Configuration Details

### **Fixed Launch Configuration Structure**:
```json
{
  "name": "📱 Start Frontend Only",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "bash",
  "runtimeArgs": ["${workspaceFolder}/scripts/start-frontend.sh"],
  "console": "integratedTerminal",
  "cwd": "${workspaceFolder}"
}
```

### **Go Debugging Configuration**:
```json
{
  "name": "🔧 Debug Go API",
  "type": "go",
  "request": "launch",
  "mode": "auto",
  "program": "${workspaceFolder}/packages/api/cmd/api/main.go",
  "env": {
    "PORT": "8081"
  }
}
```

---

## 🎯 Recommended Workflow

### **Daily Development**:
1. **Start Infrastructure**: Use task "🗄️ Start Docker Services"
2. **Start Backend**: Use task "Start Go API Server" or launch config "🔧 Debug Go API" (for debugging)
3. **Start Frontend**: Use task "Start Frontend Dev Server"
4. **UI Development**: Use task "📚 Start Storybook" when working on components

### **Full Application Testing**:
1. Use launch config "🚀 Launch PremStats (Full Setup)" or task "🚀 Start PremStats"
2. Check health with task "📈 Check All Services"

### **Troubleshooting**:
1. Use task "🛑 Stop PremStats" to stop everything
2. Use task "🧹 Clean Install" if dependencies are problematic
3. Use task "📈 Check All Services" to verify status

---

## 🌐 Service URLs

After starting services:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8081
- **API Health**: http://localhost:8081/api/v1/health  
- **Storybook**: http://localhost:6006
- **Database**: localhost:5432
- **Redis**: localhost:6379

---

## 🚨 Common Issues

### **"Command not found" errors**:
- Ensure `bash`, `pnpm`, `go`, and `docker` are in your PATH
- Restart VS Code after installing tools

### **Port conflicts**:
- Use task "🛑 Stop PremStats" to stop all services
- Check ports with `lsof -i :3000` and `lsof -i :8081`

### **Permission errors with shell scripts**:
- Run `chmod +x *.sh scripts/*.sh` to make scripts executable

### **Docker issues**:
- Use task "🗄️ Stop Docker Services" then "🗄️ Start Docker Services"
- Check with task "📊 View Docker Logs"

The VS Code integration now provides a complete development environment with proper shell script execution, debugging capabilities, and comprehensive task management!