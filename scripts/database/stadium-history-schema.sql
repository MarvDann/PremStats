-- Schema for tracking stadium changes over time

-- Create stadium_history table
CREATE TABLE IF NOT EXISTS stadium_history (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id),
  stadium_name VARCHAR(100) NOT NULL,
  capacity INTEGER,
  address VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opened_date DATE,
  closed_date DATE,
  start_date DATE NOT NULL, -- When team started playing here
  end_date DATE, -- When team stopped playing here (NULL if current)
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT no_overlapping_stadiums EXCLUDE USING gist (
    team_id WITH =,
    daterange(start_date, COALESCE(end_date, '9999-12-31'::date)) WITH &&
  )
);

-- Create index for performance
CREATE INDEX idx_stadium_history_team ON stadium_history(team_id);
CREATE INDEX idx_stadium_history_dates ON stadium_history(start_date, end_date);

-- Add some known stadium changes
INSERT INTO stadium_history (team_id, stadium_name, capacity, start_date, end_date, notes) VALUES
-- Tottenham Hotspur
((SELECT id FROM teams WHERE name = 'Tottenham Hotspur FC'), 'White Hart Lane', 36284, '1899-09-04', '2017-05-14', 'Historic home for 118 years'),
((SELECT id FROM teams WHERE name = 'Tottenham Hotspur FC'), 'Wembley Stadium', 90000, '2017-08-01', '2019-03-31', 'Temporary home during stadium construction'),
((SELECT id FROM teams WHERE name = 'Tottenham Hotspur FC'), 'Tottenham Hotspur Stadium', 62850, '2019-04-03', NULL, 'New stadium built on site of White Hart Lane'),

-- Arsenal
((SELECT id FROM teams WHERE name = 'Arsenal FC'), 'Highbury', 38419, '1913-09-06', '2006-05-07', 'Historic home, now converted to apartments'),
((SELECT id FROM teams WHERE name = 'Arsenal FC'), 'Emirates Stadium', 60704, '2006-07-22', NULL, 'Current home'),

-- Manchester City
((SELECT id FROM teams WHERE name = 'Manchester City FC'), 'Maine Road', 35150, '1923-08-25', '2003-05-11', 'Historic home for 80 years'),
((SELECT id FROM teams WHERE name = 'Manchester City FC'), 'City of Manchester Stadium', 53400, '2003-08-10', NULL, 'Now known as Etihad Stadium'),

-- West Ham United
((SELECT id FROM teams WHERE name = 'West Ham United FC'), 'Boleyn Ground', 35016, '1904-09-01', '2016-05-10', 'Also known as Upton Park'),
((SELECT id FROM teams WHERE name = 'West Ham United FC'), 'London Stadium', 66000, '2016-08-04', NULL, 'Former Olympic Stadium'),

-- Leicester City
((SELECT id FROM teams WHERE name = 'Leicester City FC'), 'Filbert Street', 22000, '1891-10-01', '2002-05-11', 'Historic home for 111 years'),
((SELECT id FROM teams WHERE name = 'Leicester City FC'), 'King Power Stadium', 32262, '2002-07-23', NULL, 'Originally called Walkers Stadium'),

-- Southampton
((SELECT id FROM teams WHERE name = 'Southampton FC'), 'The Dell', 15200, '1898-09-03', '2001-05-19', 'Historic home for 103 years'),
((SELECT id FROM teams WHERE name = 'Southampton FC'), 'St Mary''s Stadium', 32384, '2001-08-01', NULL, 'Current home'),

-- Brighton & Hove Albion
((SELECT id FROM teams WHERE name = 'Brighton & Hove Albion FC'), 'Goldstone Ground', 36747, '1902-08-01', '1997-04-26', 'Lost to property developers'),
((SELECT id FROM teams WHERE name = 'Brighton & Hove Albion FC'), 'Priestfield Stadium', 11582, '1997-08-01', '1999-05-01', 'Groundshare with Gillingham'),
((SELECT id FROM teams WHERE name = 'Brighton & Hove Albion FC'), 'Withdean Stadium', 8850, '1999-08-01', '2011-05-07', 'Temporary athletics stadium'),
((SELECT id FROM teams WHERE name = 'Brighton & Hove Albion FC'), 'Falmer Stadium', 31800, '2011-07-16', NULL, 'Now known as Amex Stadium')
ON CONFLICT DO NOTHING;

-- Function to get team's stadium at a specific date
CREATE OR REPLACE FUNCTION get_team_stadium_at_date(team_id_param INTEGER, match_date DATE)
RETURNS TABLE (
  stadium_name VARCHAR(100),
  capacity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT sh.stadium_name, sh.capacity
  FROM stadium_history sh
  WHERE sh.team_id = team_id_param
  AND sh.start_date <= match_date
  AND (sh.end_date IS NULL OR sh.end_date >= match_date)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- View to show current stadiums
CREATE OR REPLACE VIEW current_stadiums AS
SELECT 
  t.name as team_name,
  sh.stadium_name,
  sh.capacity,
  sh.start_date as playing_since,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, sh.start_date)) as years_at_stadium
FROM teams t
JOIN stadium_history sh ON t.id = sh.team_id
WHERE sh.end_date IS NULL
ORDER BY t.name;

-- Update matches table to include stadium information
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium VARCHAR(100);
ALTER TABLE matches ADD COLUMN IF NOT EXISTS stadium_capacity INTEGER;