package services

import (
	"database/sql"
	"fmt"

	"github.com/premstats/api/internal/database"
	"github.com/premstats/api/internal/models"
)

// TeamService handles team-related database operations
type TeamService struct {
	db *database.DB
}

// NewTeamService creates a new team service
func NewTeamService(db *database.DB) *TeamService {
	return &TeamService{db: db}
}

// GetAllTeams retrieves all teams from the database
func (s *TeamService) GetAllTeams() ([]models.Team, error) {
	query := `
		SELECT id, name, short_name, stadium, founded
		FROM teams
		ORDER BY name ASC
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query teams: %w", err)
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var team models.Team
		var stadium sql.NullString
		var founded sql.NullInt32

		err := rows.Scan(&team.ID, &team.Name, &team.ShortName, &stadium, &founded)
		if err != nil {
			return nil, fmt.Errorf("failed to scan team row: %w", err)
		}

		if stadium.Valid {
			team.Stadium = stadium.String
		}

		if founded.Valid {
			team.Founded = int(founded.Int32)
		}

		teams = append(teams, team)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating team rows: %w", err)
	}

	return teams, nil
}

// GetTeamByID retrieves a specific team by ID
func (s *TeamService) GetTeamByID(teamID int) (*models.Team, error) {
	query := `
		SELECT id, name, short_name, stadium, founded
		FROM teams
		WHERE id = $1
	`

	var team models.Team
	var stadium sql.NullString
	var founded sql.NullInt32

	err := s.db.QueryRow(query, teamID).Scan(
		&team.ID, &team.Name, &team.ShortName, &stadium, &founded,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("team with ID %d not found", teamID)
		}
		return nil, fmt.Errorf("failed to query team: %w", err)
	}

	if stadium.Valid {
		team.Stadium = stadium.String
	}

	if founded.Valid {
		team.Founded = int(founded.Int32)
	}

	return &team, nil
}

// GetTeamsBySeasonID retrieves all teams that participated in a specific season
func (s *TeamService) GetTeamsBySeasonID(seasonID int) ([]models.Team, error) {
	query := `
		SELECT DISTINCT t.id, t.name, t.short_name, t.stadium, t.founded
		FROM teams t
		JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
		WHERE m.season_id = $1
		ORDER BY t.name ASC
	`

	rows, err := s.db.Query(query, seasonID)
	if err != nil {
		return nil, fmt.Errorf("failed to query teams for season %d: %w", seasonID, err)
	}
	defer rows.Close()

	var teams []models.Team
	for rows.Next() {
		var team models.Team
		var stadium sql.NullString
		var founded sql.NullInt32

		err := rows.Scan(&team.ID, &team.Name, &team.ShortName, &stadium, &founded)
		if err != nil {
			return nil, fmt.Errorf("failed to scan team row: %w", err)
		}

		if stadium.Valid {
			team.Stadium = stadium.String
		}

		if founded.Valid {
			team.Founded = int(founded.Int32)
		}

		teams = append(teams, team)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating team rows: %w", err)
	}

	return teams, nil
}
