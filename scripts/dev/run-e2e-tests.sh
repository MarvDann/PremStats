#!/bin/bash

# PremStats E2E Test Runner
# Ensures services are running before executing tests

set -e

echo "🎭 PremStats E2E Test Runner"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running${NC}"
        return 1
    fi
}

# Check if API is running
echo -e "${BLUE}Checking required services...${NC}"

if ! check_service "http://localhost:8081/api/v1/health" "API (localhost:8081)"; then
    echo -e "${YELLOW}Starting API...${NC}"
    cd packages/api
    if [ ! -f "bin/api" ]; then
        echo -e "${BLUE}Building API...${NC}"
        go build -o bin/api cmd/api/main.go
    fi
    PORT=8081 ./bin/api &
    API_PID=$!
    echo "API_PID=$API_PID" > ../../.api.pid
    cd ../..
    
    # Wait for API to be ready
    echo -e "${YELLOW}Waiting for API to start...${NC}"
    for i in {1..15}; do
        if curl -s "http://localhost:8081/api/v1/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ API is now running${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
fi

# Check if Docker services are running
echo -e "${BLUE}Checking Docker services...${NC}"
if ! docker compose ps | grep -q "Up"; then
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker compose up -d postgres redis
    sleep 5
fi

# Check if UI components are built
if [ ! -d "packages/ui/dist" ]; then
    echo -e "${BLUE}Building UI components...${NC}"
    pnpm --filter @premstats/ui build
fi

# Install Playwright browsers if needed
echo -e "${BLUE}Ensuring Playwright browsers are installed...${NC}"
cd apps/web
if ! pnpm exec playwright --version >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing Playwright browsers...${NC}"
    pnpm exec playwright install chromium
fi

# Parse command line arguments
TEST_MODE="headless"
case "${1:-}" in
    "ui"|"--ui")
        TEST_MODE="ui"
        ;;
    "headed"|"--headed")
        TEST_MODE="headed"
        ;;
    "debug"|"--debug")
        TEST_MODE="debug"
        ;;
esac

# Run tests based on mode
echo -e "${GREEN}🎭 Running E2E tests in $TEST_MODE mode...${NC}"

case "$TEST_MODE" in
    "ui")
        pnpm test:e2e:ui
        ;;
    "headed")
        pnpm test:e2e:headed
        ;;
    "debug")
        pnpm exec playwright test --debug
        ;;
    *)
        pnpm test:e2e
        ;;
esac

TEST_EXIT_CODE=$?

cd ../..

# Show results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All E2E tests passed!${NC}"
    echo -e "${BLUE}View test report: pnpm --filter @premstats/web test:e2e:report${NC}"
else
    echo -e "${RED}❌ Some E2E tests failed${NC}"
    echo -e "${YELLOW}Check the test output above for details${NC}"
    echo -e "${BLUE}View test report: pnpm --filter @premstats/web test:e2e:report${NC}"
fi

exit $TEST_EXIT_CODE