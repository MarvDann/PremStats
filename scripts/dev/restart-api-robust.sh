#!/bin/bash

# Robust API Management Script
# Usage: ./restart-api-robust.sh [build|restart|start|stop|status]

set -e

# Get the script's directory and navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

API_DIR="$PROJECT_ROOT/packages/api"
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
    
    # Create bin directory if it doesn't exist
    mkdir -p "$API_DIR/bin"
    
    # Remove old binary
    rm -f "$BIN_PATH"
    
    # Build new binary
    go build -o "$BIN_PATH" cmd/api/main.go
    
    # Make it executable
    chmod +x "$BIN_PATH"
    
    echo "✅ API built successfully"
}

function start_api() {
    echo "🚀 Starting API on port $PORT..."
    
    # Ensure binary exists
    if [ ! -f "$BIN_PATH" ]; then
        echo "❌ API binary not found. Running build first..."
        build_api
    fi
    
    # Set up environment
    export PATH="$HOME/go/bin:$PATH"
    export PORT=$PORT
    
    # Start API in background
    nohup "$BIN_PATH" > "$LOG_PATH" 2>&1 &
    local API_PID=$!
    
    # Wait for startup (API generates reports on startup)
    echo "⏳ Waiting for API to initialize (this may take up to 30 seconds)..."
    sleep 10
    
    # Check if process is still running
    if ! ps -p $API_PID > /dev/null; then
        echo "❌ API process died. Check logs:"
        tail -20 "$LOG_PATH"
        exit 1
    fi
    
    # Check health endpoint with retries
    local max_attempts=6
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$PORT/api/v1/health" > /dev/null 2>&1; then
            echo "✅ API started successfully on port $PORT (PID: $API_PID)"
            echo "📝 Logs: $LOG_PATH"
            return 0
        else
            echo "⏳ Attempt $attempt/$max_attempts - API not ready yet..."
            sleep 5
            ((attempt++))
        fi
    done
    
    echo "❌ API is running but not responding after $max_attempts attempts. Check logs:"
    tail -20 "$LOG_PATH"
    exit 1
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