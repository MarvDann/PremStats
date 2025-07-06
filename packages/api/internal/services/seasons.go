package services

import (
	"database/sql"
	"fmt"

	"github.com/premstats/api/internal/database"
	"github.com/premstats/api/internal/models"
)

// SeasonService handles season-related database operations
type SeasonService struct {
	db *database.DB
}

// NewSeasonService creates a new season service
func NewSeasonService(db *database.DB) *SeasonService {
	return &SeasonService{db: db}
}

// GetAllSeasons retrieves all seasons
func (s *SeasonService) GetAllSeasons() ([]models.Season, error) {
	query := `
		SELECT id, name
		FROM seasons
		ORDER BY id ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query seasons: %w", err)
	}
	defer rows.Close()

	var seasons []models.Season
	for rows.Next() {
		var season models.Season
		err := rows.Scan(&season.ID, &season.Name)
		if err != nil {
			return nil, fmt.Errorf("failed to scan season row: %w", err)
		}
		seasons = append(seasons, season)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating season rows: %w", err)
	}

	return seasons, nil
}

// GetSeasonByID retrieves a specific season by ID
func (s *SeasonService) GetSeasonByID(seasonID int) (*models.Season, error) {
	query := `
		SELECT id, name
		FROM seasons
		WHERE id = $1
	`

	var season models.Season
	err := s.db.QueryRow(query, seasonID).Scan(&season.ID, &season.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("season with ID %d not found", seasonID)
		}
		return nil, fmt.Errorf("failed to query season: %w", err)
	}

	return &season, nil
}

// GetSeasonSummary retrieves summary statistics for a season
func (s *SeasonService) GetSeasonSummary(seasonID int) (*models.SeasonSummary, error) {
	// Get basic season info
	season, err := s.GetSeasonByID(seasonID)
	if err != nil {
		return nil, err
	}

	// Get match statistics
	query := `
		SELECT 
			COUNT(*) as total_matches,
			COALESCE(SUM(home_score + away_score), 0) as total_goals,
			COALESCE(AVG(home_score + away_score), 0) as avg_goals_per_match
		FROM matches
		WHERE season_id = $1 
		AND home_score IS NOT NULL 
		AND away_score IS NOT NULL
	`

	var summary models.SeasonSummary
	summary.SeasonID = season.ID
	summary.Season = season.Name

	err = s.db.QueryRow(query, seasonID).Scan(
		&summary.TotalMatches,
		&summary.TotalGoals,
		&summary.AvgGoalsPerMatch,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get season summary: %w", err)
	}

	// Get champion (team with most points)
	championQuery := `
		WITH team_points AS (
			SELECT 
				t.name as team_name,
				COUNT(CASE 
					WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR 
						 (m.away_team_id = t.id AND m.away_score > m.home_score) 
					THEN 1 
				END) * 3 +
				COUNT(CASE 
					WHEN (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.home_score = m.away_score 
					THEN 1 
				END) as points
			FROM teams t
			LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) 
				AND m.season_id = $1 
				AND m.home_score IS NOT NULL 
				AND m.away_score IS NOT NULL
			WHERE t.id IN (
				SELECT DISTINCT home_team_id FROM matches WHERE season_id = $1
				UNION
				SELECT DISTINCT away_team_id FROM matches WHERE season_id = $1
			)
			GROUP BY t.id, t.name
		)
		SELECT team_name
		FROM team_points
		ORDER BY points DESC
		LIMIT 1
	`

	var champion sql.NullString
	err = s.db.QueryRow(championQuery, seasonID).Scan(&champion)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get champion: %w", err)
	}
	if champion.Valid {
		summary.Champion = champion.String
	}

	// Get relegated teams (bottom 3 teams) - only for seasons with 20 teams
	if summary.TotalMatches >= 380 { // 20 teams * 19 * 2 = 380 matches
		relegatedQuery := `
			WITH team_points AS (
				SELECT 
					t.name as team_name,
					COUNT(CASE 
						WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR 
							 (m.away_team_id = t.id AND m.away_score > m.home_score) 
						THEN 1 
					END) * 3 +
					COUNT(CASE 
						WHEN (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.home_score = m.away_score 
						THEN 1 
					END) as points,
					COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE 0 END), 0) +
					COALESCE(SUM(CASE WHEN m.away_team_id = t.id THEN m.away_score ELSE 0 END), 0) -
					COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE 0 END), 0) -
					COALESCE(SUM(CASE WHEN m.away_team_id = t.id THEN m.home_score ELSE 0 END), 0) as goal_difference
				FROM teams t
				LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) 
					AND m.season_id = $1 
					AND m.home_score IS NOT NULL 
					AND m.away_score IS NOT NULL
				WHERE t.id IN (
					SELECT DISTINCT home_team_id FROM matches WHERE season_id = $1
					UNION
					SELECT DISTINCT away_team_id FROM matches WHERE season_id = $1
				)
				GROUP BY t.id, t.name
			)
			SELECT team_name
			FROM team_points
			ORDER BY points ASC, goal_difference ASC
			LIMIT 3
		`

		rows, err := s.db.Query(relegatedQuery, seasonID)
		if err != nil {
			return nil, fmt.Errorf("failed to get relegated teams: %w", err)
		}
		defer rows.Close()

		var relegated []string
		for rows.Next() {
			var teamName string
			err := rows.Scan(&teamName)
			if err != nil {
				return nil, fmt.Errorf("failed to scan relegated team: %w", err)
			}
			relegated = append(relegated, teamName)
		}
		summary.Relegated = relegated
	}

	return &summary, nil
}
