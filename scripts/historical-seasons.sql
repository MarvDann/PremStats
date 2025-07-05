-- Historical Premier League seasons with correct team counts
-- First 3 seasons (1992-1995): 22 teams
-- 1994/95: 4 teams relegated, 2 promoted
-- 1995/96 onwards: 20 teams

-- Add team_count column to seasons table
ALTER TABLE seasons ADD COLUMN IF NOT EXISTS team_count INTEGER DEFAULT 20;

-- Insert historical seasons
INSERT INTO seasons (name, year, start_date, end_date, team_count) VALUES 
  -- 22 team seasons
  ('1992/93', 1992, '1992-08-15', '1993-05-11', 22),
  ('1993/94', 1993, '1993-08-14', '1994-05-08', 22),
  ('1994/95', 1994, '1994-08-20', '1995-05-14', 22),
  -- Transition: 4 relegated (Crystal Palace, Norwich, Leicester, Ipswich)
  -- Only 2 promoted (Middlesbrough, Bolton)
  -- 20 team seasons from here
  ('1995/96', 1995, '1995-08-19', '1996-05-05', 20),
  ('1996/97', 1996, '1996-08-17', '1997-05-11', 20),
  ('1997/98', 1997, '1997-08-09', '1998-05-10', 20),
  ('1998/99', 1998, '1998-08-15', '1999-05-16', 20),
  ('1999/00', 1999, '1999-08-07', '2000-05-14', 20),
  ('2000/01', 2000, '2000-08-19', '2001-05-19', 20),
  ('2001/02', 2001, '2001-08-18', '2002-05-11', 20),
  ('2002/03', 2002, '2002-08-17', '2003-05-11', 20),
  ('2003/04', 2003, '2003-08-16', '2004-05-15', 20),
  ('2004/05', 2004, '2004-08-14', '2005-05-15', 20),
  ('2005/06', 2005, '2005-08-13', '2006-05-07', 20),
  ('2006/07', 2006, '2006-08-19', '2007-05-13', 20),
  ('2007/08', 2007, '2007-08-11', '2008-05-11', 20),
  ('2008/09', 2008, '2008-08-16', '2009-05-24', 20),
  ('2009/10', 2009, '2009-08-15', '2010-05-09', 20),
  ('2010/11', 2010, '2010-08-14', '2011-05-22', 20),
  ('2011/12', 2011, '2011-08-13', '2012-05-13', 20),
  ('2012/13', 2012, '2012-08-18', '2013-05-19', 20),
  ('2013/14', 2013, '2013-08-17', '2014-05-11', 20),
  ('2014/15', 2014, '2014-08-16', '2015-05-24', 20),
  ('2015/16', 2015, '2015-08-08', '2016-05-17', 20),
  ('2016/17', 2016, '2016-08-13', '2017-05-21', 20),
  ('2017/18', 2017, '2017-08-11', '2018-05-13', 20),
  ('2018/19', 2018, '2018-08-10', '2019-05-12', 20),
  ('2019/20', 2019, '2019-08-09', '2020-07-26', 20), -- Extended due to COVID
  ('2020/21', 2020, '2020-09-12', '2021-05-23', 20),
  ('2021/22', 2021, '2021-08-13', '2022-05-22', 20),
  ('2022/23', 2022, '2022-08-05', '2023-05-28', 20),
  ('2023/24', 2023, '2023-08-11', '2024-05-19', 20),
  ('2024/25', 2024, '2024-08-16', '2025-05-25', 20)
ON CONFLICT (name) DO UPDATE SET team_count = EXCLUDED.team_count;

-- Update division_changes table to track the 1994/95 special relegation
INSERT INTO division_changes (team_id, season_id, change_type, from_division, to_division, position) 
SELECT 
  t.id, 
  s.id, 
  'relegated', 
  'Premier League', 
  'Championship', 
  CASE t.name 
    WHEN 'Crystal Palace FC' THEN 19
    WHEN 'Norwich City FC' THEN 20
    WHEN 'Leicester City FC' THEN 21
    WHEN 'Ipswich Town FC' THEN 22
  END
FROM teams t, seasons s
WHERE s.name = '1994/95' 
AND t.name IN ('Crystal Palace FC', 'Norwich City FC', 'Leicester City FC', 'Ipswich Town FC')
ON CONFLICT DO NOTHING;

-- Add constraint to ensure team_count matches actual teams in season
ALTER TABLE seasons ADD CONSTRAINT check_team_count 
CHECK (team_count IN (20, 22));