package services

import (
	"database/sql"
	"fmt"

	"github.com/premstats/api/internal/database"
	"github.com/premstats/api/internal/models"
)

// StandingsService handles standings-related database operations
type StandingsService struct {
	db *database.DB
}

// NewStandingsService creates a new standings service
func NewStandingsService(db *database.DB) *StandingsService {
	return &StandingsService{db: db}
}

// GetStandingsBySeasonID calculates and returns the league table for a specific season
func (s *StandingsService) GetStandingsBySeasonID(seasonID int) (*models.Standings, error) {
	// Get season information
	var seasonName string
	err := s.db.QueryRow("SELECT name FROM seasons WHERE id = $1", seasonID).Scan(&seasonName)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("season with ID %d not found", seasonID)
		}
		return nil, fmt.Errorf("failed to get season: %w", err)
	}

	// Calculate standings from matches
	query := `
		WITH team_stats AS (
			SELECT 
				t.id as team_id,
				t.name as team_name,
				COUNT(CASE WHEN m.home_team_id = t.id OR m.away_team_id = t.id THEN 1 END) as played,
				COUNT(CASE 
					WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR 
						 (m.away_team_id = t.id AND m.away_score > m.home_score) 
					THEN 1 
				END) as won,
				COUNT(CASE 
					WHEN (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.home_score = m.away_score 
					THEN 1 
				END) as drawn,
				COUNT(CASE 
					WHEN (m.home_team_id = t.id AND m.home_score < m.away_score) OR 
						 (m.away_team_id = t.id AND m.away_score < m.home_score) 
					THEN 1 
				END) as lost,
				COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE 0 END), 0) +
				COALESCE(SUM(CASE WHEN m.away_team_id = t.id THEN m.away_score ELSE 0 END), 0) as goals_for,
				COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE 0 END), 0) +
				COALESCE(SUM(CASE WHEN m.away_team_id = t.id THEN m.home_score ELSE 0 END), 0) as goals_against
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
		SELECT 
			team_id,
			team_name,
			played,
			won,
			drawn,
			lost,
			goals_for,
			goals_against,
			(goals_for - goals_against) as goal_difference,
			(won * 3 + drawn) as points
		FROM team_stats
		ORDER BY points DESC, goal_difference DESC, goals_for DESC, team_name ASC
	`

	rows, err := s.db.Query(query, seasonID)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate standings for season %d: %w", seasonID, err)
	}
	defer rows.Close()

	var entries []models.StandingsEntry
	position := 1

	for rows.Next() {
		var entry models.StandingsEntry
		err := rows.Scan(
			&entry.TeamID,
			&entry.Team,
			&entry.Played,
			&entry.Won,
			&entry.Drawn,
			&entry.Lost,
			&entry.GoalsFor,
			&entry.GoalsAgainst,
			&entry.GoalDifference,
			&entry.Points,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan standings row: %w", err)
		}

		entry.Position = position
		entries = append(entries, entry)
		position++
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating standings rows: %w", err)
	}

	standings := &models.Standings{
		SeasonID: seasonID,
		Season:   seasonName,
		Table:    entries,
	}

	return standings, nil
}

// GetAvailableSeasons returns all seasons that have match data
func (s *StandingsService) GetAvailableSeasons() ([]models.Season, error) {
	query := `
		SELECT DISTINCT s.id, s.name
		FROM seasons s
		JOIN matches m ON s.id = m.season_id
		WHERE m.home_score IS NOT NULL AND m.away_score IS NOT NULL
		ORDER BY s.id ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to get available seasons: %w", err)
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

// GetTeamStatsForSeason returns detailed statistics for a specific team in a season
func (s *StandingsService) GetTeamStatsForSeason(teamID, seasonID int) (*models.TeamStats, error) {
	query := `
		SELECT 
			t.id as team_id,
			t.name as team_name,
			s.id as season_id,
			s.name as season_name,
			COUNT(CASE WHEN m.home_team_id = t.id OR m.away_team_id = t.id THEN 1 END) as played,
			COUNT(CASE 
				WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR 
					 (m.away_team_id = t.id AND m.away_score > m.home_score) 
				THEN 1 
			END) as won,
			COUNT(CASE 
				WHEN (m.home_team_id = t.id OR m.away_team_id = t.id) AND m.home_score = m.away_score 
				THEN 1 
			END) as drawn,
			COUNT(CASE 
				WHEN (m.home_team_id = t.id AND m.home_score < m.away_score) OR 
					 (m.away_team_id = t.id AND m.away_score < m.home_score) 
				THEN 1 
			END) as lost,
			COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE 0 END), 0) +
			COALESCE(SUM(CASE WHEN m.away_team_id = t.id THEN m.away_score ELSE 0 END), 0) as goals_for,
			COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE 0 END), 0) +
			COALESCE(SUM(CASE WHEN m.away_team_id = t.id THEN m.home_score ELSE 0 END), 0) as goals_against
		FROM teams t
		CROSS JOIN seasons s
		LEFT JOIN matches m ON (m.home_team_id = t.id OR m.away_team_id = t.id) 
			AND m.season_id = s.id 
			AND m.home_score IS NOT NULL 
			AND m.away_score IS NOT NULL
		WHERE t.id = $1 AND s.id = $2
		GROUP BY t.id, t.name, s.id, s.name
	`

	var stats models.TeamStats
	err := s.db.QueryRow(query, teamID, seasonID).Scan(
		&stats.TeamID,
		&stats.Team,
		&stats.SeasonID,
		&stats.Season,
		&stats.MatchesPlayed,
		&stats.Wins,
		&stats.Draws,
		&stats.Losses,
		&stats.GoalsFor,
		&stats.GoalsAgainst,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("team %d not found in season %d", teamID, seasonID)
		}
		return nil, fmt.Errorf("failed to get team stats: %w", err)
	}

	// Calculate derived stats
	stats.GoalDifference = stats.GoalsFor - stats.GoalsAgainst
	stats.Points = stats.Wins*3 + stats.Draws

	if stats.MatchesPlayed > 0 {
		stats.WinPercentage = float64(stats.Wins) / float64(stats.MatchesPlayed) * 100
		stats.PPG = float64(stats.Points) / float64(stats.MatchesPlayed)
	}

	return &stats, nil
}
