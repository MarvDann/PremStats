#!/bin/bash
# Agent Activity Monitor - Real-time visualization of all agent activities

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to display header
show_header() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}           ${CYAN}PremStats Agent Activity Monitor${NC}                    ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Function to monitor a specific log
monitor_log() {
    local agent=$1
    local color=$2
    local log_file="logs/agents/${agent}.log"
    
    if [ -f "$log_file" ]; then
        echo -e "${color}━━━ ${agent} ━━━${NC}"
        tail -5 "$log_file" | while IFS= read -r line; do
            # Highlight different types of entries
            if echo "$line" | grep -q "TASK_START"; then
                echo -e "${GREEN}▶${NC} $line"
            elif echo "$line" | grep -q "TASK_COMPLETE"; then
                echo -e "${GREEN}✓${NC} $line"
            elif echo "$line" | grep -q "ERROR"; then
                echo -e "${RED}✗${NC} $line"
            elif echo "$line" | grep -q "DELEGATED"; then
                echo -e "${PURPLE}→${NC} $line"
            elif echo "$line" | grep -q "TEST_RESULT: PASS"; then
                echo -e "${GREEN}✓${NC} $line"
            elif echo "$line" | grep -q "TEST_RESULT: FAIL"; then
                echo -e "${RED}✗${NC} $line"
            else
                echo "  $line"
            fi
        done
        echo ""
    fi
}

# Function to show summary
show_summary() {
    echo -e "${YELLOW}═══ Summary ═══${NC}"
    
    # Count tasks
    local total_tasks=$(grep -h "TASK_START" logs/agents/*.log 2>/dev/null | wc -l)
    local completed_tasks=$(grep -h "TASK_COMPLETE" logs/agents/*.log 2>/dev/null | wc -l)
    local errors=$(grep -h "ERROR" logs/agents/*.log 2>/dev/null | wc -l)
    
    echo -e "Total Tasks: ${CYAN}$total_tasks${NC}"
    echo -e "Completed: ${GREEN}$completed_tasks${NC}"
    echo -e "Errors: ${RED}$errors${NC}"
    echo ""
}

# Function to watch for live updates
live_monitor() {
    while true; do
        show_header
        
        # Monitor orchestrator
        monitor_log "orchestrator" "$PURPLE"
        
        # Monitor other agents
        monitor_log "frontend-developer" "$CYAN"
        monitor_log "backend-developer" "$BLUE"
        monitor_log "data-scraper" "$GREEN"
        monitor_log "qa-tester" "$YELLOW"
        monitor_log "devops-engineer" "$PURPLE"
        monitor_log "github-issue-resolver" "$RED"
        
        show_summary
        
        echo -e "${NC}Press Ctrl+C to exit. Refreshing in 2 seconds..."
        sleep 2
    done
}

# Main menu
case "${1:-live}" in
    "live")
        live_monitor
        ;;
    "errors")
        echo -e "${RED}═══ Recent Errors ═══${NC}"
        grep -h "ERROR" logs/agents/*.log 2>/dev/null | tail -20
        ;;
    "tasks")
        echo -e "${GREEN}═══ Recent Tasks ═══${NC}"
        grep -h "TASK_START\|TASK_COMPLETE" logs/agents/*.log 2>/dev/null | tail -20
        ;;
    "delegations")
        echo -e "${PURPLE}═══ Recent Delegations ═══${NC}"
        grep "DELEGATED" logs/agents/orchestrator.log 2>/dev/null | tail -20
        ;;
    "tests")
        echo -e "${YELLOW}═══ Recent Test Results ═══${NC}"
        grep -h "TEST_RESULT" logs/agents/*.log 2>/dev/null | tail -20
        ;;
    *)
        echo "Usage: $0 [live|errors|tasks|delegations|tests]"
        echo "  live        - Live monitoring (default)"
        echo "  errors      - Show recent errors"
        echo "  tasks       - Show recent task starts/completions"
        echo "  delegations - Show recent orchestrator delegations"
        echo "  tests       - Show recent test results"
        exit 1
        ;;
esac