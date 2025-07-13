# PremStats Data Import System

## Production Import Workflow

This directory contains the **production-ready** data import scripts for PremStats. All experimental and testing scripts have been moved to `scripts/archive/`.

### 🚀 Quick Start

**Prerequisites:**
- PostgreSQL database running
- Environment variables configured (see `.env.example`)
- For football-data.org: `FOOTBALL_DATA_API_KEY` required

**Complete Data Import (New Installation):**
```bash
# 1. Foundation data (MUST run first)
node scripts/data/import-kaggle-squads-production.js

# 2. Historical matches (1992-2025)
node scripts/data/import-all-seasons.js

# 3. Current season player data
node scripts/data/import-fpl-data.js

# 4. Enhanced match events and goals
node scripts/data/import-match-events-production.js

# 5. Data quality fixes (if needed)
node scripts/data/fix-team-attribution-enhanced.js
```

### 📁 Production Scripts

#### **Foundation Data (Required First)**
- **`import-kaggle-squads-production.js`** - Squad and player data (1992-2024)
  - **Status**: ✅ Production Ready
  - **Dependencies**: None (run first)
  - **Data Source**: Kaggle Premier League Dataset
  - **Critical**: Required before any other imports

#### **Historical Data**
- **`import-all-seasons.js`** - Complete match results (1992-2025)
  - **Status**: ✅ Production Ready  
  - **Dependencies**: Squad data must be imported first
  - **Coverage**: 33 seasons, 12,800+ matches

#### **Current Season Data**
- **`import-fpl-data.js`** - Fantasy Premier League current season data
  - **Status**: ✅ Production Ready
  - **Dependencies**: Squad data
  - **Data Source**: Official FPL API
  - **Frequency**: Run weekly during season

#### **Enhanced Match Data**
- **`import-match-events-production.js`** - Goals, events, and detailed match data
  - **Status**: ✅ Production Ready
  - **Dependencies**: Squad data, match data
  - **Data Source**: Kaggle Match Events Dataset
  - **Coverage**: 2001-2022 seasons with detailed events

#### **Data Quality Tools**
- **`fix-team-attribution-enhanced.js`** - Corrects team attribution issues
  - **Status**: ✅ Production Tool
  - **Usage**: Run after imports if data quality issues detected
  - **Purpose**: Ensures goal attribution accuracy

#### **Utilities**
- **`check-available-seasons.js`** - Validates data completeness by season
- **`debug-csv-import.js`** - Debugging tool for CSV import issues
- **`refresh-current-season.js`** - Updates current season data
- **`clean-nationalities.js`** - Standardizes nationality data
- **`historical-data-completion.js`** - Fills historical data gaps

### 🔧 Advanced Data Sources

#### **Football-Data.org API (New System)**
Location: `scripts/football-data-org/`

**Production Scripts:**
- **`api-client.js`** - API client for football-data.org
- **`fixed-professional-importer.js`** - Latest professional data importer
- **`enhanced-data-importer.js`** - Enhanced import with validation
- **`import-professional-players.js`** - Professional player data

**Setup:**
```bash
# Set API key
export FOOTBALL_DATA_API_KEY="your_api_key_here"

# Run professional data import
node scripts/football-data-org/fixed-professional-importer.js
```

### 📊 Data Sources Overview

#### **Primary Sources (Production)**
1. **Kaggle Premier League Dataset** - Historical foundation (1992-2024)
2. **Football-Data.org API** - Modern API-based imports
3. **Fantasy Premier League API** - Current season updates
4. **Kaggle Match Events** - Detailed match events (2001-2022)

#### **Data Quality Framework**
- **6 Sigma Methodology**: Archived in `scripts/archive/6sigma/`
- **Live Monitoring**: Available at `/data-completeness` dashboard
- **Validation Scripts**: Located in `scripts/validation/`

### 🗂️ Archived Scripts

**Location:** `scripts/archive/`

#### **Obsolete Imports (Moved from scripts/data/)**
- `import-kaggle-squads.js` - Original version
- `import-kaggle-squads-fixed.js` - Fixed version
- `import-kaggle-squads-fixed-csv.js` - CSV fix version  
- `import-kaggle-squads-clean.js` - Clean version
- `fix-team-attribution.js` - Original team attribution

#### **Testing Scripts (Moved from scripts/data/ and scripts/football-data-org/)**
- `test-corruption-single-season.js` - Single season testing
- `test-csv-parsing.js` - CSV parsing validation
- `test-nationality-cleaning.js` - Nationality validation
- `corrected-api-test.js` - API testing
- `test-api-directly.js` - Direct API testing
- `test-data-boundaries.js` - Data boundary testing

#### **6 Sigma Implementation (Historical)**
- Complete 6 Sigma methodology implementation journey
- 28 scripts documenting the quality improvement process
- Keep archived for methodology reference

### ⚠️ Important Notes

#### **Execution Order**
**Squad data MUST be imported first** - all other imports depend on player/team records existing in the database.

#### **Data Dependencies**
```
import-kaggle-squads-production.js (foundation)
    ↓
import-all-seasons.js (matches)
    ↓
import-fpl-data.js (current season)
    ↓
import-match-events-production.js (detailed events)
    ↓
fix-team-attribution-enhanced.js (quality fixes)
```

#### **Environment Variables Required**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/premstats

# API Keys
FOOTBALL_DATA_API_KEY=your_football_data_org_key

# Optional
NODE_ENV=development
```

#### **Data Validation**
After running imports, verify data quality using:
- Live dashboard: http://localhost:3000/data-completeness
- Validation scripts: `scripts/validation/`
- Database integrity checks: `scripts/validation/data-integrity-check.js`

### 🚀 Modern Import Workflow (Recommended)

For new installations, prefer the **football-data.org API** approach:

```bash
# 1. Foundation (still required)
node scripts/data/import-kaggle-squads-production.js

# 2. Modern API-based import
export FOOTBALL_DATA_API_KEY="your_key"
node scripts/football-data-org/fixed-professional-importer.js

# 3. Validation
node scripts/validation/data-integrity-check.js
```

This provides more accurate, up-to-date data with better API reliability than CSV-based imports.

### 📈 Data Completeness Status

**Current Status (as of 2025-01-12):**
- **33 seasons** with 100% integrity
- **12,800+ matches** imported
- **8,500+ goals** with attribution
- **2,300+ players** across all seasons
- **27.9% average goal completeness**

Access real-time metrics at: http://localhost:3000/data-completeness

---

**For detailed technical documentation, see:**
- [6 Sigma Summary](../../docs/6-SIGMA-SUMMARY.md)
- [Database Schema](../../docs/DATABASE_SCHEMA.md)
- [Development Workflow](../../docs/development-workflow.md)