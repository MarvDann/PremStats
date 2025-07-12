#!/bin/bash

# PremStats Data Integrity Check Runner
# Executes comprehensive validation and generates report

set -e

echo "🔍 PremStats Data Integrity Validation"
echo "======================================="
echo "📅 Validation date: $(date)"
echo ""

# Check if database is available
if ! docker compose exec postgres pg_isready -U premstats > /dev/null 2>&1; then
    echo "❌ Database is not available. Please start the database first:"
    echo "   docker compose up -d postgres"
    exit 1
fi

echo "✅ Database connection verified"
echo ""

# Create reports directory
REPORT_DIR="reports/integrity-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$REPORT_DIR"

echo "📊 Running comprehensive data integrity validation..."
echo "📁 Report will be saved to: $REPORT_DIR"
echo ""

# Run the validation SQL and capture output
docker compose exec postgres psql -U premstats -d premstats \
    -f /home/marvdann/projects/PremStats/scripts/validation/data-integrity-check.sql \
    > "$REPORT_DIR/integrity_report.txt" 2>&1

# Check if validation completed successfully
if [ $? -eq 0 ]; then
    echo "✅ Validation completed successfully"
    
    # Extract key results
    echo ""
    echo "📋 Key Validation Results:"
    echo "=========================="
    
    # Count PASS/FAIL results
    PASS_COUNT=$(grep -c "PASS" "$REPORT_DIR/integrity_report.txt" || echo "0")
    FAIL_COUNT=$(grep -c "FAIL" "$REPORT_DIR/integrity_report.txt" || echo "0")
    
    echo "✅ Passed checks: $PASS_COUNT"
    echo "❌ Failed checks: $FAIL_COUNT"
    
    # Show any failures
    if [ "$FAIL_COUNT" -gt 0 ]; then
        echo ""
        echo "⚠️  Failed Validation Checks:"
        echo "=============================="
        grep "FAIL" "$REPORT_DIR/integrity_report.txt" || echo "No failures found in grep"
        echo ""
        echo "🚨 CRITICAL: Data integrity issues detected!"
        echo "   Review the full report: $REPORT_DIR/integrity_report.txt"
        exit 1
    else
        echo ""
        echo "🎉 All validation checks passed!"
        echo "✅ Data integrity is excellent"
    fi
    
    # Show summary metrics
    echo ""
    echo "📈 Summary Metrics:"
    echo "==================="
    grep -A 10 "=== DATA INTEGRITY SUMMARY ===" "$REPORT_DIR/integrity_report.txt" | tail -n +3 || echo "Summary not found"
    
else
    echo "❌ Validation failed to complete"
    echo "Check the report for details: $REPORT_DIR/integrity_report.txt"
    exit 1
fi

# Create validation badge
if [ "$FAIL_COUNT" -eq 0 ]; then
    echo "✅ PASS" > "$REPORT_DIR/validation_status.txt"
    echo "Data integrity validation passed at $(date)" >> "$REPORT_DIR/validation_status.txt"
else
    echo "❌ FAIL" > "$REPORT_DIR/validation_status.txt"
    echo "Data integrity validation failed at $(date)" >> "$REPORT_DIR/validation_status.txt"
    echo "$FAIL_COUNT checks failed" >> "$REPORT_DIR/validation_status.txt"
fi

echo ""
echo "📁 Full report saved to: $REPORT_DIR/integrity_report.txt"
echo "🏷️  Status: $(cat $REPORT_DIR/validation_status.txt | head -1)"
echo ""
echo "To view the full report:"
echo "  cat $REPORT_DIR/integrity_report.txt"