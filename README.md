# PremStats - Premier League Statistics Platform

A comprehensive web application for Premier League statistics from 1992 to present, featuring automated data collection, beautiful visualizations, and AI-powered development workflows.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.3.3-blue.svg)
![Go](https://img.shields.io/badge/go-%5E1.21-00ADD8.svg)

## 🎯 Features

- **Historical Data**: Complete Premier League statistics from 1992 to present
- **Real-time Updates**: Automated data scraping after every match
- **Beautiful UI**: Responsive design with dark/light themes
- **Advanced Queries**: Natural language search (e.g., "Did Manchester United beat Arsenal in 1996 at Old Trafford?")
- **Visualizations**: Interactive charts and graphs for statistics
- **AI Integration**: GitHub issue automation with AI agents
- **Multi-agent Architecture**: Parallel development with specialized agents

## 🛠️ Tech Stack

### Frontend
- **Framework**: SolidJS with TypeScript
- **Styling**: Tailwind CSS with themeable components
- **State Management**: Solid Query
- **Charts**: Chart.js with Solid bindings
- **Testing**: Vitest + Playwright

### Backend
- **API**: Go with RESTful + GraphQL endpoints
- **Database**: PostgreSQL
- **Cache**: Redis
- **Scraping**: Go with Colly/Chromium
- **Testing**: Go testing framework

### Infrastructure
- **Development**: Docker Compose
- **Build**: pnpm workspaces (monorepo)
- **CI/CD**: GitHub Actions
- **Deployment**: Container-based

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker & Docker Compose
- Go >= 1.21 (for backend development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PremStats.git
cd PremStats
```

2. Run the setup script:
```bash
./scripts/setup.sh
```

3. Start the development environment:
```bash
docker-compose up
```

4. Access the applications:
- Web App: http://localhost:3000
- API: http://localhost:8080
- Storybook: http://localhost:6006
- pgAdmin: http://localhost:5050

## 📁 Project Structure

```
PremStats/
├── apps/
│   └── web/                 # Main SolidJS application
├── packages/
│   ├── ui/                  # Shared component library
│   ├── api/                 # Go backend API
│   └── scraper/            # Go web scraping service
├── agents/                  # AI agent workers
│   ├── data/               # Data collection agent
│   ├── frontend/           # Frontend development agent
│   ├── backend/            # Backend development agent
│   ├── devops/             # DevOps automation agent
│   └── qa/                 # Testing and QA agent
├── docker/                  # Docker configurations
├── scripts/                # Utility scripts
└── .github/               # GitHub Actions workflows
```

## 🎮 Development Commands

### General
```bash
# Install dependencies
pnpm install

# Start all services
docker-compose up

# Run development servers
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint:fix

# Type check
pnpm typecheck
```

### Agent Commands
```bash
# Dispatch task to agent
pnpm agent task data "Scrape latest results"

# Check agent status
pnpm agent status

# List pending tasks
pnpm agent list

# Shortcuts
pnpm agent scrape "fixtures"
pnpm agent build-ui "PlayerCard"
pnpm agent api "/players/:id"
```

### Database
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U premstats

# Run migrations
docker-compose exec api go run ./cmd/migrate up
```

## 🧪 Testing

### Unit Tests
```bash
# Frontend
pnpm --filter @premstats/web test:unit

# Backend
cd packages/api && go test ./...
```

### E2E Tests
```bash
pnpm test:e2e
```

### Visual Testing
```bash
pnpm storybook
```

## 🤖 AI Agent System

The project uses a multi-agent architecture for parallel development:

1. **Data Agent**: Handles web scraping and data updates
2. **Frontend Agent**: Builds UI components and features
3. **Backend Agent**: Develops API endpoints and business logic
4. **DevOps Agent**: Manages CI/CD and deployments
5. **QA Agent**: Creates and maintains tests

Agents communicate via Redis task queues and can work independently.

## 📊 API Examples

### REST Endpoints
```bash
# Get all teams
GET /api/v1/teams

# Get player statistics
GET /api/v1/players?season=2023

# Get match results
GET /api/v1/matches?team=arsenal&season=2023

# Natural language query
POST /api/v1/query
{
  "query": "Who scored the most goals in 2022?"
}
```

### GraphQL
```graphql
query {
  teams {
    id
    name
    standings(season: "2023/24") {
      position
      points
      goalDifference
    }
  }
}
```

## 🎨 Component Library

The UI package provides themeable components:

- `DataTable` - Sortable, filterable tables
- `Chart` - Line, bar, pie charts
- `Card` - Content containers
- `Modal` - Dialogs and overlays
- `Form` - Input controls

Access Storybook at http://localhost:6006 for component documentation.

## 🚢 Deployment

### Production Build
```bash
# Build all packages
pnpm build

# Build Docker images
docker-compose -f docker-compose.prod.yml build
```

### Environment Variables
Create `.env` files for each environment:

```env
# Frontend
VITE_API_URL=https://api.premstats.com

# Backend
DATABASE_URL=postgresql://user:pass@host:5432/premstats
REDIS_URL=redis://host:6379

# Scraper
RATE_LIMIT=10
CACHE_DIR=/tmp/scraper-cache
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- 2 space indentation
- No semicolons
- Single quotes
- No trailing commas
- ESLint with neostandard rules

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Premier League for the amazing football data
- The open-source community for the fantastic tools
- AI assistants for accelerating development

## 📞 Support

- Create an issue for bug reports or feature requests
- Check the [documentation](docs/) for detailed guides
- Join our discussions for questions and ideas

---

Built with ❤️ by football fans, for football fans