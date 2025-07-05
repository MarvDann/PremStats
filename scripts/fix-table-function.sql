-- Fix the calculate_table_at_date function to use correct column names
CREATE OR REPLACE FUNCTION calculate_table_at_date(season_id_param INTEGER, as_of_date DATE)
RETURNS TABLE (
  position INTEGER,
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
    AND m.status = 'FINISHED'
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
    ROW_NUMBER() OVER (ORDER BY points DESC, goal_difference DESC, goals_for DESC) as position,
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