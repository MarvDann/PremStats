#!/bin/bash

# PremStats Application Stopper
# This script stops all PremStats services

set -e

echo "🛑 Stopping PremStats Application..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Stop frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid | grep FRONTEND_PID | cut -d'=' -f2)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID
    fi
    rm -f .frontend.pid
fi

# Stop API
if [ -f .api.pid ]; then
    API_PID=$(cat .api.pid | grep API_PID | cut -d'=' -f2)
    if ps -p $API_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping API (PID: $API_PID)...${NC}"
        kill $API_PID
    fi
    rm -f .api.pid
fi

# Kill any remaining processes
echo -e "${BLUE}Stopping any remaining processes...${NC}"
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "premstats.*api" 2>/dev/null || true
pkill -f "go run.*api" 2>/dev/null || true

# Stop Docker services
echo -e "${BLUE}Stopping Docker services...${NC}"
docker compose down

echo -e "${GREEN}✅ All services stopped!${NC}"