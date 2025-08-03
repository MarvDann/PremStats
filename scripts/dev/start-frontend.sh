#!/bin/bash

# Frontend Development Server Script
# Usage: ./start-frontend.sh [port]

set -e

echo "🚀 Starting PremStats Frontend..."

# Get script directory and navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
cd "$PROJECT_ROOT"

# Handle help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [port]"
    echo "  port    Port number for frontend server (default: 3000)"
    echo ""
    echo "Examples:"
    echo "  $0        # Start on port 3000"
    echo "  $0 3001   # Start on port 3001"
    exit 0
fi

# Set port (default 3000)
PORT=${1:-3000}

# Validate port is a number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ Invalid port: $PORT (must be a number)"
    exit 1
fi

echo "📍 Project root: $PROJECT_ROOT"
echo "🌐 Frontend will start on port: $PORT"

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is required but not installed"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Check if UI components are built
echo "🔍 Checking UI components..."
if [ ! -d "packages/ui/dist" ]; then
    echo "📦 Building UI components first..."
    pnpm --filter @premstats/ui build
    echo "✅ UI components built successfully"
else
    echo "✅ UI components already built"
fi

# Kill any existing process on the port
echo "🧹 Cleaning up existing processes on port $PORT..."
lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start frontend
echo "📱 Starting frontend development server..."
cd apps/web

# Check if web app dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing web app dependencies..."
    cd "$PROJECT_ROOT"
    pnpm install
    cd apps/web
fi

echo "🚀 Frontend server starting on http://localhost:$PORT"
echo "🔗 Network access: http://0.0.0.0:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"

# Start with proper error handling
pnpm dev --host 0.0.0.0 --port $PORT