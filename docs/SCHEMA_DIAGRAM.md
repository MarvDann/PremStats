# PremStats Database Schema Visual Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           PREMSTATS DATABASE SCHEMA                                    │
│                          PostgreSQL 16 - 12,786 Matches                               │
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
│ current_team_id │───┼───│ is_own_goal     │  │ │  │ won             │  │  │
│ created_at      │   │   │ is_penalty      │  │ │  │ drawn           │  │  │
│ updated_at      │   │   │ created_at      │  │ │  │ lost            │  │  │
└─────────────────┘   │   └─────────────────┘  │ │  │ goals_for       │  │  │
         │            │            │           │ │  │ goals_against   │  │  │
         │            │            │           │ │  │ goal_difference │  │  │
         └────────────┘            │           │ │  │ points          │  │  │
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
│  PLAYER_STATS   │       │  TEAM_SEASONS   │       │ MATCH_EVENTS    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ player_id (FK)  │──┐    │ team_id (FK)    │───────│ match_id (FK)   │────┐
│ season_id (FK)  │──┼─┐  │ season_id (FK)  │───┐   │ event_type      │    │
│ team_id (FK)    │──┼─┼─┐│ division        │   │   │ minute          │    │
│ appearances     │  │ │ ││ final_position  │   │   │ player_id (FK)  │──┐ │
│ goals           │  │ │ ││ promoted        │   │   │ team_id (FK)    │──┼─┼─┐
│ assists         │  │ │ ││ relegated       │   │   │ detail          │  │ │ │
│ yellow_cards    │  │ │ ││ created_at      │   │   │ created_at      │  │ │ │
│ red_cards       │  │ │ │└─────────────────┘   │   └─────────────────┘  │ │ │
│ created_at      │  │ │ │          │           │            │          │ │ │
│ updated_at      │  │ │ │          │           │            │          │ │ │
└─────────────────┘  │ │ │          │           │            │          │ │ │
         │           │ │ │          │           │            │          │ │ │
         │           │ │ └──────────┼───────────┘            │          │ │ │
         │           │ │            │                        │          │ │ │
         │           │ └────────────┼────────────────────────┼──────────┘ │ │
         │           │              │                        │            │ │
         └───────────┘              │                        │            │ │
                                    │                        │            │ │
                                    │                        └────────────┼─┘
                                    │                                     │
                                    └─────────────────────────────────────┘

┌─────────────────┐
│    INDEXES      │
├─────────────────┤
│ idx_matches_date│
│ idx_matches_    │
│ season          │
│ idx_goals_match │
│ idx_goals_player│
│ idx_match_      │
│ events_match    │
│ idx_match_      │
│ events_player   │
│ idx_match_      │
│ events_type     │
│ idx_standings_  │
│ season          │
│ idx_player_     │
│ stats_season    │
└─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  RELATIONSHIPS                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ • SEASONS (1) ──→ (∞) MATCHES       • TEAMS (1) ──→ (∞) MATCHES (home/away)           │
│ • SEASONS (1) ──→ (∞) STANDINGS     • TEAMS (1) ──→ (∞) STANDINGS                     │
│ • SEASONS (1) ──→ (∞) PLAYER_STATS  • TEAMS (1) ──→ (∞) PLAYER_STATS                  │
│ • SEASONS (1) ──→ (∞) TEAM_SEASONS  • TEAMS (1) ──→ (∞) TEAM_SEASONS                  │
│ • MATCHES (1) ──→ (∞) GOALS         • TEAMS (1) ──→ (∞) GOALS                         │
│ • MATCHES (1) ──→ (∞) MATCH_EVENTS  • TEAMS (1) ──→ (∞) MATCH_EVENTS                  │
│ • PLAYERS (1) ──→ (∞) GOALS         • PLAYERS (1) ──→ (∞) PLAYER_STATS                │
│ • PLAYERS (1) ──→ (∞) MATCH_EVENTS  • TEAMS (1) ──→ (∞) PLAYERS (current_team)         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATA SUMMARY                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ 🏆 Seasons: 33 with data (1992/93 - 2024/25)    📊 Matches: 12,786 historical        │
│ ⚽ Teams: 51 including historical clubs           🎯 Goals: Ready for import            │
│ 👥 Players: 944 with current team tracking       📈 Stats: Live calculation via API    │
│ 🏟️  Stadiums: Tracked in teams table            🔄 Updates: Manual refresh system     │
│ 🎪 Events: Schema ready for match events         ✅ Quality: 100% data integrity       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

## Table Relationships Detail

### Core Data Flow
```
SEASONS ──┬─→ MATCHES ──┬─→ GOALS
          ├─→ STANDINGS │─→ MATCH_EVENTS
          ├─→ PLAYER_STATS  
          └─→ TEAM_SEASONS

TEAMS ────┬─→ MATCHES (home/away)
          ├─→ GOALS
          ├─→ MATCH_EVENTS
          ├─→ STANDINGS
          ├─→ PLAYER_STATS
          ├─→ TEAM_SEASONS
          └─→ PLAYERS (current_team)

PLAYERS ──┬─→ GOALS
          ├─→ PLAYER_STATS
          └─→ MATCH_EVENTS
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
| `teams` | 51 | ✅ Complete | All historical PL teams |
| `matches` | 12,786 | ✅ Complete | 33 seasons of data (1992/93-2024/25) |
| `players` | 944 | ✅ Complete | Players with current team tracking |
| `goals` | 0 | 🔄 Pending | Ready for goal scorer import |
| `match_events` | 0 | 🔄 Pending | Schema ready for match events |
| `standings` | 0 | 🔄 Live Calc | Generated via API from matches |
| `player_stats` | 0 | 🔄 Pending | Awaiting player data import |
| `team_seasons` | 0 | 🔄 Pending | Can be derived from matches |

This schema provides a robust foundation for comprehensive Premier League analysis while maintaining flexibility for future enhancements.