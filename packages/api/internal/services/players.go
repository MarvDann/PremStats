package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/premstats/api/internal/database"
	"github.com/premstats/api/internal/models"
)

// PlayerService handles player-related database operations
type PlayerService struct {
	db *database.DB
}

// NewPlayerService creates a new player service instance
func NewPlayerService(db *database.DB) *PlayerService {
	return &PlayerService{db: db}
}

// GetPlayers returns all players with optional filters
func (s *PlayerService) GetPlayers(limit, offset int, search, position, nationality string) ([]models.Player, error) {
	query := `
		SELECT DISTINCT p.id, p.name, p.date_of_birth, p.nationality, p.position
		FROM players p
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	// Add search filter
	if search != "" {
		query += fmt.Sprintf(" AND p.name ILIKE $%d", argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	// Add position filter
	if position != "" {
		query += fmt.Sprintf(" AND p.position = $%d", argIndex)
		args = append(args, position)
		argIndex++
	}

	// Add nationality filter
	if nationality != "" {
		query += fmt.Sprintf(" AND p.nationality = $%d", argIndex)
		args = append(args, nationality)
		argIndex++
	}

	query += " ORDER BY p.name"

	// Add pagination
	if limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", argIndex)
		args = append(args, limit)
		argIndex++
	}
	if offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", argIndex)
		args = append(args, offset)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query players: %w", err)
	}
	defer rows.Close()

	var players []models.Player
	for rows.Next() {
		var p models.Player
		var dateOfBirth sql.NullString
		var nationality sql.NullString
		var position sql.NullString

		err := rows.Scan(&p.ID, &p.Name, &dateOfBirth, &nationality, &position)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player: %w", err)
		}

		if dateOfBirth.Valid {
			p.DateOfBirth = dateOfBirth.String
		}
		if nationality.Valid {
			p.Nationality = nationality.String
		}
		if position.Valid {
			p.Position = position.String
		}

		players = append(players, p)
	}

	return players, nil
}

// GetPlayerByID returns a single player by ID
func (s *PlayerService) GetPlayerByID(id int) (*models.Player, error) {
	query := `
		SELECT id, name, date_of_birth, nationality, position
		FROM players
		WHERE id = $1
	`

	var p models.Player
	var dateOfBirth sql.NullString
	var nationality sql.NullString
	var position sql.NullString

	err := s.db.QueryRow(query, id).Scan(
		&p.ID, &p.Name, &dateOfBirth, &nationality, &position,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("player not found")
		}
		return nil, fmt.Errorf("failed to get player: %w", err)
	}

	if dateOfBirth.Valid {
		p.DateOfBirth = dateOfBirth.String
	}
	if nationality.Valid {
		p.Nationality = nationality.String
	}
	if position.Valid {
		p.Position = position.String
	}

	return &p, nil
}

// GetPlayerStats returns player statistics for a specific season
func (s *PlayerService) GetPlayerStats(playerID int, seasonID int) (*models.PlayerStats, error) {
	query := `
		SELECT ps.id, ps.player_id, ps.season_id, ps.team_id, ps.appearances, 
		       ps.goals, ps.assists, ps.yellow_cards, ps.red_cards,
		       p.name as player_name, t.name as team_name, s.name as season_name
		FROM player_stats ps
		JOIN players p ON ps.player_id = p.id
		JOIN teams t ON ps.team_id = t.id
		JOIN seasons s ON ps.season_id = s.id
		WHERE ps.player_id = $1
	`
	args := []interface{}{playerID}

	if seasonID > 0 {
		query += " AND ps.season_id = $2"
		args = append(args, seasonID)
	}

	query += " ORDER BY s.name DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query player stats: %w", err)
	}
	defer rows.Close()

	var stats []models.PlayerStats
	for rows.Next() {
		var s models.PlayerStats
		err := rows.Scan(
			&s.ID, &s.PlayerID, &s.SeasonID, &s.TeamID,
			&s.Appearances, &s.Goals, &s.Assists, &s.YellowCards, &s.RedCards,
			&s.PlayerName, &s.TeamName, &s.SeasonName,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan player stats: %w", err)
		}
		stats = append(stats, s)
	}

	if len(stats) == 0 {
		return nil, fmt.Errorf("no stats found for player")
	}

	// Return the first (most recent) if no specific season requested
	return &stats[0], nil
}

// GetTopScorers returns the top scorers for a season
func (s *PlayerService) GetTopScorers(seasonID int, limit int) ([]models.TopScorer, error) {
	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT ps.player_id, p.name as player_name, ps.team_id, t.name as team_name,
		       ps.goals, ps.assists, ps.appearances, p.nationality, p.position
		FROM player_stats ps
		JOIN players p ON ps.player_id = p.id
		JOIN teams t ON ps.team_id = t.id
		WHERE ps.season_id = $1 AND ps.goals > 0
		ORDER BY ps.goals DESC, ps.assists DESC
		LIMIT $2
	`

	rows, err := s.db.Query(query, seasonID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query top scorers: %w", err)
	}
	defer rows.Close()

	var scorers []models.TopScorer
	rank := 1
	for rows.Next() {
		var ts models.TopScorer
		var nationality sql.NullString
		var position sql.NullString

		err := rows.Scan(
			&ts.PlayerID, &ts.PlayerName, &ts.TeamID, &ts.TeamName,
			&ts.Goals, &ts.Assists, &ts.Appearances, &nationality, &position,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan top scorer: %w", err)
		}

		ts.Rank = rank
		if nationality.Valid {
			ts.Nationality = nationality.String
		}
		if position.Valid {
			ts.Position = position.String
		}

		scorers = append(scorers, ts)
		rank++
	}

	return scorers, nil
}

