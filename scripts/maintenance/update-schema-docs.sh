#!/bin/bash

# Update Schema Documentation Script
# Automatically generates DATABASE_SCHEMA.md from live database

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 PremStats Schema Documentation Generator"
echo "============================================"

# Check if database is running
echo "🔍 Checking database connection..."
if ! docker compose exec postgres pg_isready -U premstats -d premstats -q; then
    echo "❌ Database is not running or not accessible"
    echo "💡 Start the database with: docker compose up -d postgres"
    exit 1
fi

echo "✅ Database connection OK"

# Check if node_modules exists in scripts directory
if [ ! -d "$SCRIPT_DIR/../node_modules" ]; then
    echo "📦 Installing script dependencies..."
    cd "$SCRIPT_DIR/.."
    npm install
fi

# Run the schema documentation generator
echo "📊 Generating schema documentation..."
cd "$SCRIPT_DIR"
node generate-schema-docs.js

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema documentation updated successfully!"
    echo "📄 File: docs/DATABASE_SCHEMA.md"
    echo "🔗 Related: docs/SCHEMA_DIAGRAM.md"
    echo ""
    echo "💡 Consider running this script:"
    echo "   - After database schema changes"
    echo "   - Before major releases"
    echo "   - When documentation becomes outdated"
else
    echo "❌ Schema documentation generation failed"
    exit 1
fi