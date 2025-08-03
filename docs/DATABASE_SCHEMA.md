# PremStats Database Schema Documentation

## Overview

The PremStats database is designed to store comprehensive Premier League historical data from 1993/94 to present. The schema supports match results, team information, player statistics, and historical tracking across seasons.

## Database Statistics

- **Total Matches**: 12,786+ (33 complete seasons)
- **Teams**: 51+ (all teams that have played in Premier League)
- **Players**: 944+ (with current team tracking)
- **Seasons**: 1992/93 to 2024/25 (33+ seasons with data)
- **Database Engine**: PostgreSQL 16
- **Last Updated**: 2025-08-03

## Schema Diagram

```mermaid
erDiagram
    SEASONS {
        int id PK
        varchar name UK "e.g., '2023/24'"
        date start_date
        date end_date
        int year
        int team_count "default 20"
        timestamp created_at
    }
    
    TEAMS {
        int id PK
        varchar name UK "e.g., 'Arsenal FC'"
        varchar short_name "e.g., 'ARS'"
        varchar stadium "nullable"
        int founded "nullable"
        int external_id UK "nullable"
        varchar crest_url "nullable"
        timestamp created_at
        timestamp updated_at
    }
    
    MATCHES {
        int id PK
        int season_id FK
        int home_team_id FK
        int away_team_id FK
        timestamp match_date
        int home_score "nullable"
        int away_score "nullable"
        int half_time_home "nullable"
        int half_time_away "nullable"
        varchar status "default 'scheduled'"
        int matchday "nullable"
        varchar referee "nullable"
        int attendance "nullable"
        int external_id UK "nullable"
        int home_shots "nullable"
        int away_shots "nullable"
        int home_shots_on_target "nullable"
        int away_shots_on_target "nullable"
        int home_corners "nullable"
        int away_corners "nullable"
        int home_fouls "nullable"
        int away_fouls "nullable"
        int home_yellow_cards "nullable"
        int away_yellow_cards "nullable"
        int home_red_cards "nullable"
        int away_red_cards "nullable"
        decimal home_possession "nullable"
        decimal away_possession "nullable"
        timestamp created_at
        timestamp updated_at
    }
    
    PLAYERS {
        int id PK
        varchar name
        date date_of_birth "nullable"
        varchar nationality "nullable"
        varchar position "nullable"
        int current_team_id FK "nullable"
        timestamp created_at
        timestamp updated_at
    }
    
    GOALS {
        int id PK
        int match_id FK
        int player_id FK
        int team_id FK
        int minute
        boolean is_own_goal "default false"
        boolean is_penalty "default false"
        timestamp created_at
    }
    
    STANDINGS {
        int id PK
        int season_id FK
        int team_id FK
        int position
        int played "default 0"
        int won "default 0"
        int drawn "default 0"
        int lost "default 0"
        int goals_for "default 0"
        int goals_against "default 0"
        int goal_difference "default 0"
        int points "default 0"
        varchar form "nullable"
        date date "nullable"
        timestamp updated_at
    }
    
    PLAYER_STATS {
        int id PK
        int player_id FK
        int season_id FK
        int team_id FK
        int appearances "default 0"
        int goals "default 0"
        int assists "default 0"
        int yellow_cards "default 0"
        int red_cards "default 0"
        timestamp created_at
        timestamp updated_at
    }
    
    TEAM_SEASONS {
        int id PK
        int team_id FK
        int season_id FK
        varchar division "default 'Premier League'"
        int final_position "nullable"
        boolean promoted "default false"
        boolean relegated "default false"
        timestamp created_at
    }
    
    MATCH_EVENTS {
        int id PK
        int match_id FK
        varchar event_type
        int minute
        int player_id FK "nullable"
        int team_id FK "nullable"
        varchar detail "nullable"
        timestamp created_at
    }
    
    DATA_INTEGRITY_CHECKS {
        int id PK
        varchar check_type
        int season_id FK "nullable"
        timestamp check_date "default now()"
        varchar status
        jsonb details "nullable"
        int issues_found "default 0"
        int issues_resolved "default 0"
    }
    
    PROCESSING_LOCKS {
        int id PK
        int season_id FK "nullable"
        varchar process_name
        varchar locked_by
        timestamp locked_at "default now()"
        varchar status "default 'active'"
        text notes "nullable"
    }
    
    TEAM_NAMES_LOOKUP {
        int id PK
        int team_id FK
        varchar canonical_name
        varchar alternative_name
        varchar name_type
        varchar source "nullable"
        int confidence_score "default 100"
        timestamp created_at "default now()"
    }

    %% Relationships
    SEASONS ||--o{ MATCHES : "has"
    SEASONS ||--o{ STANDINGS : "has"
    SEASONS ||--o{ PLAYER_STATS : "has"
    SEASONS ||--o{ TEAM_SEASONS : "has"
    SEASONS ||--o{ DATA_INTEGRITY_CHECKS : "monitored_by"
    SEASONS ||--o{ PROCESSING_LOCKS : "locked_for"
    
    TEAMS ||--o{ MATCHES : "home_team"
    TEAMS ||--o{ MATCHES : "away_team"
    TEAMS ||--o{ GOALS : "scores"
    TEAMS ||--o{ STANDINGS : "appears_in"
    TEAMS ||--o{ PLAYER_STATS : "employs"
    TEAMS ||--o{ TEAM_SEASONS : "participates"
    TEAMS ||--o{ TEAM_NAMES_LOOKUP : "has_aliases"
    
    MATCHES ||--o{ GOALS : "contains"
    MATCHES ||--o{ MATCH_EVENTS : "contains"
    
    PLAYERS ||--o{ GOALS : "scores"
    PLAYERS ||--o{ PLAYER_STATS : "has"
    PLAYERS ||--o{ MATCH_EVENTS : "participates"
```

