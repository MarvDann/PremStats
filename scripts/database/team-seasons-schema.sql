-- Create team_seasons table to track which teams are in which seasons
CREATE TABLE IF NOT EXISTS team_seasons (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  season_id INTEGER REFERENCES seasons(id),
  division VARCHAR(50) DEFAULT 'Premier League',
  final_position INTEGER,
  promoted BOOLEAN DEFAULT FALSE,
  relegated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, season_id)
);

-- Create index for performance
CREATE INDEX idx_team_seasons_season ON team_seasons(season_id);
CREATE INDEX idx_team_seasons_team ON team_seasons(team_id);

-- Update matches table to properly reference teams
ALTER TABLE matches ADD COLUMN IF NOT EXISTS home_team_external_id INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS away_team_external_id INTEGER;

-- Update standings to use external IDs temporarily
ALTER TABLE standings ADD COLUMN IF NOT EXISTS team_external_id INTEGER;

-- Add division history tracking
CREATE TABLE IF NOT EXISTS division_changes (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  season_id INTEGER REFERENCES seasons(id),
  change_type VARCHAR(20) CHECK (change_type IN ('promoted', 'relegated')),
  from_division VARCHAR(50),
  to_division VARCHAR(50),
  position INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical seasons data
INSERT INTO seasons (name, year, start_date, end_date) VALUES 
  ('2023/24', 2023, '2023-08-11', '2024-05-19'),
  ('2024/25', 2024, '2024-08-16', '2025-05-25')
ON CONFLICT (name) DO NOTHING;