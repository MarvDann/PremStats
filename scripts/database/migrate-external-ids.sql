-- Add external_id columns to support football-data.org API integration

-- Add external_id to teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS external_id INTEGER UNIQUE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS crest_url VARCHAR(255);

-- Add external_id to matches
ALTER TABLE matches ADD COLUMN IF NOT EXISTS external_id INTEGER UNIQUE;
ALTER TABLE matches RENAME COLUMN match_date TO date;

-- Add external_id to players
ALTER TABLE players ADD COLUMN IF NOT EXISTS external_id INTEGER UNIQUE;
ALTER TABLE players ADD COLUMN IF NOT EXISTS shirt_number INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id);

-- Update standings to include date for historical tracking
ALTER TABLE standings ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE standings DROP CONSTRAINT IF EXISTS standings_season_id_team_id_key;
ALTER TABLE standings ADD CONSTRAINT standings_unique UNIQUE(season_id, team_id, date);

-- Add year column to seasons
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS year INTEGER;

-- Insert current season if not exists
INSERT INTO seasons (name, year, start_date, end_date) 
VALUES ('2024/25', 2024, '2024-08-16', '2025-05-25')
ON CONFLICT (name) DO NOTHING;