## Table Details

### Core Tables

#### `seasons`
Primary table for Premier League seasons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment season ID |
| `name` | `varchar(50)` | UNIQUE, NOT NULL | Season name (e.g., "2023/24") |
| `start_date` | `date` | NOT NULL | Season start date |
| `end_date` | `date` | NOT NULL | Season end date |
| `year` | `integer` | | Starting year of season |
| `team_count` | `integer` | DEFAULT 20 | Number of teams in season |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |

**Data Coverage**: 34 seasons (1992/93 to 2025/26), 33 with match data

#### `teams`
Information about all Premier League teams (past and present).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment team ID |
| `name` | `varchar(100)` | UNIQUE, NOT NULL | Full team name |
| `short_name` | `varchar(50)` | | Abbreviated name (e.g., "ARS") |
| `stadium` | `varchar(100)` | NULLABLE | Home stadium name |
| `founded` | `integer` | NULLABLE | Year founded |
| `external_id` | `integer` | UNIQUE, NULLABLE | External API reference |
| `crest_url` | `varchar(255)` | NULLABLE | Team badge/logo URL |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |
| `updated_at` | `timestamp` | DEFAULT NOW() | Last update time |

**Data Coverage**: 51 teams including historical clubs (Wimbledon FC, Swindon Town FC, etc.)

#### `matches`
Historical match results and fixture data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment match ID |
| `season_id` | `integer` | FOREIGN KEY | Reference to seasons table |
| `home_team_id` | `integer` | FOREIGN KEY | Home team reference |
| `away_team_id` | `integer` | FOREIGN KEY | Away team reference |
| `match_date` | `timestamp` | NOT NULL | Match date and time |
| `home_score` | `integer` | NULLABLE | Home team final score |
| `away_score` | `integer` | NULLABLE | Away team final score |
| `half_time_home` | `integer` | NULLABLE | Home team halftime score |
| `half_time_away` | `integer` | NULLABLE | Away team halftime score |
| `status` | `varchar(50)` | DEFAULT 'scheduled' | Match status |
| `matchday` | `integer` | NULLABLE | Gameweek number |
| `referee` | `varchar(100)` | NULLABLE | Match referee |
| `attendance` | `integer` | NULLABLE | Stadium attendance |
| `external_id` | `integer` | UNIQUE, NULLABLE | External API reference |
| `home_shots` | `integer` | NULLABLE | Home team total shots |
| `away_shots` | `integer` | NULLABLE | Away team total shots |
| `home_shots_on_target` | `integer` | NULLABLE | Home team shots on target |
| `away_shots_on_target` | `integer` | NULLABLE | Away team shots on target |
| `home_corners` | `integer` | NULLABLE | Home team corner kicks |
| `away_corners` | `integer` | NULLABLE | Away team corner kicks |
| `home_fouls` | `integer` | NULLABLE | Home team fouls committed |
| `away_fouls` | `integer` | NULLABLE | Away team fouls committed |
| `home_yellow_cards` | `integer` | NULLABLE | Home team yellow cards |
| `away_yellow_cards` | `integer` | NULLABLE | Away team yellow cards |
| `home_red_cards` | `integer` | NULLABLE | Home team red cards |
| `away_red_cards` | `integer` | NULLABLE | Away team red cards |
| `home_possession` | `decimal(4,1)` | NULLABLE | Home team possession percentage |
| `away_possession` | `decimal(4,1)` | NULLABLE | Away team possession percentage |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |
| `updated_at` | `timestamp` | DEFAULT NOW() | Last update time |

