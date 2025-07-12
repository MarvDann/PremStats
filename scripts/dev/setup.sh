#!/bin/bash

echo "🚀 Setting up PremStats development environment..."

# Check for required tools
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }

echo "✅ All required tools found"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p packages/api/cmd/api
mkdir -p packages/api/internal/{handlers,routes,models}
mkdir -p packages/scraper/cmd/scraper
mkdir -p packages/ui/src/components
mkdir -p apps/web/src/{pages,components,utils}

# Create go.mod files
echo "🔧 Initializing Go modules..."
cd packages/api && go mod init github.com/premstats/api && cd ../..
cd packages/scraper && go mod init github.com/premstats/scraper && cd ../..

# Make scripts executable
chmod +x scripts/agent-cli.js
chmod +x agents/data/index.js
chmod +x agents/base/agent-worker.js

# Start Docker services
echo "🐳 Starting Docker services..."
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec postgres pg_isready -U premstats > /dev/null 2>&1; do
  sleep 1
done

echo "✅ PostgreSQL is ready"

# Display next steps
echo ""
echo "✨ Setup complete! Next steps:"
echo ""
echo "1. Start the development environment:"
echo "   docker compose up"
echo ""
echo "2. In another terminal, run the data agent:"
echo "   pnpm --filter @premstats/agents agent:data"
echo ""
echo "3. Dispatch a task to the agent:"
echo "   pnpm agent task data 'Scrape latest results'"
echo ""
echo "4. Check agent status:"
echo "   pnpm agent status"
echo ""
echo "Happy coding! 🎉"