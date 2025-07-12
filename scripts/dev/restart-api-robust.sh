#!/bin/bash

# Robust API Management Script
# Usage: ./restart-api-robust.sh [build|restart|start|stop|status]

set -e

API_DIR="/home/marvdann/projects/PremStats/packages/api"
BIN_PATH="$API_DIR/bin/api"
LOG_PATH="/tmp/premstats-api.log"
PORT=8081

cd "$API_DIR"

function stop_api() {
    echo "🛑 Stopping API processes..."
    
    # Kill by binary name
    pkill -f "./bin/api" 2>/dev/null || true
    
    # Kill by go run
    pkill -f "go run.*main.go" 2>/dev/null || true
    
    # Kill by port (nuclear option)
    lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
    
    sleep 2
    echo "✅ API stopped"
}

function build_api() {
    echo "🔨 Building API binary..."
    
    # Remove old binary
    rm -f "$BIN_PATH"
    
    # Build new binary
    go build -o "$BIN_PATH" cmd/api/main.go
    
    echo "✅ API built successfully"
}

function start_api() {
    echo "🚀 Starting API on port $PORT..."
    
    # Start API in background
    nohup "$BIN_PATH" > "$LOG_PATH" 2>&1 &
    
    sleep 3
    
    # Check if it started successfully
    if curl -s "http://localhost:$PORT/api/v1/health" > /dev/null; then
        echo "✅ API started successfully on port $PORT"
    else
        echo "❌ API failed to start. Check logs: $LOG_PATH"
        exit 1
    fi
}

function status_api() {
    echo "📊 API Status:"
    
    if curl -s "http://localhost:$PORT/api/v1/health" > /dev/null; then
        echo "✅ API is running on port $PORT"
        echo "📋 Health check:"
        curl -s "http://localhost:$PORT/api/v1/health" | jq '.' 2>/dev/null || echo "Response received but not JSON"
    else
        echo "❌ API is not responding on port $PORT"
    fi
    
    echo ""
    echo "🔍 Running processes:"
    ps aux | grep -E "(api|main.go)" | grep -v grep || echo "No API processes found"
}

case "${1:-restart}" in
    "build")
        build_api
        ;;
    "start")
        start_api
        ;;
    "stop")
        stop_api
        ;;
    "restart")
        stop_api
        build_api
        start_api
        ;;
    "status")
        status_api
        ;;
    *)
        echo "Usage: $0 [build|restart|start|stop|status]"
        echo "Default: restart"
        exit 1
        ;;
esac