**Indexes**: 
- `idx_matches_date` on `match_date`
- `idx_matches_season` on `season_id`

**Data Coverage**: 12,786 matches across 33 seasons (1992/93 to 2024/25)

### Statistics & Analysis Tables

#### `standings`
League table positions and statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment ID |
| `season_id` | `integer` | FOREIGN KEY | Season reference |
| `team_id` | `integer` | FOREIGN KEY | Team reference |
| `position` | `integer` | NOT NULL | League position |
| `played` | `integer` | DEFAULT 0 | Matches played |
| `won` | `integer` | DEFAULT 0 | Matches won |
| `drawn` | `integer` | DEFAULT 0 | Matches drawn |
| `lost` | `integer` | DEFAULT 0 | Matches lost |
| `goals_for` | `integer` | DEFAULT 0 | Goals scored |
| `goals_against` | `integer` | DEFAULT 0 | Goals conceded |
| `goal_difference` | `integer` | DEFAULT 0 | Goal difference |
| `points` | `integer` | DEFAULT 0 | League points |
| `form` | `varchar(10)` | NULLABLE | Recent form (e.g., "WWDLL") |
| `date` | `date` | NULLABLE | Table date (for historical snapshots) |

**Unique Constraint**: `(season_id, team_id, date)`

#### `goals`
Individual goal events within matches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment goal ID |
| `match_id` | `integer` | FOREIGN KEY | Match reference |
| `player_id` | `integer` | FOREIGN KEY | Player who scored |
| `team_id` | `integer` | FOREIGN KEY | Scoring team |
| `minute` | `integer` | NOT NULL | Minute goal was scored |
| `is_own_goal` | `boolean` | DEFAULT false | Own goal flag |
| `is_penalty` | `boolean` | DEFAULT false | Penalty goal flag |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |

**Indexes**:
- `idx_goals_match` on `match_id`
- `idx_goals_player` on `player_id`

**Unique Constraint**: `(match_id, player_id, minute, team_id, is_own_goal)` - Prevents duplicate goal records

### Player & Team Management

#### `players`
Player biographical information and current team tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment player ID |
| `name` | `varchar(100)` | NOT NULL | Player full name |
| `date_of_birth` | `date` | NULLABLE | Birth date |
| `nationality` | `varchar(100)` | NULLABLE | Player nationality |
| `position` | `varchar(50)` | NULLABLE | Playing position |
| `current_team_id` | `integer` | FOREIGN KEY, NULLABLE | Current team reference |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |
| `updated_at` | `timestamp` | DEFAULT NOW() | Last update time |

**Data Coverage**: 944 players with biographical data and current team tracking

#### `player_stats`
Season-by-season player statistics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment ID |
| `player_id` | `integer` | FOREIGN KEY | Player reference |
| `season_id` | `integer` | FOREIGN KEY | Season reference |
| `team_id` | `integer` | FOREIGN KEY | Team player represented |
| `appearances` | `integer` | DEFAULT 0 | Match appearances |
| `goals` | `integer` | DEFAULT 0 | Goals scored |
| `assists` | `integer` | DEFAULT 0 | Assists made |
| `yellow_cards` | `integer` | DEFAULT 0 | Yellow cards received |
| `red_cards` | `integer` | DEFAULT 0 | Red cards received |

**Unique Constraint**: `(player_id, season_id, team_id)`