// GetPlayerPositions returns all unique positions
func (s *PlayerService) GetPlayerPositions() ([]string, error) {
	query := `
		SELECT DISTINCT position
		FROM players
		WHERE position IS NOT NULL
		ORDER BY position
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query positions: %w", err)
	}
	defer rows.Close()

	var positions []string
	for rows.Next() {
		var position string
		if err := rows.Scan(&position); err != nil {
			return nil, fmt.Errorf("failed to scan position: %w", err)
		}
		positions = append(positions, position)
	}

	return positions, nil
}

// GetPlayerNationalities returns all unique nationalities
func (s *PlayerService) GetPlayerNationalities() ([]string, error) {
	query := `
		SELECT DISTINCT nationality
		FROM players
		WHERE nationality IS NOT NULL
		ORDER BY nationality
	`

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query nationalities: %w", err)
	}
	defer rows.Close()

	var nationalities []string
	for rows.Next() {
		var nationality string
		if err := rows.Scan(&nationality); err != nil {
			return nil, fmt.Errorf("failed to scan nationality: %w", err)
		}
		nationalities = append(nationalities, nationality)
	}

	return nationalities, nil
}

// SearchPlayers performs a comprehensive search across players, teams, and matches
func (s *PlayerService) SearchPlayers(query string, limit int) ([]models.SearchResult, error) {
	if limit <= 0 {
		limit = 20
	}

	searchQuery := `
		(
			SELECT 'player' as type, p.id, p.name, p.position as subtitle, '' as extra
			FROM players p
			WHERE p.name ILIKE $1
			LIMIT $2
		)
		UNION ALL
		(
			SELECT 'team' as type, t.id, t.name, t.stadium as subtitle, '' as extra
			FROM teams t
			WHERE t.name ILIKE $1
			LIMIT $2
		)
		ORDER BY type, name
		LIMIT $2
	`

	searchTerm := "%" + strings.TrimSpace(query) + "%"
	rows, err := s.db.Query(searchQuery, searchTerm, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search: %w", err)
	}
	defer rows.Close()

	var results []models.SearchResult
	for rows.Next() {
		var r models.SearchResult
		var subtitle sql.NullString
		var extra sql.NullString

		err := rows.Scan(&r.Type, &r.ID, &r.Name, &subtitle, &extra)
		if err != nil {
			return nil, fmt.Errorf("failed to scan search result: %w", err)
		}

		if subtitle.Valid {
			r.Subtitle = subtitle.String
		}
		if extra.Valid {
			r.Extra = extra.String
		}

		results = append(results, r)
	}

	return results, nil
}