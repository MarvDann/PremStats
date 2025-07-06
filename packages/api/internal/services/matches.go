package services

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	"github.com/premstats/api/internal/database"
	"github.com/premstats/api/internal/models"
)

// MatchService handles match-related database operations
type MatchService struct {
	db *database.DB
}

// NewMatchService creates a new match service
func NewMatchService(db *database.DB) *MatchService {
	return &MatchService{db: db}
}

// GetMatchesBySeasonID retrieves all matches for a specific season
func (s *MatchService) GetMatchesBySeasonID(seasonID int, limit, offset int) ([]models.Match, error) {
	query := `
		SELECT 
			m.id, m.season_id, m.home_team_id, m.away_team_id,
			ht.name as home_team, at.name as away_team,
			m.home_score, m.away_score, m.half_time_home, m.half_time_away,
			m.match_date, m.referee
		FROM matches m
		JOIN teams ht ON m.home_team_id = ht.id
		JOIN teams at ON m.away_team_id = at.id
		WHERE m.season_id = $1
		ORDER BY m.match_date ASC, m.id ASC
		LIMIT $2 OFFSET $3
	`

	rows, err := s.db.Query(query, seasonID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to query matches for season %d: %w", seasonID, err)
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		match, err := s.scanMatch(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan match row: %w", err)
		}
		matches = append(matches, *match)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating match rows: %w", err)
	}

	return matches, nil
}

// GetMatchByID retrieves a specific match by ID
func (s *MatchService) GetMatchByID(matchID int) (*models.Match, error) {
	query := `
		SELECT 
			m.id, m.season_id, m.home_team_id, m.away_team_id,
			ht.name as home_team, at.name as away_team,
			m.home_score, m.away_score, m.half_time_home, m.half_time_away,
			m.match_date, m.referee
		FROM matches m
		JOIN teams ht ON m.home_team_id = ht.id
		JOIN teams at ON m.away_team_id = at.id
		WHERE m.id = $1
	`

	row := s.db.QueryRow(query, matchID)
	match, err := s.scanMatch(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("match with ID %d not found", matchID)
		}
		return nil, fmt.Errorf("failed to query match: %w", err)
	}

	return match, nil
}

// GetMatches retrieves matches with optional filters
func (s *MatchService) GetMatches(teamID, seasonID, limit, offset int) ([]models.Match, error) {
	query := `
		SELECT 
			m.id, m.season_id, m.home_team_id, m.away_team_id,
			ht.name as home_team, at.name as away_team,
			m.home_score, m.away_score, m.half_time_home, m.half_time_away,
			m.match_date, m.referee
		FROM matches m
		JOIN teams ht ON m.home_team_id = ht.id
		JOIN teams at ON m.away_team_id = at.id
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if seasonID > 0 {
		query += " AND m.season_id = $" + strconv.Itoa(argIndex)
		args = append(args, seasonID)
		argIndex++
	}

	if teamID > 0 {
		query += " AND (m.home_team_id = $" + strconv.Itoa(argIndex) + " OR m.away_team_id = $" + strconv.Itoa(argIndex) + ")"
		args = append(args, teamID)
		argIndex++
	}

	query += " ORDER BY m.match_date DESC, m.id DESC"

	if limit > 0 {
		query += " LIMIT $" + strconv.Itoa(argIndex)
		args = append(args, limit)
		argIndex++
	}

	if offset > 0 {
		query += " OFFSET $" + strconv.Itoa(argIndex)
		args = append(args, offset)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query matches: %w", err)
	}
	defer rows.Close()

	var matches []models.Match
	for rows.Next() {
		match, err := s.scanMatch(rows)
		if err != nil {
			return nil, fmt.Errorf("failed to scan match row: %w", err)
		}
		matches = append(matches, *match)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating match rows: %w", err)
	}

	return matches, nil
}

// scanMatch scans a database row into a Match model
func (s *MatchService) scanMatch(scanner interface{}) (*models.Match, error) {
	var match models.Match
	var homeScore, awayScore, halftimeHome, halftimeAway sql.NullInt32
	var referee sql.NullString

	var err error
	switch s := scanner.(type) {
	case *sql.Rows:
		err = s.Scan(
			&match.ID, &match.SeasonID, &match.HomeTeamID, &match.AwayTeamID,
			&match.HomeTeam, &match.AwayTeam,
			&homeScore, &awayScore, &halftimeHome, &halftimeAway,
			&match.MatchDate, &referee,
		)
	case *sql.Row:
		err = s.Scan(
			&match.ID, &match.SeasonID, &match.HomeTeamID, &match.AwayTeamID,
			&match.HomeTeam, &match.AwayTeam,
			&homeScore, &awayScore, &halftimeHome, &halftimeAway,
			&match.MatchDate, &referee,
		)
	default:
		return nil, fmt.Errorf("unsupported scanner type")
	}

	if err != nil {
		return nil, err
	}

	// Handle nullable fields
	if homeScore.Valid {
		score := int(homeScore.Int32)
		match.HomeScore = &score
	}
	if awayScore.Valid {
		score := int(awayScore.Int32)
		match.AwayScore = &score
	}
	if halftimeHome.Valid {
		ht := int(halftimeHome.Int32)
		match.HalfTimeHome = &ht
	}
	if halftimeAway.Valid {
		ht := int(halftimeAway.Int32)
		match.HalfTimeAway = &ht
	}
	if referee.Valid {
		match.Referee = referee.String
	}

	// Set status based on whether scores are available
	if match.HomeScore != nil && match.AwayScore != nil {
		match.Status = "completed"
	} else if match.MatchDate.Before(time.Now()) {
		match.Status = "pending"
	} else {
		match.Status = "scheduled"
	}

	return &match, nil
}
