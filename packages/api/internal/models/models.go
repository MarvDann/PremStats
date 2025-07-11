package models

import (
	"time"
)

// Team represents a Premier League team
type Team struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	ShortName string `json:"shortName"`
	Stadium   string `json:"stadium"`
	Founded   int    `json:"founded,omitempty"`
}

// Season represents a Premier League season
type Season struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// Match represents a Premier League match
type Match struct {
	ID           int       `json:"id"`
	SeasonID     int       `json:"seasonId"`
	HomeTeamID   int       `json:"homeTeamId"`
	AwayTeamID   int       `json:"awayTeamId"`
	HomeTeam     string    `json:"homeTeam"`
	AwayTeam     string    `json:"awayTeam"`
	HomeScore    *int      `json:"homeScore"`
	AwayScore    *int      `json:"awayScore"`
	HalfTimeHome *int      `json:"halfTimeHome,omitempty"`
	HalfTimeAway *int      `json:"halfTimeAway,omitempty"`
	MatchDate    time.Time `json:"date"`
	Status       string    `json:"status"`
	Referee      string    `json:"referee,omitempty"`
	// Match statistics
	HomeShots         *int `json:"homeShots,omitempty"`
	AwayShots         *int `json:"awayShots,omitempty"`
	HomeShotsOnTarget *int `json:"homeShotsOnTarget,omitempty"`
	AwayShotsOnTarget *int `json:"awayShotsOnTarget,omitempty"`
	HomeCorners       *int `json:"homeCorners,omitempty"`
	AwayCorners       *int `json:"awayCorners,omitempty"`
	HomeFouls         *int `json:"homeFouls,omitempty"`
	AwayFouls         *int `json:"awayFouls,omitempty"`
	HomeYellowCards   *int `json:"homeYellowCards,omitempty"`
	AwayYellowCards   *int `json:"awayYellowCards,omitempty"`
	HomeRedCards      *int `json:"homeRedCards,omitempty"`
	AwayRedCards      *int `json:"awayRedCards,omitempty"`
}

// StandingsEntry represents a team's position in the league table
type StandingsEntry struct {
	Position       int    `json:"position"`
	Team           string `json:"team"`
	TeamID         int    `json:"teamId"`
	Played         int    `json:"played"`
	Won            int    `json:"won"`
	Drawn          int    `json:"drawn"`
	Lost           int    `json:"lost"`
	GoalsFor       int    `json:"goalsFor"`
	GoalsAgainst   int    `json:"goalsAgainst"`
	GoalDifference int    `json:"goalDifference"`
	Points         int    `json:"points"`
}

// Standings represents the complete league table
type Standings struct {
	SeasonID int              `json:"seasonId"`
	Season   string           `json:"season"`
	Table    []StandingsEntry `json:"table"`
}

// Player represents a Premier League player
type Player struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	DateOfBirth string `json:"dateOfBirth,omitempty"`
	Nationality string `json:"nationality,omitempty"`
	Position    string `json:"position,omitempty"`
	TeamID      int    `json:"teamId,omitempty"`
	Team        string `json:"team,omitempty"`
}

// PlayerStats represents player statistics for a season
type PlayerStats struct {
	ID          int    `json:"id"`
	PlayerID    int    `json:"playerId"`
	PlayerName  string `json:"playerName"`
	SeasonID    int    `json:"seasonId"`
	SeasonName  string `json:"seasonName"`
	TeamID      int    `json:"teamId"`
	TeamName    string `json:"teamName"`
	Appearances int    `json:"appearances"`
	Goals       int    `json:"goals"`
	Assists     int    `json:"assists"`
	YellowCards int    `json:"yellowCards"`
	RedCards    int    `json:"redCards"`
}

// TopScorer represents a top scorer entry
type TopScorer struct {
	Rank        int    `json:"rank"`
	PlayerID    int    `json:"playerId"`
	PlayerName  string `json:"playerName"`
	TeamID      int    `json:"teamId"`
	TeamName    string `json:"teamName"`
	Goals       int    `json:"goals"`
	Assists     int    `json:"assists"`
	Appearances int    `json:"appearances"`
	Nationality string `json:"nationality,omitempty"`
	Position    string `json:"position,omitempty"`
}

// SearchResult represents a search result item
type SearchResult struct {
	Type     string `json:"type"`     // "player", "team", "match"
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Subtitle string `json:"subtitle,omitempty"`
	Extra    string `json:"extra,omitempty"`
}

// MatchEvent represents an event that occurred during a match
type MatchEvent struct {
	ID         int    `json:"id"`
	MatchID    int    `json:"matchId"`
	EventType  string `json:"eventType"` // goal, own_goal, penalty, yellow_card, red_card, substitution
	Minute     int    `json:"minute"`
	PlayerID   int    `json:"playerId"`
	PlayerName string `json:"playerName,omitempty"`
	TeamID     int    `json:"teamId"`
	Detail     string `json:"detail,omitempty"`
}

// TeamStats represents team statistics for a season
type TeamStats struct {
	TeamID         int     `json:"teamId"`
	Team           string  `json:"team"`
	SeasonID       int     `json:"seasonId"`
	Season         string  `json:"season"`
	MatchesPlayed  int     `json:"matchesPlayed"`
	Wins           int     `json:"wins"`
	Draws          int     `json:"draws"`
	Losses         int     `json:"losses"`
	GoalsFor       int     `json:"goalsFor"`
	GoalsAgainst   int     `json:"goalsAgainst"`
	GoalDifference int     `json:"goalDifference"`
	Points         int     `json:"points"`
	WinPercentage  float64 `json:"winPercentage"`
	PPG            float64 `json:"pointsPerGame"`
}

// SeasonSummary represents a season's summary statistics
type SeasonSummary struct {
	SeasonID         int      `json:"seasonId"`
	Season           string   `json:"season"`
	TotalMatches     int      `json:"totalMatches"`
	TotalGoals       int      `json:"totalGoals"`
	AvgGoalsPerMatch float64  `json:"avgGoalsPerMatch"`
	Champion         string   `json:"champion,omitempty"`
	Relegated        []string `json:"relegated,omitempty"`
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// PaginatedResponse represents a paginated API response
type PaginatedResponse struct {
	Success bool           `json:"success"`
	Data    interface{}    `json:"data"`
	Meta    PaginationMeta `json:"meta"`
	Error   string         `json:"error,omitempty"`
}

// PaginationMeta contains pagination metadata
type PaginationMeta struct {
	CurrentPage  int `json:"currentPage"`
	TotalPages   int `json:"totalPages"`
	TotalItems   int `json:"totalItems"`
	ItemsPerPage int `json:"itemsPerPage"`
}
