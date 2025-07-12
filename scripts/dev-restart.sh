#!/bin/bash

# Streamlined development restart script
# Checks what's running and restarts only what's needed

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔄 PremStats Development Restart${NC}"

# Ensure we're in project root
cd "$(dirname "$0")/.."

# Check database
if ! docker compose ps postgres | grep -q "Up"; then
    echo -e "${YELLOW}🚀 Starting database...${NC}"
    docker compose up -d postgres
    sleep 8
else
    echo -e "${GREEN}✅ Database already running${NC}"
fi

# Check API
if curl -s "http://localhost:8081/api/v1/teams" > /dev/null 2>&1; then
    echo -e "${YELLOW}🔄 Restarting existing API...${NC}"
    pkill -f "api\|main.go" || true
    sleep 3
else
    echo -e "${YELLOW}🚀 Starting API...${NC}"
fi

# Start API
cd packages/api
go build -o bin/api cmd/api/main.go
PORT=8081 ./bin/api > api.log 2>&1 &
API_PID=$!
echo "API_PID=$API_PID" > ../../.api.pid

# Verify API
sleep 5
if curl -s "http://localhost:8081/api/v1/teams" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API running on port 8081${NC}"
else
    echo -e "${YELLOW}❌ API failed - check api.log${NC}"
    tail -5 api.log
    exit 1
fi

# Test new features
echo -e "${BLUE}🧪 Testing team filter...${NC}"
ARSENAL_ID=$(curl -s "http://localhost:8081/api/v1/teams" | jq -r '.data.teams[] | select(.name == "Arsenal") | .id')
RESULT=$(curl -s "http://localhost:8081/api/v1/players?limit=2&team=$ARSENAL_ID" | jq -r '.data.total // "null"')
if [ "$RESULT" != "null" ]; then
    echo -e "${GREEN}✅ Team filter working - Arsenal (ID:$ARSENAL_ID) has $RESULT players${NC}"
else
    echo -e "${YELLOW}⚠️  Team filter not working yet (testing with Arsenal ID:$ARSENAL_ID)${NC}"
fi

echo -e "${BLUE}🧪 Testing pagination...${NC}"
TOTAL=$(curl -s "http://localhost:8081/api/v1/players?limit=5" | jq -r '.data.total // "null"')
if [ "$TOTAL" != "null" ]; then
    echo -e "${GREEN}✅ Pagination working - Total players: $TOTAL${NC}"
else
    echo -e "${YELLOW}⚠️  Pagination not working yet${NC}"
fi

echo -e "${GREEN}🎉 Development environment ready!${NC}"