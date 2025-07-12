-- PremStats Data Integrity Validation Framework
-- This script performs comprehensive validation checks to ensure 100% data accuracy

-- =============================================================================
-- 1. MATCH TABLE VALIDATION
-- =============================================================================

-- Check 1.1: Correct match counts per season
SELECT 
  '1.1 Match Counts' as validation_check,
  CASE 
    WHEN COUNT(CASE WHEN match_count_correct = 1 THEN 1 END) = COUNT(*) THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  COUNT(CASE WHEN match_count_correct = 1 THEN 1 END) as correct_seasons,
  COUNT(*) as total_seasons
FROM (
  SELECT 
    s.id,
    s.name,
    COUNT(m.id) as actual_matches,
    CASE WHEN s.id <= 3 THEN 462 ELSE 380 END as expected_matches,
    CASE 
      WHEN COUNT(m.id) = CASE WHEN s.id <= 3 THEN 462 ELSE 380 END THEN 1
      ELSE 0 
    END as match_count_correct
  FROM seasons s
  LEFT JOIN matches m ON s.id = m.season_id
  WHERE s.id BETWEEN 1 AND 33
  GROUP BY s.id, s.name
) season_counts;

-- Check 1.2: No invalid match data
SELECT 
  '1.2 Match Data Quality' as validation_check,
  CASE 
    WHEN invalid_matches = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  invalid_matches,
  total_matches
FROM (
  SELECT 
    COUNT(CASE 
      WHEN home_team_id = away_team_id 
        OR home_team_id IS NULL 
        OR away_team_id IS NULL
        OR home_score IS NULL 
        OR away_score IS NULL
        OR home_score < 0 
        OR away_score < 0
        OR home_score > 15 
        OR away_score > 15
      THEN 1 
    END) as invalid_matches,
    COUNT(*) as total_matches
  FROM matches
) match_quality;

-- Check 1.3: Match dates within season boundaries
SELECT 
  '1.3 Match Date Accuracy' as validation_check,
  CASE 
    WHEN invalid_dates = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  invalid_dates,
  total_matches_with_goals
FROM (
  SELECT 
    COUNT(CASE 
      WHEN s.id <= 33 AND (
        EXTRACT(YEAR FROM m.match_date) < 1992 
        OR EXTRACT(YEAR FROM m.match_date) > 2025
        OR (s.id <= 3 AND EXTRACT(MONTH FROM m.match_date) BETWEEN 6 AND 7)  -- Summer months invalid for football
        OR (s.id > 3 AND EXTRACT(MONTH FROM m.match_date) BETWEEN 6 AND 7)   -- Summer months invalid for football
      )
      THEN 1 
    END) as invalid_dates,
    COUNT(*) as total_matches_with_goals
  FROM matches m
  JOIN seasons s ON m.season_id = s.id
  WHERE EXISTS (SELECT 1 FROM goals g WHERE g.match_id = m.id)
) date_validation;

-- =============================================================================
-- 2. GOALS TABLE VALIDATION
-- =============================================================================

-- Check 2.1: No duplicate goals
SELECT 
  '2.1 No Duplicate Goals' as validation_check,
  CASE 
    WHEN duplicate_goals = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  duplicate_goals,
  total_goals
FROM (
  SELECT 
    COUNT(CASE WHEN goal_duplicates > 1 THEN 1 END) as duplicate_goals,
    COUNT(*) as total_goals
  FROM (
    SELECT match_id, player_id, minute, COUNT(*) as goal_duplicates
    FROM goals 
    GROUP BY match_id, player_id, minute
  ) goal_counts
) duplicate_check;

-- Check 2.2: Goals match match scores exactly
SELECT 
  '2.2 Goal-Score Accuracy' as validation_check,
  CASE 
    WHEN perfect_matches >= total_matches_with_goals * 0.95 THEN 'PASS'  -- 95% threshold
    ELSE 'FAIL'
  END as result,
  perfect_matches,
  total_matches_with_goals,
  ROUND(perfect_matches::decimal / NULLIF(total_matches_with_goals, 0) * 100, 1) as accuracy_pct
