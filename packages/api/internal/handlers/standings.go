package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/premstats/api/internal/models"
	"github.com/premstats/api/internal/services"
)

// StandingsHandler handles standings-related HTTP requests
type StandingsHandler struct {
	standingsService *services.StandingsService
}

// NewStandingsHandler creates a new standings handler
func NewStandingsHandler(standingsService *services.StandingsService) *StandingsHandler {
	return &StandingsHandler{standingsService: standingsService}
}

// GetStandings handles GET /api/v1/standings
func (h *StandingsHandler) GetStandings(w http.ResponseWriter, r *http.Request) {
	seasonIDStr := r.URL.Query().Get("season")
	if seasonIDStr == "" {
		// If no season specified, return available seasons
		h.GetAvailableSeasons(w, r)
		return
	}

	seasonID, err := strconv.Atoi(seasonIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	standings, err := h.standingsService.GetStandingsBySeasonID(seasonID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch standings", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    standings,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetStandingsBySeasonID handles GET /api/v1/standings/{seasonId}
func (h *StandingsHandler) GetStandingsBySeasonID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	seasonID, err := strconv.Atoi(vars["seasonId"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	standings, err := h.standingsService.GetStandingsBySeasonID(seasonID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch standings", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    standings,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetAvailableSeasons handles GET /api/v1/standings/seasons
func (h *StandingsHandler) GetAvailableSeasons(w http.ResponseWriter, r *http.Request) {
	seasons, err := h.standingsService.GetAvailableSeasons()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch available seasons", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    map[string]interface{}{"seasons": seasons},
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetTeamStats handles GET /api/v1/standings/team/{teamId}/season/{seasonId}
func (h *StandingsHandler) GetTeamStats(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	teamID, err := strconv.Atoi(vars["teamId"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid team ID", err)
		return
	}

	seasonID, err := strconv.Atoi(vars["seasonId"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	stats, err := h.standingsService.GetTeamStatsForSeason(teamID, seasonID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch team stats", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    stats,
	}

	respondWithJSON(w, http.StatusOK, response)
}
