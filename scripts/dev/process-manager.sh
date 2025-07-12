#!/bin/bash

# PremStats Process Manager
# Advanced process management with PID files and port conflict detection

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PID_DIR="$PROJECT_ROOT/.pids"
LOG_DIR="$PROJECT_ROOT/logs"

# Configuration
API_PORT=${API_PORT:-8081}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
API_NAME="premstats-api"
FRONTEND_NAME="premstats-frontend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create directories if they don't exist
mkdir -p "$PID_DIR" "$LOG_DIR/api" "$LOG_DIR/frontend"

# Utility functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if a port is in use
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        log_warning "Port $port is already in use by process $pid ($process_name)"
        
        # Check if it's our process
        local our_pid_file="$PID_DIR/${service_name}.pid"
        if [ -f "$our_pid_file" ]; then
            local our_pid=$(cat "$our_pid_file")
            if [ "$pid" = "$our_pid" ]; then
                log_info "Port $port is occupied by our $service_name process (PID: $pid)"
                return 0
            fi
        fi
        return 1
    fi
    return 0
}

# Kill process using port
kill_port_process() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
        log_info "Killing process $pid occupying port $port"
        kill -TERM $pid 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if kill -0 $pid 2>/dev/null; then
            log_warning "Process $pid still running, force killing..."
            kill -KILL $pid 2>/dev/null || true
        fi
        
        # Clean up PID file if it was our process
        local our_pid_file="$PID_DIR/${service_name}.pid"
        if [ -f "$our_pid_file" ]; then
            local our_pid=$(cat "$our_pid_file")
            if [ "$pid" = "$our_pid" ]; then
                rm -f "$our_pid_file"
            fi
        fi
    fi
}

# Check if process is running
is_process_running() {
    local pid_file=$1
    
    if [ ! -f "$pid_file" ]; then
        return 1
    fi
    
    local pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        # PID file exists but process is dead, clean it up
        rm -f "$pid_file"
        return 1
    fi
}

# Start API server
start_api() {
    local pid_file="$PID_DIR/${API_NAME}.pid"
    local log_file="$LOG_DIR/api/api.log"
    
    log_info "Starting API server on port $API_PORT..."
    
    # Check if already running
    if is_process_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        log_warning "API server is already running (PID: $pid)"
        return 0
    fi
    
    # Check port availability
    if ! check_port "$API_PORT" "$API_NAME"; then
        log_error "Cannot start API: port $API_PORT is in use"
        log_info "Use '$0 kill-port $API_PORT' to free the port"
        return 1
    fi
    
    # Check Go installation
    if ! command -v go >/dev/null 2>&1; then
        log_error "Go is not installed or not in PATH"
        log_info "Install Go or add it to PATH: export PATH=\$HOME/go/bin:\$PATH"
        return 1
    fi
    
    # Build API if needed
    local api_dir="$PROJECT_ROOT/packages/api"
    local api_binary="$api_dir/bin/api"
    
    if [ ! -f "$api_binary" ] || [ "$api_dir/cmd/api/main.go" -nt "$api_binary" ]; then
        log_info "Building API binary..."
        cd "$api_dir"
        mkdir -p bin
        go build -o bin/api cmd/api/main.go
        if [ $? -ne 0 ]; then
            log_error "Failed to build API"
            return 1
        fi
    fi
    
    # Start the API server
    cd "$api_dir"
    nohup ./bin/api > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    # Wait a moment and check if it started successfully
    sleep 2
    if is_process_running "$pid_file"; then
        log_success "API server started successfully (PID: $pid)"
        log_info "Logs: $log_file"
        
        # Health check
        sleep 3
        if curl -s http://localhost:$API_PORT/health >/dev/null 2>&1; then
            log_success "API health check passed"
        else
            log_warning "API health check failed - server may still be starting"
        fi
        return 0
    else
        log_error "Failed to start API server"
        rm -f "$pid_file"
        return 1
    fi
}

# Start frontend server
start_frontend() {
    local pid_file="$PID_DIR/${FRONTEND_NAME}.pid"
    local log_file="$LOG_DIR/frontend/frontend.log"
    
    log_info "Starting frontend server on port $FRONTEND_PORT..."
    
    # Check if already running
    if is_process_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        log_warning "Frontend server is already running (PID: $pid)"
        return 0
    fi
    
    # Check port availability
    if ! check_port "$FRONTEND_PORT" "$FRONTEND_NAME"; then
        log_error "Cannot start frontend: port $FRONTEND_PORT is in use"
        log_info "Use '$0 kill-port $FRONTEND_PORT' to free the port"
        return 1
    fi
    
    # Check if pnpm is available
    if ! command -v pnpm >/dev/null 2>&1; then
        log_error "pnpm is not installed or not in PATH"
        return 1
    fi
    
    # Check if UI components are built
    local ui_dist="$PROJECT_ROOT/packages/ui/dist"
    if [ ! -d "$ui_dist" ]; then
        log_info "Building UI components..."
        cd "$PROJECT_ROOT/packages/ui"
        pnpm build
        if [ $? -ne 0 ]; then
            log_error "Failed to build UI components"
            return 1
        fi
    fi
    
    # Start the frontend server
    cd "$PROJECT_ROOT/apps/web"
    nohup pnpm dev > "$log_file" 2>&1 &
    local pid=$!
    echo $pid > "$pid_file"
    
    # Wait a moment and check if it started successfully
    sleep 3
    if is_process_running "$pid_file"; then
        log_success "Frontend server started successfully (PID: $pid)"
        log_info "Logs: $log_file"
        log_info "URL: http://localhost:$FRONTEND_PORT"
        return 0
    else
        log_error "Failed to start frontend server"
        rm -f "$pid_file"
        return 1
    fi
}

