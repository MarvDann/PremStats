package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/premstats/api/internal/models"
	"github.com/premstats/api/internal/services"
)

// SeasonHandler handles season-related HTTP requests
type SeasonHandler struct {
	seasonService *services.SeasonService
}

// NewSeasonHandler creates a new season handler
func NewSeasonHandler(seasonService *services.SeasonService) *SeasonHandler {
	return &SeasonHandler{seasonService: seasonService}
}

// GetSeasons handles GET /api/v1/seasons
func (h *SeasonHandler) GetSeasons(w http.ResponseWriter, r *http.Request) {
	seasons, err := h.seasonService.GetAllSeasons()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch seasons", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    map[string]interface{}{"seasons": seasons},
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetSeasonByID handles GET /api/v1/seasons/{id}
func (h *SeasonHandler) GetSeasonByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	seasonID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	season, err := h.seasonService.GetSeasonByID(seasonID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Season not found", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    season,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetSeasonSummary handles GET /api/v1/seasons/{id}/summary
func (h *SeasonHandler) GetSeasonSummary(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	seasonID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	summary, err := h.seasonService.GetSeasonSummary(seasonID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch season summary", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    summary,
	}

	respondWithJSON(w, http.StatusOK, response)
}
