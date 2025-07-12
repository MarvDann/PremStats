#!/bin/bash

echo "🚀 Starting PremStats API..."

cd "$(dirname "$0")/../packages/api"

# Check if binary exists, if not build it
if [ ! -f "bin/api" ]; then
    echo "🔧 Building API binary..."
    go build -o bin/api cmd/api/main.go
fi

# Start API
echo "🔧 Starting API server..."
PORT=8081 ./bin/api