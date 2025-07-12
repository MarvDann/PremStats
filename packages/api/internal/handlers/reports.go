package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"
	
	"github.com/premstats/api/internal/database"
)

// Handler provides access to database for reports
type Handler struct {
	DB *database.DB
}

// SeasonCompleteness represents data completeness for a single season
type SeasonCompleteness struct {
	ID                  int     `json:"id"`
	Year                int     `json:"year"`
	Name                string  `json:"name"`
	TotalMatches        int     `json:"totalMatches"`
	MatchesWithScores   int     `json:"matchesWithScores"`
	MatchesWithGoals    int     `json:"matchesWithGoals"`
	TotalGoals          int     `json:"totalGoals"`
	UniquePlayers       int     `json:"uniquePlayers"`
	TeamsCount          int     `json:"teamsCount"`
	ExpectedMatches     int     `json:"expectedMatches"`
	MatchCompleteness   float64 `json:"matchCompleteness"`
	GoalCompleteness    float64 `json:"goalCompleteness"`
	SeasonProgress      float64 `json:"seasonProgress"`
	QualityLevel        string  `json:"qualityLevel"`
	QualityIcon         string  `json:"qualityIcon"`
	SeasonStart         *time.Time `json:"seasonStart"`
	SeasonEnd           *time.Time `json:"seasonEnd"`
	LastUpdated         time.Time `json:"lastUpdated"`
}

// OverallStats represents overall data completeness statistics
type OverallStats struct {
	TotalSeasons           int     `json:"totalSeasons"`
	SeasonsWithData        int     `json:"seasonsWithData"`
	TotalMatches           int     `json:"totalMatches"`
	TotalGoals             int     `json:"totalGoals"`
	TotalPlayers           int     `json:"totalPlayers"`
	ExcellentSeasons       int     `json:"excellentSeasons"`
	GoodSeasons            int     `json:"goodSeasons"`
	PartialSeasons         int     `json:"partialSeasons"`
	MinimalSeasons         int     `json:"minimalSeasons"`
	NoDataSeasons          int     `json:"noDataSeasons"`
	AvgMatchCompleteness   float64 `json:"avgMatchCompleteness"`
	AvgGoalCompleteness    float64 `json:"avgGoalCompleteness"`
	LastUpdated            time.Time `json:"lastUpdated"`
}

// EraStats represents data completeness by era
type EraStats struct {
	Name                string  `json:"name"`
	YearRange           string  `json:"yearRange"`
	SeasonsTotal        int     `json:"seasonsTotal"`
	SeasonsWithData     int     `json:"seasonsWithData"`
	AvgGoalCompleteness float64 `json:"avgGoalCompleteness"`
	TotalGoals          int     `json:"totalGoals"`
	TotalMatches        int     `json:"totalMatches"`
}

// DataCompletenessReport represents the complete report structure
type DataCompletenessReport struct {
	OverallStats    OverallStats        `json:"overallStats"`
	SeasonData      []SeasonCompleteness `json:"seasonData"`
	EraStats        []EraStats          `json:"eraStats"`
	BestSeasons     []SeasonCompleteness `json:"bestSeasons"`
	WorstSeasons    []SeasonCompleteness `json:"worstSeasons"`
	RecentActivity  []ActivityLog       `json:"recentActivity"`
	GeneratedAt     time.Time           `json:"generatedAt"`
}

// ActivityLog represents recent data import activity
type ActivityLog struct {
	Date        time.Time `json:"date"`
	Activity    string    `json:"activity"`
	Season      string    `json:"season"`
	Details     string    `json:"details"`
	GoalsAdded  int       `json:"goalsAdded"`
	Source      string    `json:"source"`
}

