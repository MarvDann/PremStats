# Data Import Scripts

Scripts for importing and processing football data from various external sources.

## 📋 Import Order & Dependencies

**CRITICAL**: Squad data must be imported first to properly map goal scorers to players.

### Recommended Import Sequence
1. **Squad Data** (`import-squad-data.js`) - Foundation player data
2. **Season Data** (`import-all-seasons.js`) - Historical match results  
3. **Player Data** (`import-player-data.js`) - Additional player information
4. **Goal Scorers** (`import-historical-scorers.js`) - Goal events by player
5. **Current Season** (`refresh-current-season.js`) - Live season updates

## 📁 Scripts Overview

### `import-squad-data.js`
**Priority: CRITICAL - Run First**

Imports squad/team rosters by season to establish player-team relationships.

**Usage:**
```bash
node scripts/data/import-squad-data.js [season]
```

**Data Sources:**
- Fantasy Premier League API
- OpenFootball Project squad data
- Historical team rosters

**What it imports:**
- Player names and basic info
- Team affiliations by season
- Transfer tracking between seasons
- Current team assignments

**Environment Variables:**
```bash
FPL_API_URL=https://fantasy.premierleague.com/api
OPENFOOOTBALL_API_URL=https://raw.githubusercontent.com/openfootball
```

### `import-all-seasons.js`
**Priority: HIGH**

Bulk import all historical Premier League seasons (1992/93 - 2024/25).

**Usage:**
```bash
node scripts/data/import-all-seasons.js [--season=YYYY/YY] [--force]
```

**Options:**
- `--season` - Import specific season only
- `--force` - Overwrite existing data

**Data Sources:**
- Football-Data.co.uk CSV files
- Historical match results
- Team performance data

**Imports:**
- Match results and scores
- Team standings by matchday
- Historical team data
- Season metadata

### `import-fpl-data.js`
**Priority: HIGH**

Import Fantasy Premier League player data for current season.

**Usage:**
```bash
node scripts/data/import-fpl-data.js [--season=current]
```

**Data Imported:**
- Current player statistics
- Team assignments
- Player positions and metadata
- Performance metrics

**Update Frequency:** Weekly during season

### `import-historical-scorers.js`
**Priority: MEDIUM** (Requires squad data first)

Import goal scorer data and match events.

**Usage:**
```bash
node scripts/data/import-historical-scorers.js [--season=YYYY/YY]
```

**Prerequisites:**
- Squad data must be imported first
- Match data must exist
- Player records must be available

**Data Sources:**
- API-Football match events
- OpenFootball goal data
- BBC Sport archives

**Imports:**
- Goals by player and match
- Assist tracking
- Goal timing and type
- Match events (cards, substitutions)

### `import-player-data.js`
**Priority: MEDIUM**

Import comprehensive player biographical and career data.

**Usage:**
```bash
node scripts/data/import-player-data.js [--source=fpl|api-football]
```

**Data Imported:**
- Date of birth and nationality
- Position and playing style
- Career statistics
- Transfer history

### `import-top-scorers.js`
**Priority: LOW**

Import top scorer data by season for verification and stats.

**Usage:**
```bash
node scripts/data/import-top-scorers.js --season=YYYY/YY
```

**Purpose:**
- Data verification
- Statistical analysis
- Historical comparisons

## 🔧 Utility Scripts

### `check-available-seasons.js`
Check data availability across different sources.

**Usage:**
```bash
node scripts/data/check-available-seasons.js
```

**Reports:**
- Available seasons per data source
- Data completeness scores
- Missing data identification

### `debug-csv-import.js`
Debug CSV import issues and data formatting problems.

**Usage:**
```bash
node scripts/data/debug-csv-import.js --file=path/to/file.csv
```

**Features:**
- CSV validation
- Data type checking
- Column mapping verification
- Error reporting

### `manual-season-import.js`
Manual import utility for specific seasons or data corrections.

