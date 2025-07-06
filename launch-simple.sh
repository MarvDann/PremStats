#!/bin/bash

# Simple PremStats Launcher - No fancy output, easier to debug
echo "Starting PremStats Application..."

set -e  # Exit on error

# Check basic requirements
command -v docker >/dev/null || { echo "Docker not found"; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm not found"; exit 1; }
command -v go >/dev/null || { echo "Go not found"; exit 1; }

# Start Docker services
echo "Starting Docker services..."
docker compose up -d postgres redis

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
for i in {1..15}; do
    if docker compose exec -T postgres pg_isready -U premstats >/dev/null 2>&1; then
        echo "PostgreSQL ready"
        break
    fi
    sleep 2
done

# Install dependencies
echo "Installing dependencies..."
pnpm install --silent

# Build UI components
echo "Building UI components..."
cd packages/ui && pnpm build --silent && cd ../..

# Start API if not running
if ! lsof -i :8081 >/dev/null 2>&1; then
    echo "Starting API..."
    cd packages/api
    go build -o bin/api cmd/api/main.go
    PORT=8081 ./bin/api &
    echo $! > ../../.api.pid
    cd ../..
    
    # Wait for API
    for i in {1..15}; do
        if curl -s http://localhost:8081/api/v1/health >/dev/null 2>&1; then
            echo "API ready"
            break
        fi
        sleep 2
    done
else
    echo "API already running"
fi

# Start frontend if not running
if ! lsof -i :3000 >/dev/null 2>&1; then
    echo "Starting frontend..."
    cd apps/web
    pnpm dev --host 0.0.0.0 --port 3000 &
    echo $! > ../../.frontend.pid
    cd ../..
    
    # Wait for frontend
    for i in {1..15}; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo "Frontend ready"
            break
        fi
        sleep 2
    done
else
    echo "Frontend already running"
fi

echo ""
echo "🎉 PremStats is running!"
echo "Frontend: http://localhost:3000"
echo "API: http://localhost:8081"
echo ""
echo "To stop: ./stop.sh"