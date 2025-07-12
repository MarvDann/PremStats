#!/bin/bash

echo "🚀 Starting PremStats Frontend..."

cd "$(dirname "$0")/.."

# Check if UI components are built
if [ ! -d "packages/ui/dist" ]; then
    echo "📦 Building UI components first..."
    pnpm --filter @premstats/ui build
fi

# Start frontend
echo "📱 Starting frontend development server..."
cd apps/web
pnpm dev --host 0.0.0.0 --port 3000