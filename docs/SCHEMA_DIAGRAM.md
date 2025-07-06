# PremStats Database Schema Visual Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           PREMSTATS DATABASE SCHEMA                                    │
│                          PostgreSQL 16 - 11,944 Matches                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     SEASONS     │       │      TEAMS      │       │     MATCHES     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │   ┌───│ id (PK)         │   ┌───│ id (PK)         │
│ name (UK)       │   │   │ name (UK)       │   │   │ season_id (FK)  │──┐
│ start_date      │   │   │ short_name      │   │   │ home_team_id    │──┼──┐
│ end_date        │   │   │ stadium         │   │   │ away_team_id    │──┼──┤
│ year            │   │   │ founded         │   │   │ match_date      │  │  │
│ team_count      │   │   │ external_id     │   │   │ home_score      │  │  │
│ created_at      │   │   │ crest_url       │   │   │ away_score      │  │  │
└─────────────────┘   │   │ created_at      │   │   │ half_time_home  │  │  │
         │            │   │ updated_at      │   │   │ half_time_away  │  │  │
         │            │   └─────────────────┘   │   │ status          │  │  │
         │            │            │            │   │ matchday        │  │  │
         └────────────┼────────────┼────────────┘   │ referee         │  │  │
                      │            │                │ attendance      │  │  │
                      │            │                │ external_id     │  │  │
                      │            │                │ created_at      │  │  │
                      │            │                │ updated_at      │  │  │
                      │            │                └─────────────────┘  │  │
                      │            │                         │           │  │
                      │            └─────────────────────────┼───────────┘  │
                      │                                      │              │
                      └──────────────────────────────────────┼──────────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     PLAYERS     │       │      GOALS      │       │   STANDINGS     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │   ┌───│ id (PK)         │       │ id (PK)         │
│ name            │   │   │ match_id (FK)   │───────│ season_id (FK)  │──┐
│ date_of_birth   │   │   │ player_id (FK)  │──┐    │ team_id (FK)    │──┼──┐
│ nationality     │   │   │ team_id (FK)    │──┼─┐  │ position        │  │  │
│ position        │   │   │ minute          │  │ │  │ played          │  │  │
│ created_at      │   │   │ is_own_goal     │  │ │  │ won             │  │  │
│ updated_at      │   │   │ is_penalty      │  │ │  │ drawn           │  │  │
└─────────────────┘   │   │ created_at      │  │ │  │ lost            │  │  │
         │            │   └─────────────────┘  │ │  │ goals_for       │  │  │
         │            │            │           │ │  │ goals_against   │  │  │
         └────────────┘            │           │ │  │ goal_difference │  │  │
                                   │           │ │  │ points          │  │  │
                                   │           │ │  │ form            │  │  │
                                   │           │ │  │ date            │  │  │
                                   │           │ │  │ updated_at      │  │  │
                                   │           │ │  └─────────────────┘  │  │
                                   │           │ │           │          │  │
                                   │           │ └───────────┼──────────┘  │
                                   │           │             │             │
                                   │           └─────────────┼─────────────┘
                                   │                         │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  PLAYER_STATS   │       │  TEAM_SEASONS   │       │    INDEXES      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ idx_matches_date│
│ player_id (FK)  │──┐    │ team_id (FK)    │───────│ idx_matches_    │
│ season_id (FK)  │──┼─┐  │ season_id (FK)  │───┐   │ season          │
│ team_id (FK)    │──┼─┼─┐│ division        │   │   │ idx_goals_match │
│ appearances     │  │ │ ││ final_position  │   │   │ idx_goals_player│
│ goals           │  │ │ ││ promoted        │   │   │ idx_standings_  │
│ assists         │  │ │ ││ relegated       │   │   │ season          │
│ yellow_cards    │  │ │ ││ created_at      │   │   │ idx_player_     │
│ red_cards       │  │ │ │└─────────────────┘   │   │ stats_season    │
│ created_at      │  │ │ │          │           │   └─────────────────┘
│ updated_at      │  │ │ │          │           │
└─────────────────┘  │ │ │          │           │
         │           │ │ │          │           │
         │           │ │ └──────────┼───────────┘
         │           │ │            │
         │           │ └────────────┼─────────────────────────────────┐
         │           │              │                                 │
         └───────────┘              │                                 │
                                    │                                 │
                                    │                                 │
                                    └─────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  RELATIONSHIPS                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ • SEASONS (1) ──→ (∞) MATCHES       • TEAMS (1) ──→ (∞) MATCHES (home/away)           │
│ • SEASONS (1) ──→ (∞) STANDINGS     • TEAMS (1) ──→ (∞) STANDINGS                     │
│ • SEASONS (1) ──→ (∞) PLAYER_STATS  • TEAMS (1) ──→ (∞) PLAYER_STATS                  │
│ • SEASONS (1) ──→ (∞) TEAM_SEASONS  • TEAMS (1) ──→ (∞) TEAM_SEASONS                  │
│ • MATCHES (1) ──→ (∞) GOALS         • TEAMS (1) ──→ (∞) GOALS                         │
│ • PLAYERS (1) ──→ (∞) GOALS         • PLAYERS (1) ──→ (∞) PLAYER_STATS                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATA SUMMARY                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 🏆 Seasons: 32 with data (1993/94 - 2024/25)    📊 Matches: 11,944 historical        │
│ ⚽ Teams: 50+ including historical clubs          🎯 Goals: Ready for import            │
│ 👥 Players: Schema ready for future data         📈 Stats: Live calculation via API    │
│ 🏟️  Stadiums: Tracked in teams table            🔄 Updates: Manual refresh system     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Table Relationships Detail

### Core Data Flow
```
SEASONS ──┬─→ MATCHES ──→ GOALS
          ├─→ STANDINGS
          ├─→ PLAYER_STATS  
          └─→ TEAM_SEASONS

TEAMS ────┬─→ MATCHES (home/away)
          ├─→ GOALS
          ├─→ STANDINGS
          ├─→ PLAYER_STATS
          └─→ TEAM_SEASONS

PLAYERS ──┬─→ GOALS
          └─→ PLAYER_STATS
```

### Key Constraints
```
🔑 Primary Keys: All tables have auto-increment integer PKs
🔗 Foreign Keys: All relationships enforced with FK constraints  
🏷️  Unique Keys: team names, season names, external IDs
📝 Defaults: Statistical fields default to 0, booleans to false
⏰ Timestamps: Automatic creation/update tracking
```

### Performance Features
```
📊 Indexes:
   • matches(match_date, season_id) - Fast date/season queries
   • goals(match_id, player_id) - Quick goal lookups  
   • standings(season_id) - League table generation
   • player_stats(season_id) - Season statistics

🔄 Triggers:
   • Auto-update timestamps on row modifications
   • Maintains data consistency across updates
```

## Data Population Status

| Table | Records | Status | Notes |
|-------|---------|--------|-------|
| `seasons` | 34 | ✅ Complete | All PL seasons 1992/93-2025/26 |
| `teams` | 50+ | ✅ Complete | All historical PL teams |
| `matches` | 11,944 | ✅ Complete | 32 seasons of data |
| `goals` | 0 | 🔄 Pending | Ready for goal scorer import |
| `players` | 0 | 🔄 Pending | Schema ready for player data |
| `standings` | 0 | 🔄 Live Calc | Generated via API from matches |
| `player_stats` | 0 | 🔄 Pending | Awaiting player data import |
| `team_seasons` | 0 | 🔄 Pending | Can be derived from matches |

This schema provides a robust foundation for comprehensive Premier League analysis while maintaining flexibility for future enhancements.