**Usage:**
```bash
node scripts/data/manual-season-import.js --season=YYYY/YY --source=csv
```

**Use Cases:**
- Import single season
- Data corrections
- Testing import logic
- Recovery from failures

### `refresh-current-season.js`
Update current season data with latest results.

**Usage:**
```bash
node scripts/data/refresh-current-season.js
```

**Scheduling:**
```bash
# Add to crontab for daily updates
0 6 * * * cd /path/to/premstats && node scripts/data/refresh-current-season.js
```

## 📊 Data Sources & APIs

### Football-Data.co.uk
- **Type**: CSV files
- **Coverage**: Historical data 1993-2025
- **Quality**: High reliability
- **Format**: Standardized CSV columns
- **Usage**: Primary source for historical matches

### Fantasy Premier League API
- **Type**: REST API
- **Coverage**: Current season + players
- **Quality**: Official data, very reliable
- **Rate Limits**: Moderate usage
- **Usage**: Current player data and statistics

### OpenFootball Project
- **Type**: JSON/YAML files
- **Coverage**: Comprehensive historical data
- **Quality**: Community-maintained, good quality
- **Format**: Structured JSON
- **Usage**: Squad data and additional statistics

### API-Football
- **Type**: REST API
- **Coverage**: Comprehensive match events
- **Quality**: High detail, commercial grade
- **Rate Limits**: Subscription-based
- **Usage**: Detailed match events and player stats

## 🔍 Data Quality & Validation

### Name Normalization
Critical for linking data across sources:
```javascript
// Example: Different name formats
"Mohamed Salah" (FPL) → "M. Salah" (CSV) → "Salah" (API)
```

**Normalization Strategy:**
- Remove diacritics and special characters
- Handle common abbreviations
- Fuzzy matching for similar names
- Manual mapping for edge cases

### Data Validation Checks
- Player-team consistency across seasons
- Date range validation
- Score and statistic reasonableness
- Duplicate detection and removal

### Error Handling
- Graceful degradation on API failures
- Retry logic with exponential backoff
- Data rollback on critical errors
- Comprehensive error logging

## 🚨 Common Issues & Solutions

### Player Name Mismatches
**Problem:** Same player with different names across sources
**Solution:** Use name normalization and manual mapping tables

### Transfer Window Complexity
**Problem:** Players changing teams mid-season
**Solution:** Track team affiliations by date ranges

### Data Source Unavailability
**Problem:** External APIs or files become unavailable
**Solution:** Implement fallback sources and caching

### Import Performance
**Problem:** Large dataset imports taking too long
**Solution:** Batch processing and progress tracking

## 📋 Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgres://premstats:premstats@localhost:5432/premstats

# API Keys (if using premium sources)
API_FOOTBALL_KEY=your_api_key_here
RAPID_API_KEY=your_rapid_api_key

# Data Sources
FPL_API_URL=https://fantasy.premierleague.com/api
FOOTBALL_DATA_CSV_BASE=https://www.football-data.co.uk/mmz4281

# Import Settings
BATCH_SIZE=100
MAX_RETRIES=3
IMPORT_TIMEOUT=300000
```

### Configuration Files
- `package.json` - Script dependencies and settings
- `.env` - Environment-specific variables
- `config/data-sources.json` - Data source configurations

## 📈 Monitoring & Logging

### Import Progress Tracking
- Progress bars for long-running imports
- Statistics on records processed
- Success/failure ratios
- Performance metrics

### Log Outputs
```bash
# Monitor import progress
tail -f logs/data-import/squad-import.log

# Check for errors
grep "ERROR" logs/data-import/*.log

# View import statistics
grep "STATS" logs/data-import/*.log
```

## 🔗 Related Documentation

- [Database Schema](../../docs/DATABASE_SCHEMA.md)
- [Data Quality Guidelines](../../docs/data-quality.md)
- [API Documentation](../../docs/API.md)
- [Maintenance Scripts](../maintenance/README.md)