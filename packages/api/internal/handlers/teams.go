package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/premstats/api/internal/models"
	"github.com/premstats/api/internal/services"
)

// TeamHandler handles team-related HTTP requests
type TeamHandler struct {
	teamService *services.TeamService
}

// NewTeamHandler creates a new team handler
func NewTeamHandler(teamService *services.TeamService) *TeamHandler {
	return &TeamHandler{teamService: teamService}
}

// GetTeams handles GET /api/v1/teams
func (h *TeamHandler) GetTeams(w http.ResponseWriter, r *http.Request) {
	seasonIDStr := r.URL.Query().Get("season")
	if seasonIDStr != "" {
		// If season specified, delegate to GetTeamsBySeasonID
		h.GetTeamsBySeasonID(w, r)
		return
	}

	teams, err := h.teamService.GetAllTeams()
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch teams", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    map[string]interface{}{"teams": teams},
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetTeamByID handles GET /api/v1/teams/{id}
func (h *TeamHandler) GetTeamByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	teamID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid team ID", err)
		return
	}

	team, err := h.teamService.GetTeamByID(teamID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Team not found", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    team,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetTeamsBySeasonID handles GET /api/v1/teams?season={seasonId}
func (h *TeamHandler) GetTeamsBySeasonID(w http.ResponseWriter, r *http.Request) {
	seasonIDStr := r.URL.Query().Get("season")
	if seasonIDStr == "" {
		// If no season specified, return all teams
		h.GetTeams(w, r)
		return
	}

	seasonID, err := strconv.Atoi(seasonIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid season ID", err)
		return
	}

	teams, err := h.teamService.GetTeamsBySeasonID(seasonID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch teams for season", err)
		return
	}

	response := models.APIResponse{
		Success: true,
		Data:    map[string]interface{}{"teams": teams, "seasonId": seasonID},
	}

	respondWithJSON(w, http.StatusOK, response)
}