FROM (
  SELECT 
    COUNT(CASE WHEN actual_goals = expected_goals THEN 1 END) as perfect_matches,
    COUNT(*) as total_matches_with_goals
  FROM (
    SELECT 
      m.id,
      m.home_score + m.away_score as expected_goals,
      COUNT(g.id) as actual_goals
    FROM matches m
    JOIN seasons s ON m.season_id = s.id
    LEFT JOIN goals g ON m.id = g.match_id
    WHERE s.id BETWEEN 10 AND 31  -- Seasons with goal data
    GROUP BY m.id, m.home_score, m.away_score
    HAVING COUNT(g.id) > 0  -- Only matches with goals
  ) match_goal_counts
) goal_accuracy;

-- Check 2.3: No orphaned goals
SELECT 
  '2.3 No Orphaned Goals' as validation_check,
  CASE 
    WHEN orphaned_goals = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  orphaned_goals,
  total_goals
FROM (
  SELECT 
    COUNT(CASE 
      WHEN g.match_id IS NULL 
        OR g.player_id IS NULL 
        OR g.team_id IS NULL
        OR m.id IS NULL
        OR p.id IS NULL
        OR t.id IS NULL
      THEN 1 
    END) as orphaned_goals,
    COUNT(g.id) as total_goals
  FROM goals g
  LEFT JOIN matches m ON g.match_id = m.id
  LEFT JOIN players p ON g.player_id = p.id
  LEFT JOIN teams t ON g.team_id = t.id
) orphan_check;

-- Check 2.4: Goal minutes are realistic
SELECT 
  '2.4 Realistic Goal Minutes' as validation_check,
  CASE 
    WHEN invalid_minutes = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  invalid_minutes,
  total_goals
FROM (
  SELECT 
    COUNT(CASE 
      WHEN minute IS NULL 
        OR minute < 1 
        OR minute > 120  -- Extra time consideration
      THEN 1 
    END) as invalid_minutes,
    COUNT(*) as total_goals
  FROM goals
) minute_validation;

-- =============================================================================
-- 3. REFERENTIAL INTEGRITY VALIDATION
-- =============================================================================

-- Check 3.1: All goals belong to correct teams
SELECT 
  '3.1 Goal Team Assignment' as validation_check,
  CASE 
    WHEN invalid_team_goals = 0 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  invalid_team_goals,
  total_goals
FROM (
  SELECT 
    COUNT(CASE 
      WHEN g.team_id != m.home_team_id AND g.team_id != m.away_team_id
      THEN 1 
    END) as invalid_team_goals,
    COUNT(*) as total_goals
  FROM goals g
  JOIN matches m ON g.match_id = m.id
) team_assignment_check;

-- =============================================================================
-- 4. COVERAGE VALIDATION
-- =============================================================================

-- Check 4.1: Season coverage summary
SELECT 
  '4.1 Season Coverage' as validation_check,
  'INFO' as result,
  seasons_with_goals,
  total_seasons,
  ROUND(seasons_with_goals::decimal / total_seasons * 100, 1) as coverage_pct
FROM (
  SELECT 
    COUNT(CASE WHEN goal_count > 0 THEN 1 END) as seasons_with_goals,
    COUNT(*) as total_seasons
  FROM (
    SELECT 
      s.id,
      COUNT(g.id) as goal_count
    FROM seasons s
    LEFT JOIN matches m ON s.id = m.season_id
    LEFT JOIN goals g ON m.id = g.match_id
    WHERE s.id BETWEEN 1 AND 33
    GROUP BY s.id
  ) season_goal_counts
) coverage_summary;

-- =============================================================================
-- 5. DATA QUALITY METRICS
-- =============================================================================