#### `team_seasons`
Team participation and outcomes by season.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment ID |
| `team_id` | `integer` | FOREIGN KEY | Team reference |
| `season_id` | `integer` | FOREIGN KEY | Season reference |
| `division` | `varchar(50)` | DEFAULT 'Premier League' | Division played in |
| `final_position` | `integer` | NULLABLE | Final league position |
| `promoted` | `boolean` | DEFAULT false | Promotion flag |
| `relegated` | `boolean` | DEFAULT false | Relegation flag |

**Unique Constraint**: `(team_id, season_id)`

#### `match_events`
Detailed in-match events and occurrences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment event ID |
| `match_id` | `integer` | FOREIGN KEY | Match reference |
| `event_type` | `varchar(50)` | NOT NULL | Type of event (goal, card, substitution, etc.) |
| `minute` | `integer` | NOT NULL | Minute when event occurred |
| `player_id` | `integer` | FOREIGN KEY, NULLABLE | Player involved in event |
| `team_id` | `integer` | FOREIGN KEY, NULLABLE | Team reference for event |
| `detail` | `varchar(255)` | NULLABLE | Additional event details |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |

**Indexes**:
- `idx_match_events_match` on `match_id`
- `idx_match_events_player` on `player_id`
- `idx_match_events_type` on `event_type`

**Data Coverage**: Schema ready for comprehensive match event tracking

### Operational & Data Quality Tables

#### `data_integrity_checks`
System for tracking data quality checks and issues across seasons.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment check ID |
| `check_type` | `varchar(100)` | NOT NULL | Type of integrity check performed |
| `season_id` | `integer` | FOREIGN KEY, NULLABLE | Season being checked (null for global checks) |
| `check_date` | `timestamp` | DEFAULT NOW() | When check was performed |
| `status` | `varchar(50)` | NOT NULL | Check result status |
| `details` | `jsonb` | NULLABLE | Detailed results in JSON format |
| `issues_found` | `integer` | DEFAULT 0 | Number of issues detected |
| `issues_resolved` | `integer` | DEFAULT 0 | Number of issues fixed |

**Data Coverage**: Real-time data quality monitoring for all seasons

#### `processing_locks`
Prevents concurrent data processing operations and tracks system state.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment lock ID |
| `season_id` | `integer` | FOREIGN KEY, NULLABLE | Season being processed (null for global locks) |
| `process_name` | `varchar(255)` | NOT NULL | Name of the processing operation |
| `locked_by` | `varchar(255)` | NOT NULL | Identifier of the process/user |
| `locked_at` | `timestamp` | DEFAULT NOW() | When lock was acquired |
| `status` | `varchar(50)` | DEFAULT 'active' | Lock status |
| `notes` | `text` | NULLABLE | Additional processing notes |

**Unique Constraint**: `(season_id, process_name)`

#### `team_names_lookup`
Maps alternative team names to canonical team entries for data import.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY | Auto-increment lookup ID |
| `team_id` | `integer` | FOREIGN KEY | Reference to canonical team |
| `canonical_name` | `varchar(100)` | NOT NULL | Official team name |
| `alternative_name` | `varchar(100)` | NOT NULL | Alternative name or alias |
| `name_type` | `varchar(50)` | NOT NULL | Type of alternative name |
| `source` | `varchar(100)` | NULLABLE | Source where alternative name appears |
| `confidence_score` | `integer` | DEFAULT 100 | Confidence in name mapping (0-100) |
| `created_at` | `timestamp` | DEFAULT NOW() | Record creation time |

**Indexes**:
- `idx_team_names_lookup_alternative` on `lower(alternative_name)`
- `idx_team_names_lookup_team_id` on `team_id`

**Unique Constraint**: `(team_id, alternative_name)`

**Data Coverage**: Comprehensive name mapping for all data sources and historical team names

### Database Views

#### `match_goals`
Convenience view that combines goal events with match and player information.

**Columns**:
- `id` - Match event ID
- `match_id` - Match reference
- `minute` - Goal minute
- `scorer_name` - Player name who scored
- `team_name` - Scoring team name  
- `event_type` - Type of goal (goal, own_goal, penalty)
- `match_date` - When the match occurred
- `home_team` - Home team name
- `away_team` - Away team name
- `home_score` - Final home score
- `away_score` - Final away score

**Purpose**: Simplified querying of goal events with denormalized team and player names

### Database Functions

#### `calculate_table_at_date(season_id, as_of_date)`
Calculates league table standings for any point in time within a season.

**Parameters**:
- `season_id_param` (integer) - Season to calculate table for
- `as_of_date` (date) - Calculate table as of this date