// GetDataCompletenessReport generates a comprehensive data completeness report
func (h *Handler) GetDataCompletenessReport(w http.ResponseWriter, r *http.Request) {
	log.Println("🔍 Generating live data completeness report...")

	// Generate season-by-season analysis
	seasonData, err := h.getSeasonCompleteness()
	if err != nil {
		log.Printf("❌ Error getting season completeness: %v", err)
		http.Error(w, "Error generating season data", http.StatusInternalServerError)
		return
	}

	// Calculate overall statistics
	overallStats := h.calculateOverallStats(seasonData)

	// Generate era statistics
	eraStats := h.generateEraStats(seasonData)

	// Get best and worst seasons
	bestSeasons, worstSeasons := h.getBestAndWorstSeasons(seasonData)

	// Get recent activity
	recentActivity, err := h.getRecentActivity()
	if err != nil {
		log.Printf("⚠️ Error getting recent activity: %v", err)
		// Continue without recent activity rather than fail
		recentActivity = []ActivityLog{}
	}

	report := DataCompletenessReport{
		OverallStats:   overallStats,
		SeasonData:     seasonData,
		EraStats:       eraStats,
		BestSeasons:    bestSeasons,
		WorstSeasons:   worstSeasons,
		RecentActivity: recentActivity,
		GeneratedAt:    time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-cache")
	
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    report,
	}); err != nil {
		log.Printf("❌ Error encoding report response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}

	log.Printf("✅ Data completeness report generated successfully with %d seasons", len(seasonData))
}

// getSeasonCompleteness retrieves detailed completeness data for each season
func (h *Handler) getSeasonCompleteness() ([]SeasonCompleteness, error) {
	query := `
		SELECT 
			s.id,
			s.year,
			s.name,
			COUNT(DISTINCT m.id) as total_matches,
			COUNT(DISTINCT CASE WHEN m.home_score IS NOT NULL AND m.away_score IS NOT NULL THEN m.id END) as matches_with_scores,
			COUNT(DISTINCT CASE WHEN g.id IS NOT NULL THEN m.id END) as matches_with_goals,
			COUNT(g.id) as total_goals,
			COUNT(DISTINCT g.player_id) as unique_players,
			COUNT(DISTINCT CASE WHEN m.home_team_id IS NOT NULL THEN m.home_team_id END) + 
			COUNT(DISTINCT CASE WHEN m.away_team_id IS NOT NULL THEN m.away_team_id END) as teams_count,
			MIN(m.match_date) as season_start,
			MAX(m.match_date) as season_end,
			MAX(COALESCE(g.created_at, m.created_at, s.created_at)) as last_updated
		FROM seasons s
		LEFT JOIN matches m ON s.id = m.season_id
		LEFT JOIN goals g ON m.id = g.match_id
		GROUP BY s.id, s.year, s.name
		ORDER BY s.year
	`

	rows, err := h.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var seasons []SeasonCompleteness
	for rows.Next() {
		var season SeasonCompleteness
		var teamsCount int
		
		err := rows.Scan(
			&season.ID,
			&season.Year,
			&season.Name,
			&season.TotalMatches,
			&season.MatchesWithScores,
			&season.MatchesWithGoals,
			&season.TotalGoals,
			&season.UniquePlayers,
			&teamsCount,
			&season.SeasonStart,
			&season.SeasonEnd,
			&season.LastUpdated,
		)
		if err != nil {
			log.Printf("⚠️ Error scanning season row: %v", err)
			continue
		}

		// Calculate derived metrics
		season.TeamsCount = teamsCount / 2 // Divide by 2 since we count home and away separately
		season.ExpectedMatches = getExpectedMatchesForSeason(season.Year)
		
		if season.TotalMatches > 0 {
			season.MatchCompleteness = float64(season.MatchesWithScores) / float64(season.TotalMatches) * 100
			season.GoalCompleteness = float64(season.MatchesWithGoals) / float64(season.TotalMatches) * 100
		}
		
		if season.ExpectedMatches > 0 {
			season.SeasonProgress = float64(season.TotalMatches) / float64(season.ExpectedMatches) * 100
		}

		// Determine quality level
		season.QualityLevel, season.QualityIcon = getQualityLevel(season.GoalCompleteness)

		seasons = append(seasons, season)
	}

	return seasons, nil
}

// calculateOverallStats computes overall statistics from season data
func (h *Handler) calculateOverallStats(seasons []SeasonCompleteness) OverallStats {
	stats := OverallStats{
		TotalSeasons:    len(seasons),
		LastUpdated:     time.Now(),
	}

	var totalMatchCompleteness, totalGoalCompleteness float64
	seasonsWithData := 0

	for _, season := range seasons {
		stats.TotalMatches += season.TotalMatches
		stats.TotalGoals += season.TotalGoals
		stats.TotalPlayers += season.UniquePlayers

		if season.TotalMatches > 0 {
			stats.SeasonsWithData++
			seasonsWithData++
			totalMatchCompleteness += season.MatchCompleteness
			totalGoalCompleteness += season.GoalCompleteness
		}

		switch season.QualityLevel {
		case "Excellent":
			stats.ExcellentSeasons++
		case "Good":
			stats.GoodSeasons++
		case "Partial":
			stats.PartialSeasons++
		case "Minimal":
			stats.MinimalSeasons++
		case "No Data":
			stats.NoDataSeasons++
		}
	}

	if seasonsWithData > 0 {
		stats.AvgMatchCompleteness = totalMatchCompleteness / float64(seasonsWithData)
		stats.AvgGoalCompleteness = totalGoalCompleteness / float64(seasonsWithData)
	}

	return stats
}

// generateEraStats calculates statistics by era
func (h *Handler) generateEraStats(seasons []SeasonCompleteness) []EraStats {
	eras := []struct {
		name      string
		yearRange string
		startYear int
		endYear   int
	}{
		{"Early Premier League", "1992-1999", 1992, 1999},
		{"Golden Era", "2000-2009", 2000, 2009},
		{"Modern Era", "2010-2019", 2010, 2019},
		{"Recent Era", "2020-2025", 2020, 2025},
	}

	var eraStats []EraStats
	for _, era := range eras {
		var eraSeasons []SeasonCompleteness
		for _, season := range seasons {
			if season.Year >= era.startYear && season.Year <= era.endYear {
				eraSeasons = append(eraSeasons, season)
			}
		}

		stat := EraStats{
			Name:        era.name,
			YearRange:   era.yearRange,
			SeasonsTotal: len(eraSeasons),
		}

		var totalGoalCompleteness float64
		for _, season := range eraSeasons {
			stat.TotalGoals += season.TotalGoals
			stat.TotalMatches += season.TotalMatches
			if season.TotalMatches > 0 {
				stat.SeasonsWithData++
				totalGoalCompleteness += season.GoalCompleteness
			}
		}

		if stat.SeasonsWithData > 0 {
			stat.AvgGoalCompleteness = totalGoalCompleteness / float64(stat.SeasonsWithData)
		}

		eraStats = append(eraStats, stat)
	}

	return eraStats
}

// getBestAndWorstSeasons returns the best and worst seasons by goal completeness
func (h *Handler) getBestAndWorstSeasons(seasons []SeasonCompleteness) ([]SeasonCompleteness, []SeasonCompleteness) {
	// Filter seasons with data
	var seasonsWithData []SeasonCompleteness
	for _, season := range seasons {
		if season.TotalMatches > 0 {
			seasonsWithData = append(seasonsWithData, season)
		}
	}

	// Sort by goal completeness (descending for best, ascending for worst)
	bestSeasons := make([]SeasonCompleteness, len(seasonsWithData))
	worstSeasons := make([]SeasonCompleteness, len(seasonsWithData))
	copy(bestSeasons, seasonsWithData)
	copy(worstSeasons, seasonsWithData)

	// Simple bubble sort for best seasons (descending)
	for i := 0; i < len(bestSeasons)-1; i++ {
		for j := 0; j < len(bestSeasons)-i-1; j++ {
			if bestSeasons[j].GoalCompleteness < bestSeasons[j+1].GoalCompleteness {
				bestSeasons[j], bestSeasons[j+1] = bestSeasons[j+1], bestSeasons[j]
			}
		}
	}

	// Simple bubble sort for worst seasons (ascending)
	for i := 0; i < len(worstSeasons)-1; i++ {
		for j := 0; j < len(worstSeasons)-i-1; j++ {
			if worstSeasons[j].GoalCompleteness > worstSeasons[j+1].GoalCompleteness {
				worstSeasons[j], worstSeasons[j+1] = worstSeasons[j+1], worstSeasons[j]
			}
		}
	}

	// Return top 5 of each
	bestCount := 5
	if len(bestSeasons) < 5 {
		bestCount = len(bestSeasons)
	}
	worstCount := 5
	if len(worstSeasons) < 5 {
		worstCount = len(worstSeasons)
	}

	return bestSeasons[:bestCount], worstSeasons[:worstCount]
}

// getRecentActivity retrieves recent data import activity
func (h *Handler) getRecentActivity() ([]ActivityLog, error) {
	query := `
		SELECT 
			g.created_at,
			'Goal Import' as activity,
			s.name as season,
			'Goals added to ' || ht.name || ' vs ' || at.name as details,
			COUNT(*) as goals_added,
			'6 Sigma Processing' as source
		FROM goals g
		JOIN matches m ON g.match_id = m.id
		JOIN seasons s ON m.season_id = s.id
		JOIN teams ht ON m.home_team_id = ht.id
		JOIN teams at ON m.away_team_id = at.id
		WHERE g.created_at >= NOW() - INTERVAL '7 days'
		GROUP BY g.created_at, s.name, ht.name, at.name
		ORDER BY g.created_at DESC
		LIMIT 20
	`

	rows, err := h.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var activities []ActivityLog
	for rows.Next() {
		var activity ActivityLog
		err := rows.Scan(
			&activity.Date,
			&activity.Activity,
			&activity.Season,
			&activity.Details,
			&activity.GoalsAdded,
			&activity.Source,
		)
		if err != nil {
			log.Printf("⚠️ Error scanning activity row: %v", err)
			continue
		}
		activities = append(activities, activity)
	}

	return activities, nil
}

// Helper functions

func getExpectedMatchesForSeason(year int) int {
	if year >= 1992 && year <= 1994 {
		return 462 // 22 teams, 42 matches each
	}
	if year >= 1995 && year <= 2024 {
		return 380 // 20 teams, 38 matches each
	}
	if year >= 2025 {
		return 380 // Projected for future seasons
	}
	return 0 // Pre-Premier League
}

func getQualityLevel(goalCompleteness float64) (string, string) {
	if goalCompleteness >= 95 {
		return "Excellent", "🌟"
	} else if goalCompleteness >= 80 {
		return "Good", "✅"
	} else if goalCompleteness >= 50 {
		return "Partial", "🔄"
	} else if goalCompleteness > 0 {
		return "Minimal", "⚠️"
	}
	return "No Data", "❌"
}

// GetSeasonCompleteness returns completeness data for a specific season
func (h *Handler) GetSeasonCompleteness(w http.ResponseWriter, r *http.Request) {
	yearStr := r.URL.Query().Get("year")
	if yearStr == "" {
		http.Error(w, "Year parameter required", http.StatusBadRequest)
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		http.Error(w, "Invalid year parameter", http.StatusBadRequest)
		return
	}

	// Get all seasons to find the specific one
	seasons, err := h.getSeasonCompleteness()
	if err != nil {
		log.Printf("❌ Error getting season completeness: %v", err)
		http.Error(w, "Error retrieving season data", http.StatusInternalServerError)
		return
	}

	// Find the requested season
	var targetSeason *SeasonCompleteness
	for _, season := range seasons {
		if season.Year == year {
			targetSeason = &season
			break
		}
	}

	if targetSeason == nil {
		http.Error(w, "Season not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    targetSeason,
	}); err != nil {
		log.Printf("❌ Error encoding season response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}