# Stop a service
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/${service_name}.pid"
    
    if ! is_process_running "$pid_file"; then
        log_warning "$service_name is not running"
        return 0
    fi
    
    local pid=$(cat "$pid_file")
    log_info "Stopping $service_name (PID: $pid)..."
    
    # Graceful shutdown
    kill -TERM "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local count=0
    while kill -0 "$pid" 2>/dev/null && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    if kill -0 "$pid" 2>/dev/null; then
        log_warning "Graceful shutdown failed, force killing..."
        kill -KILL "$pid" 2>/dev/null || true
    fi
    
    rm -f "$pid_file"
    log_success "$service_name stopped successfully"
}

# Show status of all services
show_status() {
    echo "PremStats Process Status"
    echo "======================="
    echo
    
    # API Status
    local api_pid_file="$PID_DIR/${API_NAME}.pid"
    echo -n "API Server (port $API_PORT): "
    if is_process_running "$api_pid_file"; then
        local pid=$(cat "$api_pid_file")
        echo -e "${GREEN}RUNNING${NC} (PID: $pid)"
        
        # Health check
        if curl -s http://localhost:$API_PORT/health >/dev/null 2>&1; then
            echo "  Health: ${GREEN}OK${NC}"
        else
            echo "  Health: ${RED}FAILED${NC}"
        fi
    else
        echo -e "${RED}STOPPED${NC}"
    fi
    
    # Frontend Status
    local frontend_pid_file="$PID_DIR/${FRONTEND_NAME}.pid"
    echo -n "Frontend Server (port $FRONTEND_PORT): "
    if is_process_running "$frontend_pid_file"; then
        local pid=$(cat "$frontend_pid_file")
        echo -e "${GREEN}RUNNING${NC} (PID: $pid)"
    else
        echo -e "${RED}STOPPED${NC}"
    fi
    
    echo
    
    # Port status
    echo "Port Usage:"
    echo "-----------"
    for port in $API_PORT $FRONTEND_PORT; do
        echo -n "Port $port: "
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local pid=$(lsof -Pi :$port -sTCP:LISTEN -t)
            local process_name=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo -e "${YELLOW}IN USE${NC} by $process_name (PID: $pid)"
        else
            echo -e "${GREEN}FREE${NC}"
        fi
    done
}

# Clean up orphaned PID files
cleanup() {
    log_info "Cleaning up orphaned PID files..."
    
    for pid_file in "$PID_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            if ! is_process_running "$pid_file"; then
                local service=$(basename "$pid_file" .pid)
                log_info "Removed orphaned PID file for $service"
            fi
        fi
    done
    
    log_success "Cleanup completed"
}

# Show help
show_help() {
    echo "PremStats Process Manager"
    echo "========================"
    echo
    echo "Usage: $0 <command> [arguments]"
    echo
    echo "Commands:"
    echo "  start-api           Start the API server"
    echo "  start-frontend      Start the frontend server"
    echo "  start-all           Start both API and frontend"
    echo "  stop-api            Stop the API server"
    echo "  stop-frontend       Stop the frontend server"
    echo "  stop-all            Stop all services"
    echo "  restart-api         Restart the API server"
    echo "  restart-frontend    Restart the frontend server"
    echo "  restart-all         Restart all services"
    echo "  status              Show status of all services"
    echo "  cleanup             Clean up orphaned PID files"
    echo "  kill-port <port>    Kill process using specified port"
    echo "  help                Show this help message"
    echo
    echo "Environment Variables:"
    echo "  API_PORT            API server port (default: 8081)"
    echo "  FRONTEND_PORT       Frontend server port (default: 3000)"
    echo
    echo "Examples:"
    echo "  $0 start-all"
    echo "  $0 status"
    echo "  API_PORT=8082 $0 start-api"
    echo "  $0 kill-port 8081"
}

# Main command handling
case "${1:-help}" in
    "start-api")
        start_api
        ;;
    "start-frontend")
        start_frontend
        ;;
    "start-all")
        start_api && start_frontend
        ;;
    "stop-api")
        stop_service "$API_NAME"
        ;;
    "stop-frontend")
        stop_service "$FRONTEND_NAME"
        ;;
    "stop-all")
        stop_service "$API_NAME"
        stop_service "$FRONTEND_NAME"
        ;;
    "restart-api")
        stop_service "$API_NAME"
        sleep 1
        start_api
        ;;
    "restart-frontend")
        stop_service "$FRONTEND_NAME"
        sleep 1
        start_frontend
        ;;
    "restart-all")
        stop_service "$API_NAME"
        stop_service "$FRONTEND_NAME"
        sleep 1
        start_api && start_frontend
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "kill-port")
        if [ -z "$2" ]; then
            log_error "Port number required"
            echo "Usage: $0 kill-port <port>"
            exit 1
        fi
        kill_port_process "$2" "unknown"
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac