-- Enhanced schema for storing goal scorer data and match events

-- Match events table was already created successfully

-- Create a view for easy goal queries
CREATE OR REPLACE VIEW match_goals AS
SELECT 
  me.id,
  me.match_id,
  me.minute,
  p.name as scorer_name,
  t.name as team_name,
  me.event_type,
  m.match_date as match_date,
  ht.name as home_team,
  at.name as away_team,
  m.home_score,
  m.away_score
FROM match_events me
JOIN players p ON me.player_id = p.id
JOIN teams t ON me.team_id = t.id
JOIN matches m ON me.match_id = m.id
JOIN teams ht ON m.home_team_id = ht.id
JOIN teams at ON m.away_team_id = at.id
WHERE me.event_type IN ('goal', 'own_goal', 'penalty');

-- Function to calculate league table at any point in time
CREATE OR REPLACE FUNCTION calculate_table_at_date(season_id_param INTEGER, as_of_date DATE)
RETURNS TABLE (
  pos INTEGER,
  team_id INTEGER,
  team_name VARCHAR(100),
  played INTEGER,
  won INTEGER,
  drawn INTEGER,
  lost INTEGER,
  goals_for INTEGER,
  goals_against INTEGER,
  goal_difference INTEGER,
  points INTEGER,
  form VARCHAR(10)
) AS $$
BEGIN
  RETURN QUERY
  WITH match_results AS (
    SELECT 
      m.id,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score,
      m.match_date,
      CASE 
        WHEN m.home_score > m.away_score THEN 'H'
        WHEN m.home_score < m.away_score THEN 'A'
        ELSE 'D'
      END as result
    FROM matches m
    WHERE m.season_id = season_id_param
    AND m.match_date <= as_of_date
    AND m.status = 'completed'
  ),
  team_stats AS (
    -- Home matches
    SELECT 
      home_team_id as team_id,
      COUNT(*) as played,
      SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as drawn,
      SUM(CASE WHEN result = 'A' THEN 1 ELSE 0 END) as lost,
      SUM(home_score) as goals_for,
      SUM(away_score) as goals_against
    FROM match_results
    GROUP BY home_team_id
    
    UNION ALL
    
    -- Away matches
    SELECT 
      away_team_id as team_id,
      COUNT(*) as played,
      SUM(CASE WHEN result = 'A' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as drawn,
      SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) as lost,
      SUM(away_score) as goals_for,
      SUM(home_score) as goals_against
    FROM match_results
    GROUP BY away_team_id
  ),
  aggregated_stats AS (
    SELECT 
      ts.team_id,
      t.name as team_name,
      SUM(ts.played) as played,
      SUM(ts.won) as won,
      SUM(ts.drawn) as drawn,
      SUM(ts.lost) as lost,
      SUM(ts.goals_for) as goals_for,
      SUM(ts.goals_against) as goals_against,
      SUM(ts.goals_for) - SUM(ts.goals_against) as goal_difference,
      SUM(ts.won) * 3 + SUM(ts.drawn) as points
    FROM team_stats ts
    JOIN teams t ON ts.team_id = t.id
    GROUP BY ts.team_id, t.name
  )
  SELECT 
    ROW_NUMBER() OVER (ORDER BY points DESC, goal_difference DESC, goals_for DESC)::INTEGER as pos,
    team_id,
    team_name,
    played::INTEGER,
    won::INTEGER,
    drawn::INTEGER,
    lost::INTEGER,
    goals_for::INTEGER,
    goals_against::INTEGER,
    goal_difference::INTEGER,
    points::INTEGER,
    '' as form -- Can be calculated from recent matches if needed
  FROM aggregated_stats
  ORDER BY points DESC, goal_difference DESC, goals_for DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get match details with goalscorers
CREATE OR REPLACE FUNCTION get_match_details(match_id_param INTEGER)
RETURNS TABLE (
  match_date TIMESTAMP,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  home_score INTEGER,
  away_score INTEGER,
  half_time_score VARCHAR(10),
  referee VARCHAR(100),
  attendance INTEGER,
  goals JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.match_date,
    ht.name as home_team,
    at.name as away_team,
    m.home_score,
    m.away_score,
    CONCAT(COALESCE(m.half_time_home::TEXT, '?'), '-', COALESCE(m.half_time_away::TEXT, '?')) as half_time_score,
    m.referee,
    m.attendance,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'minute', me.minute,
          'scorer', p.name,
          'team', t.name,
          'type', me.event_type
        ) ORDER BY me.minute
      ) FILTER (WHERE me.id IS NOT NULL),
      '[]'::JSON
    ) as goals
  FROM matches m
  JOIN teams ht ON m.home_team_id = ht.id
  JOIN teams at ON m.away_team_id = at.id
  LEFT JOIN match_events me ON m.id = me.match_id AND me.event_type IN ('goal', 'own_goal', 'penalty')
  LEFT JOIN players p ON me.player_id = p.id
  LEFT JOIN teams t ON me.team_id = t.id
  WHERE m.id = match_id_param
  GROUP BY m.match_date, ht.name, at.name, m.home_score, m.away_score, 
           m.half_time_home, m.half_time_away, m.referee, m.attendance;
END;
$$ LANGUAGE plpgsql;