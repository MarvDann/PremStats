# PremStats Data Organization

This directory contains all data files used by the PremStats application, organized by source and processing stage.

## Directory Structure

### 📁 `sources/`
Raw data files from external sources, organized by provider:

#### `sources/kaggle-premier-league/`
- **Source**: Kaggle Premier League Dataset
- **Content**: Historical player data by season (1992-2022)
- **Structure**: 
  - `DATA_CSV/Season_YYYY/` - Player CSV files by team and year
  - `DATA_JSON/` - JSON format data files
  - `clubs.csv` - Team information

#### `sources/football-data-co-uk/`
- **Source**: Football-Data.co.uk
- **Content**: Historical match results and statistics
- **Structure**: CSV files with match data, betting odds, and statistics

### 📁 `processed/`
Cleaned and transformed data ready for application use:

#### `processed/matches/`
- **matches.csv** - Main matches data file
- **matches-fixed.csv** - Corrected version with data fixes
- **matches-sample.csv** - Sample data for testing
- **matches-test.csv** - Test data files

#### `processed/events/`
- **events.csv** - Match events (goals, cards, substitutions)

#### `processed/tables/`
- **all_tables.csv** - League table data across seasons

#### `processed/players/`
- Player statistics and career data (to be populated)

#### `processed/teams/`
- Team information and historical data (to be populated)

#### `processed/scripts/`
- Data processing and import scripts
- **data/import-match-events-production.js** - Production event import script

### 📁 `aggregated/`
Pre-computed statistics and analysis results:

#### `aggregated/statistics/agg_stats/`
- **assist_leaders.csv** - Top assist providers by season
- **goal_leaders.csv** - Top goal scorers by season  
- **team_discipline.csv** - Team disciplinary records

#### `aggregated/reports/`
- Generated reports and analysis summaries (to be populated)

### 📁 `archives/`
Archive files and historical backups:
- **english-premier-league-game-events-and-results.zip** - Original data archive

## Data Flow

```
Raw Sources → Processing Scripts → Processed Data → Application Database
     ↓              ↓                    ↓                ↓
  sources/    →  scripts/data/    →  processed/    →  PostgreSQL
```

## File Naming Conventions

- **Timestamps**: Use ISO format `YYYY-MM-DD` or `YYYYMMDD`
- **Versions**: Append `-v1`, `-v2` for iterations
- **Status**: Use suffixes like `-raw`, `-cleaned`, `-final`
- **Samples**: Use `-sample` or `-test` for development data

## Data Quality Standards

- ✅ **UTF-8 Encoding**: All CSV files must use UTF-8
- ✅ **Header Rows**: First row contains column names
- ✅ **Null Values**: Use empty strings or explicit NULL markers
- ✅ **Date Format**: ISO 8601 format (YYYY-MM-DD)
- ✅ **Player Names**: Normalized for consistent matching

## Usage Notes

1. **Never modify files in `sources/`** - These are original data files
2. **Use `processed/` for application data** - These are cleaned and validated
3. **Update aggregated stats regularly** - Run aggregation scripts after data updates
4. **Archive old versions** - Move outdated files to `archives/`

## Related Documentation

- [Database Schema](../docs/DATABASE_SCHEMA.md)
- [Data Import Scripts](../scripts/data/README.md)
- [Development Workflow](../docs/development-workflow.md)