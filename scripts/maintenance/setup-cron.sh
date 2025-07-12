#!/bin/bash

# Setup automated daily data updates for PremStats
# This script configures a cron job to run daily data updates

set -e

PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CRON_SCRIPT="$PROJECT_DIR/scripts/daily-data-update.js"
LOG_DIR="$PROJECT_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up automated data updates for PremStats...${NC}"

# Create logs directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    echo -e "${GREEN}📁 Created logs directory: $LOG_DIR${NC}"
fi

# Make scripts executable
chmod +x "$CRON_SCRIPT"
chmod +x "$PROJECT_DIR/scripts/import-squad-data.js"
chmod +x "$PROJECT_DIR/scripts/import-fpl-data.js"

echo -e "${GREEN}✅ Made scripts executable${NC}"

# Create cron job entry
CRON_ENTRY="0 6 * * * cd $PROJECT_DIR && /usr/bin/node scripts/daily-data-update.js --automated >> logs/daily-update.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "daily-data-update.js"; then
    echo -e "${YELLOW}⚠️  Cron job already exists. Updating...${NC}"
    # Remove existing entry and add new one
    (crontab -l 2>/dev/null | grep -v "daily-data-update.js"; echo "$CRON_ENTRY") | crontab -
else
    # Add new cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
fi

echo -e "${GREEN}✅ Cron job configured${NC}"
echo -e "${BLUE}📅 Schedule: Daily at 6:00 AM${NC}"
echo -e "${BLUE}📁 Logs: $LOG_DIR/daily-update.log${NC}"

# Display current cron jobs
echo -e "\n${BLUE}🔍 Current cron jobs:${NC}"
crontab -l | grep -E "(daily-data-update|PremStats)" || echo "No PremStats cron jobs found"

echo -e "\n${BLUE}💡 Manual commands:${NC}"
echo -e "   Test update: ${YELLOW}node scripts/daily-data-update.js${NC}"
echo -e "   View logs:   ${YELLOW}tail -f logs/daily-update.log${NC}"
echo -e "   Remove cron: ${YELLOW}crontab -e${NC} (then delete the PremStats line)"

echo -e "\n${GREEN}🎉 Automated data updates configured successfully!${NC}"