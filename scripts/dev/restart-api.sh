#!/bin/bash

# Script to properly restart the API server
# Usage: ./scripts/restart-api.sh [port]

set -e

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
API_DIR="$PROJECT_DIR/packages/api"
PORT=${1:-8081}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Restarting PremStats API on port $PORT...${NC}"

# Step 1: Kill existing API processes
echo -e "${YELLOW}⏹️  Stopping existing API processes...${NC}"
pkill -f "go run cmd/api/main.go" || true
pkill -f "api" || true
sleep 2

# Step 2: Check if database is running
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if ! docker compose -f "$PROJECT_DIR/docker-compose.yml" ps postgres | grep -q "Up"; then
    echo -e "${YELLOW}🚀 Starting database...${NC}"
    docker compose -f "$PROJECT_DIR/docker-compose.yml" up -d postgres
    echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
    sleep 10
fi

# Step 3: Start API
echo -e "${YELLOW}🚀 Starting API server...${NC}"
cd "$API_DIR"
PORT=$PORT go run cmd/api/main.go > /dev/null 2>&1 &
API_PID=$!

# Step 4: Wait and test
echo -e "${YELLOW}⏳ Waiting for API to start...${NC}"
sleep 5

# Test if API is responding
if curl -s "http://localhost:$PORT/api/v1/teams" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API successfully started on port $PORT${NC}"
    echo -e "${GREEN}🔗 Health check: http://localhost:$PORT/api/v1/teams${NC}"
    echo "API_PID=$API_PID" > "$PROJECT_DIR/.api.pid"
else
    echo -e "${YELLOW}❌ API failed to start or not responding${NC}"
    echo -e "${YELLOW}💡 Check database connection and try again${NC}"
    exit 1
fi