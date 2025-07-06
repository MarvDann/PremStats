#!/bin/bash

# PremStats Quick Start (assumes services are already set up)
# This script quickly starts the application without full setup

set -e

echo "⚡ Quick Starting PremStats..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Start Docker services (in case they're not running)
echo -e "${BLUE}Starting Docker services...${NC}"
docker compose up -d postgres redis

# Check if UI components are built, build if missing
if [ ! -d "packages/ui/dist" ]; then
    echo -e "${BLUE}Building UI components...${NC}"
    pnpm --filter @premstats/ui build
else
    echo -e "${YELLOW}UI components already built${NC}"
fi

# Start API if not running
if ! port_in_use 8081; then
    echo -e "${BLUE}Starting Go API...${NC}"
    cd packages/api && PORT=8081 ./bin/api &
    cd ../..
    sleep 3
else
    echo -e "${YELLOW}API already running on port 8081${NC}"
fi

# Start frontend if not running
if ! port_in_use 3000; then
    echo -e "${BLUE}Starting frontend...${NC}"
    cd apps/web && pnpm dev --host 0.0.0.0 --port 3000 &
    cd ../..
    sleep 5
else
    echo -e "${YELLOW}Frontend already running on port 3000${NC}"
fi

echo ""
echo -e "${GREEN}🚀 PremStats is ready!${NC}"
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 API:${NC}      http://localhost:8081"
echo ""