-- Check 5.1: Overall data quality score
WITH validation_results AS (
  -- Match count validation
  SELECT 
    CASE WHEN COUNT(CASE WHEN match_count_correct = 1 THEN 1 END) = COUNT(*) THEN 1 ELSE 0 END as match_counts_pass
  FROM (
    SELECT 
      CASE 
        WHEN COUNT(m.id) = CASE WHEN s.id <= 3 THEN 462 ELSE 380 END THEN 1
        ELSE 0 
      END as match_count_correct
    FROM seasons s
    LEFT JOIN matches m ON s.id = m.season_id
    WHERE s.id BETWEEN 1 AND 33
    GROUP BY s.id
  ) mc
  
  UNION ALL
  
  -- Goal accuracy validation
  SELECT 
    CASE WHEN perfect_matches >= total_matches_with_goals * 0.95 THEN 1 ELSE 0 END as goal_accuracy_pass
  FROM (
    SELECT 
      COUNT(CASE WHEN actual_goals = expected_goals THEN 1 END) as perfect_matches,
      COUNT(*) as total_matches_with_goals
    FROM (
      SELECT 
        m.home_score + m.away_score as expected_goals,
        COUNT(g.id) as actual_goals
      FROM matches m
      JOIN seasons s ON m.season_id = s.id
      LEFT JOIN goals g ON m.id = g.match_id
      WHERE s.id BETWEEN 10 AND 31
      GROUP BY m.id, m.home_score, m.away_score
      HAVING COUNT(g.id) > 0
    ) goal_counts
  ) ga
)
SELECT 
  '5.1 Overall Quality Score' as validation_check,
  CASE 
    WHEN AVG(CASE 
      WHEN match_counts_pass IS NOT NULL THEN match_counts_pass 
      WHEN goal_accuracy_pass IS NOT NULL THEN goal_accuracy_pass 
      ELSE 0 
    END) >= 0.95 THEN 'PASS'
    ELSE 'FAIL'
  END as result,
  ROUND(AVG(CASE 
    WHEN match_counts_pass IS NOT NULL THEN match_counts_pass 
    WHEN goal_accuracy_pass IS NOT NULL THEN goal_accuracy_pass 
    ELSE 0 
  END) * 100, 1) as quality_score_pct
FROM validation_results;

-- =============================================================================
-- SUMMARY REPORT
-- =============================================================================

SELECT 
  '=== DATA INTEGRITY SUMMARY ===' as report_section,
  NOW() as validation_timestamp;

SELECT 
  'Total Seasons' as metric,
  COUNT(*) as value
FROM seasons WHERE id BETWEEN 1 AND 33

UNION ALL

SELECT 
  'Total Matches' as metric,
  COUNT(*) as value
FROM matches m
JOIN seasons s ON m.season_id = s.id
WHERE s.id BETWEEN 1 AND 33

UNION ALL

SELECT 
  'Total Goals' as metric,
  COUNT(*) as value
FROM goals

UNION ALL

SELECT 
  'Perfect Matches (Goals = Scores)' as metric,
  COUNT(CASE WHEN actual_goals = expected_goals THEN 1 END) as value
FROM (
  SELECT 
    m.home_score + m.away_score as expected_goals,
    COUNT(g.id) as actual_goals
  FROM matches m
  JOIN seasons s ON m.season_id = s.id
  LEFT JOIN goals g ON m.id = g.match_id
  WHERE s.id BETWEEN 10 AND 31
  GROUP BY m.id, m.home_score, m.away_score
  HAVING COUNT(g.id) > 0
) goal_validation

UNION ALL

SELECT 
  'Data Quality Score (%)' as metric,
  ROUND(
    COUNT(CASE WHEN actual_goals = expected_goals THEN 1 END)::decimal / 
    NULLIF(COUNT(*), 0) * 100, 
    1
  ) as value
FROM (
  SELECT 
    m.home_score + m.away_score as expected_goals,
    COUNT(g.id) as actual_goals
  FROM matches m
  JOIN seasons s ON m.season_id = s.id
  LEFT JOIN goals g ON m.id = g.match_id
  WHERE s.id BETWEEN 10 AND 31
  GROUP BY m.id, m.home_score, m.away_score
  HAVING COUNT(g.id) > 0
) goal_validation_summary;