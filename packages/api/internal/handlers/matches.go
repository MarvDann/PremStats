package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/premstats/api/internal/models"
	"github.com/premstats/api/internal/services"
)

// MatchHandler handles match-related HTTP requests
type MatchHandler struct {
	matchService *services.MatchService
}

// NewMatchHandler creates a new match handler
func NewMatchHandler(matchService *services.MatchService) *MatchHandler {
	return &MatchHandler{matchService: matchService}
}

// GetMatches handles GET /api/v1/matches
func (h *MatchHandler) GetMatches(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	seasonIDStr := r.URL.Query().Get("season")
	teamIDStr := r.URL.Query().Get("team")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	var seasonID, teamID, limit, offset int
	var err error

	if seasonIDStr != "" {
		seasonID, err = strconv.Atoi(seasonIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
			return
		}
	}

	if teamIDStr != "" {
		teamID, err = strconv.Atoi(teamIDStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid team ID", err)
			return
		}
	}

	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid limit", err)
			return
		}
	} else {
		limit = 50 // Default limit
	}

	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid offset", err)
			return
		}
	}

	matches, err := h.matchService.GetMatches(teamID, seasonID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch matches", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"matches": matches,
			"filters": map[string]interface{}{
				"season": seasonID,
				"team":   teamID,
				"limit":  limit,
				"offset": offset,
			},
		},
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetMatchByID handles GET /api/v1/matches/{id}
func (h *MatchHandler) GetMatchByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	matchID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid match ID", err)
		return
	}

	match, err := h.matchService.GetMatchByID(matchID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Match not found", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    match,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetMatchesBySeason handles GET /api/v1/matches/season/{seasonId}
func (h *MatchHandler) GetMatchesBySeason(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	seasonID, err := strconv.Atoi(vars["seasonId"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	// Parse pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // Default limit
	offset := 0 // Default offset

	if limitStr != "" {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid limit", err)
			return
		}
	}

	if offsetStr != "" {
		offset, err = strconv.Atoi(offsetStr)
		if err != nil {
			respondWithError(w, http.StatusBadRequest, "Invalid offset", err)
			return
		}
	}

	matches, err := h.matchService.GetMatchesBySeasonID(seasonID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch matches for season", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"matches":  matches,
			"seasonId": seasonID,
			"pagination": map[string]interface{}{
				"limit":  limit,
				"offset": offset,
			},
		},
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetMatchEvents handles GET /api/v1/matches/{id}/events
func (h *MatchHandler) GetMatchEvents(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid match ID", err)
		return
	}

	events, err := h.matchService.GetMatchEvents(id)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch match events", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"events": events,
		},
	}

	respondWithJSON(w, http.StatusOK, response)
}