**Returns**: Table with columns: pos, team_id, team_name, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, form

**Purpose**: Historical league table analysis and generating tables at specific dates

#### `get_match_details(match_id)`
Retrieves comprehensive match information including goal events.

**Parameters**:
- `match_id_param` (integer) - Match to get details for

**Returns**: Table with match details including goals as JSON array

**Purpose**: Complete match analysis with embedded goal event data

#### Processing Lock Functions
- `acquire_season_lock(season_year, process_name, locked_by)` - Acquire processing lock
- `release_season_lock(season_year, process_name)` - Release processing lock  
- `is_season_processing_locked(season_year, process_name)` - Check lock status

**Purpose**: Prevent concurrent data processing operations on the same season

## Key Relationships

### Primary Relationships
- **Seasons → Matches**: One-to-many (each season has many matches)
- **Teams → Matches**: One-to-many (teams play multiple matches as home/away)
- **Matches → Goals**: One-to-many (matches contain multiple goals)
- **Matches → Match Events**: One-to-many (matches contain multiple events)
- **Players → Goals**: One-to-many (players score multiple goals)
- **Players → Match Events**: One-to-many (players participate in multiple events)

### Statistical Relationships
- **Seasons → Standings**: One-to-many (season has league table entries)
- **Teams → Standings**: One-to-many (team appears in multiple season tables)
- **Players → Player Stats**: One-to-many (player has stats for multiple seasons)

### Operational Relationships
- **Seasons → Data Integrity Checks**: One-to-many (seasons are monitored for data quality)
- **Seasons → Processing Locks**: One-to-many (seasons can be locked during processing)
- **Teams → Team Names Lookup**: One-to-many (teams have multiple name aliases)

## Database Triggers

### Automatic Timestamp Updates
The following tables have `updated_at` triggers:
- `teams`
- `matches` 
- `players`
- `player_stats`

**Trigger Function**: `update_updated_at_column()` - Updates `updated_at` to current timestamp on row modification.

## Data Integrity Features

### Foreign Key Constraints
All relationships are enforced with foreign key constraints to maintain referential integrity.

### Unique Constraints
- Season names must be unique
- Team names must be unique
- External IDs must be unique (where present)
- Player stats are unique per player/season/team combination

### Default Values
- Most statistical fields default to 0
- Timestamps default to current time
- Boolean flags default to false
- Match status defaults to 'scheduled'

## Performance Optimizations

### Indexes
- **Matches**: Indexed on `match_date` and `season_id` for fast date/season queries
- **Goals**: Indexed on `match_id` and `player_id` for quick goal lookups
- **Match Events**: Indexed on `match_id`, `player_id`, and `event_type` for event queries
- **Standings**: Indexed on `season_id` for league table queries
- **Player Stats**: Indexed on `season_id` for season statistics

### Query Patterns
The schema is optimized for common query patterns:
- Season-based match listings
- Team vs team historical records
- League table generation
- Player goal/assist statistics
- Historical team performance analysis

## Data Sources & Import Process

### Historical Data (1993/94 - 2023/24)
- **Source**: football-data.co.uk CSV files
- **Coverage**: Complete match results with scores, dates, referees
- **Team Mapping**: Automated mapping from CSV names to database team names

### Current Season (2024/25)
- **Source**: football-data.co.uk CSV files
- **Update Frequency**: Manual refresh via data agent system

### Missing Data
- **1992/93**: Not available from data source (first ever Premier League season)
- **Player-level data**: Goals, assists, cards (future enhancement)
- **Real-time data**: Live match updates (future enhancement)

## Future Enhancements

### Planned Features
1. **Goal Events**: Individual goal scorer data for each match
2. **Player Transfers**: Transfer history and valuations
3. **Stadium History**: Venue changes and capacity information
4. **Match Events**: Cards, substitutions, detailed match events
5. **API Integration**: Real-time data from Premier League API

### Schema Extensions
1. **Transfers Table**: Player movement between teams
2. **Stadiums Table**: Venue information and capacity changes
3. **Match Events Table**: Detailed in-match occurrences
4. **Injuries Table**: Player injury tracking
5. **Officials Table**: Referee and VAR official information

This schema provides a robust foundation for comprehensive Premier League statistical analysis while maintaining flexibility for future enhancements.