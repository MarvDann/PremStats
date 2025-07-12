package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/premstats/api/internal/models"
	"github.com/premstats/api/internal/services"
)

// PlayerHandler handles player-related HTTP requests
type PlayerHandler struct {
	service *services.PlayerService
}

// NewPlayerHandler creates a new player handler instance
func NewPlayerHandler(service *services.PlayerService) *PlayerHandler {
	return &PlayerHandler{service: service}
}

// GetPlayers handles GET /api/v1/players
func (h *PlayerHandler) GetPlayers(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	search := r.URL.Query().Get("search")
	position := r.URL.Query().Get("position")
	nationality := r.URL.Query().Get("nationality")
	team := r.URL.Query().Get("team")

	// Get players from service
	players, err := h.service.GetPlayers(limit, offset, search, position, nationality, team)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Failed to fetch players",
		})
		return
	}

	// Get total count for pagination
	total, err := h.service.GetPlayersCount(search, position, nationality, team)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Failed to count players",
		})
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"players": players,
			"total":   total,
			"filters": map[string]interface{}{
				"limit":       limit,
				"offset":      offset,
				"search":      search,
				"position":    position,
				"nationality": nationality,
				"team":        team,
			},
		},
	})
}

// GetPlayerByID handles GET /api/v1/players/{id}
func (h *PlayerHandler) GetPlayerByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Invalid player ID",
		})
		return
	}

	player, err := h.service.GetPlayerByID(id)
	if err != nil {
		if err.Error() == "player not found" {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(models.APIResponse{
				Success: false,
				Error:   "Player not found",
			})
			return
		}
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Failed to fetch player",
		})
		return
	}

	// Get player stats
	seasonID, _ := strconv.Atoi(r.URL.Query().Get("season"))
	stats, _ := h.service.GetPlayerStats(id, seasonID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"player": player,
			"stats":  stats,
		},
	})
}

// GetTopScorers handles GET /api/v1/stats/top-scorers
func (h *PlayerHandler) GetTopScorers(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	seasonID, _ := strconv.Atoi(r.URL.Query().Get("season"))
	if seasonID <= 0 {
		// Default to current season (2024/25 = ID 33)
		seasonID = 33
	}
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	// Get top scorers from service
	scorers, err := h.service.GetTopScorers(seasonID, limit)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Failed to fetch top scorers",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"topScorers": scorers,
			"seasonId":   seasonID,
			"limit":      limit,
		},
	})
}

// SearchPlayers handles GET /api/v1/search
func (h *PlayerHandler) SearchPlayers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Search query is required",
		})
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	results, err := h.service.SearchPlayers(query, limit)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Search failed",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"results": results,
			"query":   query,
			"count":   len(results),
		},
	})
}

// GetPlayerPositions handles GET /api/v1/players/positions
func (h *PlayerHandler) GetPlayerPositions(w http.ResponseWriter, r *http.Request) {
	positions, err := h.service.GetPlayerPositions()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Failed to fetch positions",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"positions": positions,
		},
	})
}

// GetPlayerNationalities handles GET /api/v1/players/nationalities
func (h *PlayerHandler) GetPlayerNationalities(w http.ResponseWriter, r *http.Request) {
	nationalities, err := h.service.GetPlayerNationalities()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(models.APIResponse{
			Success: false,
			Error:   "Failed to fetch nationalities",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"nationalities": nationalities,
		},
	})
}