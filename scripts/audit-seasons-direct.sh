#!/bin/bash

echo "🚀 Starting comprehensive season audit..."
echo "========================================"

# Create results file
RESULTS_FILE="/tmp/season_audit_results.txt"
> "$RESULTS_FILE"

# Function to analyze a single season
analyze_season() {
    local season_id=$1
    local season_name=$2
    
    echo "🔍 Auditing Season $season_id ($season_name)..."
    
    # Get all matches for this season
    response=$(curl -s "http://localhost:8081/api/v1/matches?season=$season_id&limit=1000")
    
    if [[ $? -ne 0 ]]; then
        echo "$season_id,$season_name,ERROR,API_ERROR,No matches,❌ Corrupted,API request failed" >> "$RESULTS_FILE"
        return
    fi
    
    # Extract match count and matches data
    match_count=$(echo "$response" | grep -o '"matches":\[.*\]' | grep -o '"id":[0-9]*' | wc -l)
    
    if [[ $match_count -eq 0 ]]; then
        echo "$season_id,$season_name,0,No matches,No matches,❌ Corrupted,No matches found" >> "$RESULTS_FILE"
        return
    fi
    
    # Get expected match count
    if [[ $season_id -le 3 ]]; then
        expected_count=462
    else
        expected_count=380
    fi
    
    # Extract dates and analyze
    dates=$(echo "$response" | grep -o '"date":"[^"]*"' | grep -o '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
    
    if [[ -z "$dates" ]]; then
        echo "$season_id,$season_name,$match_count,$expected_count,No valid dates,❌ Corrupted,No valid dates found" >> "$RESULTS_FILE"
        return
    fi
    
    # Get earliest and latest dates
    earliest_date=$(echo "$dates" | sort | head -1)
    latest_date=$(echo "$dates" | sort | tail -1)
    
    # Get years from dates
    earliest_year=$(echo "$earliest_date" | cut -d'-' -f1)
    latest_year=$(echo "$latest_date" | cut -d'-' -f1)
    
    # Calculate expected years
    expected_start_year=$((1992 + season_id - 1))
    expected_end_year=$((expected_start_year + 1))
    
    # Analyze corruption
    date_range="$earliest_date to $latest_date"
    category="✅ Good"
    issues=""
    
    # Check for date corruption
    if [[ "$earliest_year" == "2020" && "$latest_year" == "2020" ]]; then
        category="❌ Corrupted"
        issues="All dates show 2020 (data corruption)"
    elif [[ $earliest_year -lt $((expected_start_year - 2)) || $latest_year -gt $((expected_end_year + 2)) ]]; then
        # Check if dates are way off
        if [[ $earliest_year -lt $((expected_start_year - 5)) || $latest_year -gt $((expected_end_year + 5)) ]]; then
            category="❌ Corrupted"
            issues="Dates in $earliest_year-$latest_year, expected $expected_start_year-$expected_end_year"
        elif [[ $earliest_year -ge $expected_start_year && $latest_year -le $expected_end_year ]]; then
            category="✅ Good"
        else
            category="⚠️ Suspicious"
            issues="Dates in $earliest_year-$latest_year, expected $expected_start_year-$expected_end_year"
        fi
    fi
    
    # Check match count
    count_diff=$((match_count - expected_count))
    if [[ $count_diff -lt 0 ]]; then
        count_diff=$((-count_diff))
    fi
    
    # Allow 10% tolerance for match count
    tolerance=$((expected_count / 10))
    
    if [[ $count_diff -gt $tolerance ]]; then
        if [[ "$category" == "✅ Good" ]]; then
            category="⚠️ Suspicious"
        fi
        if [[ -n "$issues" ]]; then
            issues="$issues; Match count: $match_count (expected ~$expected_count)"
        else
            issues="Match count: $match_count (expected ~$expected_count)"
        fi
    fi
    
    # Handle duplicate matches in 1994/95
    if [[ $season_id -eq 3 && $match_count -gt 500 ]]; then
        category="⚠️ Suspicious"
        if [[ -n "$issues" ]]; then
            issues="$issues; Potential duplicate matches"
        else
            issues="Potential duplicate matches"
        fi
    fi
    
    if [[ -z "$issues" ]]; then
        issues="None"
    fi
    
    echo "$season_id,$season_name,$match_count,$expected_count,$date_range,$category,$issues" >> "$RESULTS_FILE"
}

# Generate season names and analyze each
for season_id in {1..34}; do
    start_year=$((1992 + season_id - 1))
    end_year=$((start_year + 1))
    season_name="${start_year}/${end_year:2:2}"
    
    analyze_season $season_id $season_name
done

echo ""
echo "📊 COMPREHENSIVE SEASON AUDIT REPORT"
echo "========================================"

# Count categories
good_count=$(grep -c "✅ Good" "$RESULTS_FILE")
suspicious_count=$(grep -c "⚠️ Suspicious" "$RESULTS_FILE")
corrupted_count=$(grep -c "❌ Corrupted" "$RESULTS_FILE")
total_count=$(wc -l < "$RESULTS_FILE")

echo ""
echo "📈 SUMMARY STATISTICS:"
echo "✅ Good seasons: $good_count"
echo "⚠️ Suspicious seasons: $suspicious_count"  
echo "❌ Corrupted seasons: $corrupted_count"
echo "📊 Total seasons audited: $total_count"

echo ""
echo "📋 DETAILED RESULTS:"
printf "%-3s | %-7s | %-7s | %-8s | %-25s | %-12s | %s\n" "ID" "Season" "Matches" "Expected" "Date Range" "Status" "Issues"
echo "--------------------------------------------------------------------------------------------------------"

# Sort results by season ID and display
sort -t',' -k1,1n "$RESULTS_FILE" | while IFS=',' read -r season_id season_name match_count expected_count date_range category issues; do
    printf "%-3s | %-7s | %-7s | %-8s | %-25s | %-12s | %s\n" "$season_id" "$season_name" "$match_count" "$expected_count" "$date_range" "$category" "$issues"
done

# Category breakdowns
echo ""
if [[ $corrupted_count -gt 0 ]]; then
    echo "❌ CORRUPTED SEASONS ($corrupted_count):"
    grep "❌ Corrupted" "$RESULTS_FILE" | sort -t',' -k1,1n | while IFS=',' read -r season_id season_name match_count expected_count date_range category issues; do
        echo "   $season_id ($season_name): $issues"
    done
fi

echo ""
if [[ $suspicious_count -gt 0 ]]; then
    echo "⚠️ SUSPICIOUS SEASONS ($suspicious_count):"
    grep "⚠️ Suspicious" "$RESULTS_FILE" | sort -t',' -k1,1n | while IFS=',' read -r season_id season_name match_count expected_count date_range category issues; do
        echo "   $season_id ($season_name): $issues"
    done
fi

echo ""
if [[ $good_count -gt 0 ]]; then
    echo "✅ GOOD SEASONS ($good_count):"
    grep "✅ Good" "$RESULTS_FILE" | sort -t',' -k1,1n | while IFS=',' read -r season_id season_name match_count expected_count date_range category issues; do
        echo "   $season_id ($season_name): $match_count matches, $date_range"
    done
fi

echo ""
echo "🎯 RECOMMENDATIONS:"
if [[ $corrupted_count -gt 0 ]]; then
    echo "❌ $corrupted_count seasons need complete re-import"
fi
if [[ $suspicious_count -gt 0 ]]; then
    echo "⚠️ $suspicious_count seasons need investigation"
fi
if [[ $good_count -gt 0 ]]; then
    echo "✅ $good_count seasons have reliable data"
fi

# Save detailed JSON report
echo ""
echo "💾 Creating detailed JSON report..."
cat > "/home/marvdann/projects/PremStats/season-audit-report.json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total": $total_count,
    "good": $good_count,
    "suspicious": $suspicious_count,
    "corrupted": $corrupted_count
  },
  "seasons": [
EOF

# Add season data to JSON
first=true
sort -t',' -k1,1n "$RESULTS_FILE" | while IFS=',' read -r season_id season_name match_count expected_count date_range category issues; do
    if [[ "$first" == "true" ]]; then
        first=false
    else
        echo "," >> "/home/marvdann/projects/PremStats/season-audit-report.json"
    fi
    
    cat >> "/home/marvdann/projects/PremStats/season-audit-report.json" << EOF
    {
      "seasonId": $season_id,
      "seasonName": "$season_name",
      "matchCount": $match_count,
      "expectedCount": $expected_count,
      "dateRange": "$date_range",
      "category": "$category",
      "issues": "$issues"
    }
EOF
done

cat >> "/home/marvdann/projects/PremStats/season-audit-report.json" << EOF
  ]
}
EOF

echo "💾 Detailed report saved to: season-audit-report.json"

# Clean up
rm "$RESULTS_FILE"

echo ""
echo "🎉 Audit complete!"