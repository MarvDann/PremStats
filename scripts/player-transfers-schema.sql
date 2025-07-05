-- Schema for tracking player transfers and team affiliations over time

-- Create player_contracts table to track which team a player played for during specific periods
CREATE TABLE IF NOT EXISTS player_contracts (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  team_id INTEGER REFERENCES teams(id),
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if current contract
  contract_type VARCHAR(50) DEFAULT 'permanent', -- 'permanent', 'loan', 'free'
  transfer_fee NUMERIC(12,2), -- Transfer fee in millions
  shirt_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_overlapping_contracts EXCLUDE USING gist (
    player_id WITH =,
    daterange(start_date, COALESCE(end_date, '9999-12-31'::date)) WITH &&
  )
);

-- Create transfers table to record transfer events
CREATE TABLE IF NOT EXISTS transfers (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id),
  from_team_id INTEGER REFERENCES teams(id),
  to_team_id INTEGER REFERENCES teams(id),
  transfer_date DATE NOT NULL,
  transfer_window VARCHAR(20), -- 'summer', 'winter'
  transfer_type VARCHAR(50), -- 'transfer', 'loan', 'free', 'end_of_contract'
  fee NUMERIC(12,2),
  season_id INTEGER REFERENCES seasons(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_player_contracts_player ON player_contracts(player_id);
CREATE INDEX idx_player_contracts_team ON player_contracts(team_id);
CREATE INDEX idx_player_contracts_dates ON player_contracts(start_date, end_date);
CREATE INDEX idx_transfers_player ON transfers(player_id);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);

-- Function to get player's team at a specific date
CREATE OR REPLACE FUNCTION get_player_team_at_date(player_id_param INTEGER, match_date DATE)
RETURNS INTEGER AS $$
DECLARE
  team_id_result INTEGER;
BEGIN
  SELECT team_id INTO team_id_result
  FROM player_contracts
  WHERE player_id = player_id_param
  AND start_date <= match_date
  AND (end_date IS NULL OR end_date >= match_date)
  LIMIT 1;
  
  RETURN team_id_result;
END;
$$ LANGUAGE plpgsql;

-- Enhanced player_stats table to track stats per team per season
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS minutes_played INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS penalties_scored INTEGER DEFAULT 0;
ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS own_goals INTEGER DEFAULT 0;

-- Create career_stats view for all-time statistics
CREATE OR REPLACE VIEW player_career_stats AS
SELECT 
  p.id as player_id,
  p.name as player_name,
  p.nationality,
  COUNT(DISTINCT ps.season_id) as seasons_played,
  COUNT(DISTINCT ps.team_id) as clubs_played_for,
  SUM(ps.appearances) as total_appearances,
  SUM(ps.goals) as total_goals,
  SUM(ps.assists) as total_assists,
  SUM(ps.yellow_cards) as total_yellow_cards,
  SUM(ps.red_cards) as total_red_cards,
  SUM(ps.penalties_scored) as total_penalties,
  MIN(s.year) as first_season,
  MAX(s.year) as last_season,
  STRING_AGG(DISTINCT t.name, ', ' ORDER BY t.name) as clubs
FROM players p
LEFT JOIN player_stats ps ON p.id = ps.player_id
LEFT JOIN teams t ON ps.team_id = t.id
LEFT JOIN seasons s ON ps.season_id = s.id
GROUP BY p.id, p.name, p.nationality;

-- Create top scorers view
CREATE OR REPLACE VIEW all_time_top_scorers AS
SELECT 
  player_id,
  player_name,
  nationality,
  total_goals,
  total_appearances,
  CASE 
    WHEN total_appearances > 0 
    THEN ROUND(total_goals::NUMERIC / total_appearances::NUMERIC, 2)
    ELSE 0
  END as goals_per_game,
  clubs,
  first_season,
  last_season
FROM player_career_stats
WHERE total_goals > 0
ORDER BY total_goals DESC;

-- Function to track player movements
CREATE OR REPLACE FUNCTION record_transfer(
  p_player_id INTEGER,
  p_from_team_id INTEGER,
  p_to_team_id INTEGER,
  p_transfer_date DATE,
  p_fee NUMERIC DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  transfer_id INTEGER;
  transfer_season_id INTEGER;
  transfer_window VARCHAR(20);
BEGIN
  -- Determine transfer window
  IF EXTRACT(MONTH FROM p_transfer_date) IN (6, 7, 8, 9) THEN
    transfer_window := 'summer';
  ELSIF EXTRACT(MONTH FROM p_transfer_date) IN (1, 2) THEN
    transfer_window := 'winter';
  ELSE
    transfer_window := 'other';
  END IF;
  
  -- Find season
  SELECT id INTO transfer_season_id
  FROM seasons
  WHERE p_transfer_date BETWEEN start_date AND end_date
  LIMIT 1;
  
  -- End previous contract
  UPDATE player_contracts
  SET end_date = p_transfer_date - INTERVAL '1 day'
  WHERE player_id = p_player_id
  AND team_id = p_from_team_id
  AND end_date IS NULL;
  
  -- Create new contract
  INSERT INTO player_contracts (player_id, team_id, start_date, transfer_fee)
  VALUES (p_player_id, p_to_team_id, p_transfer_date, p_fee);
  
  -- Record transfer
  INSERT INTO transfers (
    player_id, from_team_id, to_team_id, transfer_date,
    transfer_window, fee, season_id
  ) VALUES (
    p_player_id, p_from_team_id, p_to_team_id, p_transfer_date,
    transfer_window, p_fee, transfer_season_id
  ) RETURNING id INTO transfer_id;
  
  RETURN transfer_id;
END;
$$ LANGUAGE plpgsql;

-- Update goals table to include the team player was playing for at the time
ALTER TABLE goals ADD COLUMN IF NOT EXISTS player_team_id INTEGER REFERENCES teams(id);

-- Create a more detailed match_events structure
ALTER TABLE match_events ADD COLUMN IF NOT EXISTS player_team_id INTEGER REFERENCES teams(id);
ALTER TABLE match_events ADD COLUMN IF NOT EXISTS assist_player_id INTEGER REFERENCES players(id);

-- Function to get player stats by club
CREATE OR REPLACE FUNCTION get_player_stats_by_club(player_id_param INTEGER)
RETURNS TABLE (
  team_name VARCHAR(100),
  seasons_played INTEGER,
  appearances INTEGER,
  goals INTEGER,
  assists INTEGER,
  first_season VARCHAR(10),
  last_season VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.name as team_name,
    COUNT(DISTINCT ps.season_id) as seasons_played,
    SUM(ps.appearances) as appearances,
    SUM(ps.goals) as goals,
    SUM(ps.assists) as assists,
    MIN(s.name) as first_season,
    MAX(s.name) as last_season
  FROM player_stats ps
  JOIN teams t ON ps.team_id = t.id
  JOIN seasons s ON ps.season_id = s.id
  WHERE ps.player_id = player_id_param
  GROUP BY t.id, t.name
  ORDER BY SUM(ps.appearances) DESC;
END;
$$ LANGUAGE plpgsql;