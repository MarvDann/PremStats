#!/bin/bash

# PremStats Database Backup Script
# Creates full database backups with metadata and validation

set -e

# Configuration
BACKUP_DIR="backups/$(date +%Y-%m-%d)"
DB_NAME="premstats"
DB_USER="premstats"
DB_HOST="localhost"
DB_PORT="5432"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting PremStats database backup..."
echo "📅 Backup date: $(date)"
echo "📁 Backup directory: $BACKUP_DIR"

# 1. Create full database dump
echo "📦 Creating full database dump..."
docker compose exec postgres pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --verbose \
    > "$BACKUP_DIR/premstats_full_$(date +%Y%m%d_%H%M%S).backup"

# 2. Create plain SQL dump for human readability
echo "📝 Creating plain SQL dump..."
docker compose exec postgres pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    > "$BACKUP_DIR/premstats_plain_$(date +%Y%m%d_%H%M%S).sql"

# 3. Export critical table data as CSV for validation
echo "📊 Exporting table data for validation..."
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\copy matches TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/matches_$(date +%Y%m%d_%H%M%S).csv"
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\copy goals TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/goals_$(date +%Y%m%d_%H%M%S).csv"
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\copy players TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/players_$(date +%Y%m%d_%H%M%S).csv"
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\copy teams TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/teams_$(date +%Y%m%d_%H%M%S).csv"
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME" -c "\copy seasons TO STDOUT WITH CSV HEADER" > "$BACKUP_DIR/seasons_$(date +%Y%m%d_%H%M%S).csv"

# 4. Generate database statistics for validation
echo "📈 Generating database statistics..."
docker compose exec postgres psql -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/db_stats_$(date +%Y%m%d_%H%M%S).txt" << 'EOF'
-- Database Statistics Report
-- Generated: 
SELECT NOW() as backup_timestamp;

-- Table counts
SELECT 'seasons' as table_name, COUNT(*) as record_count FROM seasons
UNION ALL
SELECT 'teams' as table_name, COUNT(*) as record_count FROM teams  
UNION ALL
SELECT 'players' as table_name, COUNT(*) as record_count FROM players
UNION ALL
SELECT 'matches' as table_name, COUNT(*) as record_count FROM matches
UNION ALL
SELECT 'goals' as table_name, COUNT(*) as record_count FROM goals;

-- Season integrity check
SELECT 
  s.name as season,
  COUNT(m.id) as match_count,
  CASE WHEN s.id <= 3 THEN 462 ELSE 380 END as expected_matches,
  COUNT(g.id) as goal_count
FROM seasons s
LEFT JOIN matches m ON s.id = m.season_id
LEFT JOIN goals g ON m.id = g.match_id
WHERE s.id <= 33
GROUP BY s.id, s.name
ORDER BY s.id;

-- Data quality indicators
SELECT 
  'Total duplicate goals' as metric,
  COUNT(*) as value
FROM (
  SELECT match_id, player_id, minute, COUNT(*) as duplicates
  FROM goals 
  GROUP BY match_id, player_id, minute
  HAVING COUNT(*) > 1
) dupe_goals;
EOF

# 5. Create backup metadata
echo "📋 Creating backup metadata..."
cat > "$BACKUP_DIR/backup_metadata.json" << EOF
{
  "backup_date": "$(date -Iseconds)",
  "database_name": "$DB_NAME",
  "backup_type": "full",
  "script_version": "1.0",
  "files": {
    "full_backup": "premstats_full_$(date +%Y%m%d_%H%M%S).backup",
    "sql_dump": "premstats_plain_$(date +%Y%m%d_%H%M%S).sql",
    "matches_csv": "matches_$(date +%Y%m%d_%H%M%S).csv",
    "goals_csv": "goals_$(date +%Y%m%d_%H%M%S).csv",
    "players_csv": "players_$(date +%Y%m%d_%H%M%S).csv",
    "teams_csv": "teams_$(date +%Y%m%d_%H%M%S).csv",
    "seasons_csv": "seasons_$(date +%Y%m%d_%H%M%S).csv",
    "statistics": "db_stats_$(date +%Y%m%d_%H%M%S).txt"
  },
  "backup_purpose": "Pre-6Sigma-cleanup emergency backup",
  "validation_status": "pending"
}
EOF

# 6. Validate backup integrity
echo "✅ Validating backup integrity..."
BACKUP_FILE="$BACKUP_DIR/premstats_full_$(date +%Y%m%d_%H%M%S).backup"

if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(stat -c%s "$BACKUP_FILE")
    echo "✅ Backup file created successfully: $BACKUP_SIZE bytes"
    
    # Test backup readability
    docker compose exec postgres pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Backup file is valid and readable"
    else
        echo "❌ Backup file validation failed"
        exit 1
    fi
else
    echo "❌ Backup file creation failed"
    exit 1
fi

# 7. Create restore script
echo "🔧 Creating restore script..."
cat > "$BACKUP_DIR/restore.sh" << 'RESTORE_EOF'
#!/bin/bash
# Restore script for this backup

set -e

BACKUP_DIR="$(dirname "$0")"
DB_NAME="premstats"
DB_USER="premstats"

echo "⚠️  WARNING: This will completely replace the current database!"
echo "📁 Restoring from: $BACKUP_DIR"
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Find the backup file
BACKUP_FILE=$(ls "$BACKUP_DIR"/premstats_full_*.backup | head -1)

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found"
    exit 1
fi

echo "🔄 Dropping existing database..."
docker compose exec postgres dropdb -U "$DB_USER" --if-exists "$DB_NAME"

echo "🔄 Creating new database..."
docker compose exec postgres createdb -U "$DB_USER" "$DB_NAME"

echo "🔄 Restoring from backup..."
docker compose exec postgres pg_restore -U "$DB_USER" -d "$DB_NAME" --verbose "$BACKUP_FILE"

echo "✅ Database restore completed successfully"
echo "🔍 Run validation checks to verify restore integrity"
RESTORE_EOF

chmod +x "$BACKUP_DIR/restore.sh"

echo ""
echo "🎉 Backup completed successfully!"
echo "📁 Backup location: $BACKUP_DIR"
echo "🔧 Restore script: $BACKUP_DIR/restore.sh"
echo "📊 Statistics: $BACKUP_DIR/db_stats_$(date +%Y%m%d_%H%M%S).txt"
echo ""
echo "⚠️  IMPORTANT: This backup should be tested before proceeding with cleanup!"