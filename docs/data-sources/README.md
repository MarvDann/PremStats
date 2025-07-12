# PremStats Data Sources

This directory contains documentation for all data sources used in PremStats, including setup instructions, data formats, and import procedures.

## 📊 Available Data Sources

### Historical Squad Data
- **[Kaggle Premier League Dataset](KAGGLE_SETUP.md)** - Complete squad data 1992-2024
- **[Fantasy Premier League API](FPL_API.md)** - Current season player statistics *(Coming Soon)*

### Match Data  
- **[Football-Data.co.uk](FOOTBALL_DATA_UK.md)** - Historical match results CSV *(Coming Soon)*
- **[API-Football](API_FOOTBALL.md)** - Match events and live data *(Coming Soon)*

### Player Statistics
- **[Historical Goal Scorers](GOAL_SCORERS.md)** - Match-level goal data sources *(Coming Soon)*
- **[Transfer Data](TRANSFERS.md)** - Player movement tracking *(Coming Soon)*

## 📁 Data Import Scripts

All data import scripts are located in `scripts/data/`:

- `import-kaggle-squads-production.js` - **PRODUCTION** Kaggle squad import
- `import-fpl-data.js` - Fantasy Premier League current season
- `clean-nationalities.js` - Nationality field cleanup utility

## 🎯 Import Status

| Data Source | Coverage | Status | Records | Last Updated |
|------------|----------|--------|---------|--------------|
| **Kaggle Squads** | 1992-2024 (33 seasons) | ✅ Complete | 6,052 players | 2025-01-12 |
| **FPL Current** | 2024/25 season | ✅ Complete | 804 players | 2025-01-12 |
| **Match Events** | TBD | 🔄 Planning | - | - |
| **Goal Scorers** | TBD | 🔄 Planning | - | - |

## 🔧 Data Quality Standards

### Player Data Requirements
- ✅ **Names**: Clean, no date artifacts (`"Aug 14"` etc.)
- ✅ **Nationalities**: No brackets/quotes (`England` not `['England']`)
- ✅ **Transfers**: Multiple team records per season supported
- ✅ **Validation**: Corrupted entries automatically skipped

### Import Best Practices
1. **Always use production import scripts** (include data cleaning)
2. **Run data validation** after imports
3. **Check for corruption patterns** before large imports
4. **Backup database** before major data changes

## 📈 Future Enhancements

### Planned Data Sources
1. **Historical Match Events** - Goal timing, cards, substitutions
2. **Transfer Windows** - Player movements with dates
3. **Stadium Data** - Venue capacity and changes
4. **Officials Data** - Referee assignments and statistics

### Data Quality Improvements
1. **Player Name Normalization** - Handle variations across sources
2. **Team Name Mapping** - Consistent team references
3. **Date Standardization** - Unified date formats
4. **Duplicate Detection** - Advanced player matching

## 🆘 Troubleshooting

### Common Import Issues
- **CSV Parsing Errors**: Use production scripts with fixed parsers
- **Nationality Formatting**: Production scripts auto-clean during import
- **Team Mapping**: Check team name variations in import scripts
- **Memory Issues**: Process large datasets in chunks

### Data Validation Queries
```sql
-- Check for corrupted player names
SELECT name FROM players WHERE name ~ '^[0-9]' OR length(name) < 2;

-- Verify nationality formatting  
SELECT DISTINCT nationality FROM players WHERE nationality LIKE '%[%' OR nationality LIKE '%]%';

-- Check squad completeness
SELECT s.name, COUNT(ps.*) as squad_size 
FROM seasons s 
LEFT JOIN player_stats ps ON s.id = ps.season_id 
GROUP BY s.name ORDER BY s.year;
```

## 📞 Support

For data source issues:
1. Check relevant setup documentation in this directory
2. Review import script logs in `scripts/logs/`
3. Run data validation queries above
4. Create GitHub issue with details if problems persist