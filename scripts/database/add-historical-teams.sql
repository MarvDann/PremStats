-- Add teams that have played in the Premier League but aren't in current season
-- These are needed for historical data import

-- Teams from 1992/93 inaugural season (22 teams)
INSERT INTO teams (name, short_name, stadium, founded) VALUES
  ('Arsenal FC', 'ARS', 'Emirates Stadium', 1886),
  ('Aston Villa FC', 'AVL', 'Villa Park', 1874),
  ('Chelsea FC', 'CHE', 'Stamford Bridge', 1905),
  ('Coventry City FC', 'COV', 'Coventry Building Society Arena', 1883),
  ('Crystal Palace FC', 'CRY', 'Selhurst Park', 1905),
  ('Everton FC', 'EVE', 'Goodison Park', 1878),
  ('Ipswich Town FC', 'IPS', 'Portman Road', 1878),
  ('Leeds United FC', 'LEE', 'Elland Road', 1919),
  ('Liverpool FC', 'LIV', 'Anfield', 1892),
  ('Manchester City FC', 'MCI', 'Etihad Stadium', 1880),
  ('Manchester United FC', 'MUN', 'Old Trafford', 1878),
  ('Middlesbrough FC', 'MID', 'Riverside Stadium', 1876),
  ('Norwich City FC', 'NOR', 'Carrow Road', 1902),
  ('Nottingham Forest FC', 'NFO', 'The City Ground', 1865),
  ('Oldham Athletic AFC', 'OLD', 'Boundary Park', 1895),
  ('Queens Park Rangers FC', 'QPR', 'Loftus Road', 1882),
  ('Sheffield United FC', 'SHU', 'Bramall Lane', 1889),
  ('Sheffield Wednesday FC', 'SHW', 'Hillsborough', 1867),
  ('Southampton FC', 'SOU', 'St Mary''s Stadium', 1885),
  ('Tottenham Hotspur FC', 'TOT', 'Tottenham Hotspur Stadium', 1882),
  ('Wimbledon FC', 'WIM', 'Selhurst Park', 1889)
ON CONFLICT (name) DO NOTHING;

-- Additional teams that have played in Premier League history
INSERT INTO teams (name, short_name, stadium, founded) VALUES
  ('Blackburn Rovers FC', 'BLR', 'Ewood Park', 1875),
  ('Bolton Wanderers FC', 'BOL', 'University of Bolton Stadium', 1874),
  ('Derby County FC', 'DER', 'Pride Park Stadium', 1884),
  ('Swindon Town FC', 'SWI', 'County Ground', 1879),
  ('Leicester City FC', 'LEI', 'King Power Stadium', 1884),
  ('West Ham United FC', 'WHU', 'London Stadium', 1895),
  ('Newcastle United FC', 'NEW', 'St James'' Park', 1892),
  ('Wolverhampton Wanderers FC', 'WOL', 'Molineux Stadium', 1877),
  ('Barnsley FC', 'BAR', 'Oakwell', 1887),
  ('Bradford City AFC', 'BRA', 'Valley Parade', 1903),
  ('Charlton Athletic FC', 'CHA', 'The Valley', 1905),
  ('Birmingham City FC', 'BIR', 'St Andrew''s', 1875),
  ('Portsmouth FC', 'POR', 'Fratton Park', 1898),
  ('Watford FC', 'WAT', 'Vicarage Road', 1881),
  ('Wigan Athletic FC', 'WIG', 'DW Stadium', 1932),
  ('Reading FC', 'REA', 'Select Car Leasing Stadium', 1871),
  ('Fulham FC', 'FUL', 'Craven Cottage', 1879),
  ('Stoke City FC', 'STK', 'bet365 Stadium', 1863),
  ('Sunderland AFC', 'SUN', 'Stadium of Light', 1879),
  ('West Bromwich Albion FC', 'WBA', 'The Hawthorns', 1878),
  ('Swansea City AFC', 'SWA', 'Swansea.com Stadium', 1912),
  ('Hull City AFC', 'HUL', 'MKM Stadium', 1904),
  ('Cardiff City FC', 'CAR', 'Cardiff City Stadium', 1899),
  ('Huddersfield Town AFC', 'HUD', 'John Smith''s Stadium', 1908),
  ('Brighton & Hove Albion FC', 'BHA', 'Amex Stadium', 1901),
  ('Burnley FC', 'BUR', 'Turf Moor', 1882),
  ('AFC Bournemouth', 'BOU', 'Vitality Stadium', 1899),
  ('Brentford FC', 'BRE', 'Brentford Community Stadium', 1889),
  ('Luton Town FC', 'LUT', 'Kenilworth Road', 1885)
ON CONFLICT (name) DO NOTHING;

-- Link founding Premier League teams to 1992/93 season
INSERT INTO team_seasons (team_id, season_id, division)
SELECT t.id, s.id, 'Premier League'
FROM teams t
CROSS JOIN seasons s
WHERE s.name = '1992/93'
AND t.name IN (
  'Arsenal FC', 'Aston Villa FC', 'Chelsea FC', 'Coventry City FC',
  'Crystal Palace FC', 'Everton FC', 'Ipswich Town FC', 'Leeds United FC',
  'Liverpool FC', 'Manchester City FC', 'Manchester United FC', 'Middlesbrough FC',
  'Norwich City FC', 'Nottingham Forest FC', 'Oldham Athletic AFC', 'Queens Park Rangers FC',
  'Sheffield United FC', 'Sheffield Wednesday FC', 'Southampton FC', 'Tottenham Hotspur FC',
  'Wimbledon FC', 'Blackburn Rovers FC'  -- Blackburn was also in first season
)
ON CONFLICT (team_id, season_id) DO NOTHING;