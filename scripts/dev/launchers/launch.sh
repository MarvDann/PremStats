#!/bin/bash

# PremStats Application Launcher
# This script starts all necessary services for the PremStats application

set -e

echo "🚀 Starting PremStats Application..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to check if a service is responding
check_service() {
    local url=$1
    curl -s "$url" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists pnpm; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    exit 1
fi

if ! command_exists go; then
    echo -e "${RED}❌ Go is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are available${NC}"

# Start Docker services (PostgreSQL and Redis)
echo -e "${BLUE}Starting Docker services...${NC}"
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U premstats >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
done

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install

# Build UI components
echo -e "${BLUE}Building UI components...${NC}"
cd packages/ui && pnpm build && cd ../..

# Start Go API in background
echo -e "${BLUE}Starting Go API backend...${NC}"
cd packages/api

# Check if API is already running
if port_in_use 8081; then
    echo -e "${YELLOW}⚠️  API already running on port 8081${NC}"
else
    # Build and start API
    echo -e "${BLUE}Building Go API...${NC}"
    if ! go build -o bin/api cmd/api/main.go; then
        echo -e "${RED}❌ Failed to build Go API${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Starting Go API server...${NC}"
    PORT=8081 ./bin/api &
    API_PID=$!
    echo "API_PID=$API_PID" > ../../.api.pid
    echo -e "${GREEN}✅ Go API started with PID: $API_PID${NC}"
fi

cd ../..

# Wait for API to be ready
echo -e "${YELLOW}Waiting for Go API to be ready...${NC}"
for i in {1..30}; do
    if curl -s "http://localhost:8081/api/v1/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Go API is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Go API failed to start${NC}"
        exit 1
    fi
done

# Start frontend
echo -e "${BLUE}Starting frontend...${NC}"
cd apps/web

# Check if frontend is already running
if port_in_use 3000; then
    echo -e "${YELLOW}⚠️  Frontend already running on port 3000${NC}"
else
    echo -e "${BLUE}Starting frontend development server...${NC}"
    pnpm dev --host 0.0.0.0 --port 3000 &
    FRONTEND_PID=$!
    echo "FRONTEND_PID=$FRONTEND_PID" > ../../.frontend.pid
    echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID${NC}"
fi

cd ../..

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for Frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s "http://localhost:3000" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 2
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🎉 PremStats Application is now running!${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 API:${NC}      http://localhost:8081"
echo -e "${BLUE}🗄️  Database:${NC} localhost:5432"
echo -e "${BLUE}🔴 Redis:${NC}    localhost:6379"
echo ""
echo -e "${YELLOW}To stop the application, run: ./stop.sh${NC}"
echo ""

# Keep script running
echo -e "${BLUE}Press Ctrl+C to stop all services...${NC}"
trap 'echo -e "\n${YELLOW}Stopping services...${NC}"; ./stop.sh; exit 0' INT

# Keep the script alive
while true; do
    sleep 10
done