package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/premstats/api/internal/models"
)

// respondWithJSON writes a JSON response
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// respondWithError writes an error response
func respondWithError(w http.ResponseWriter, code int, message string, err error) {
	log.Printf("API Error: %s - %v", message, err)

	response := models.APIResponse{
		Success: false,
		Error:   message,
	}

	respondWithJSON(w, code, response)
}

// HealthHandler handles health check requests
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	response := models.APIResponse{
		Success: true,
		Data: map[string]interface{}{
			"status":  "healthy",
			"service": "premstats-api",
			"version": "1.0.0",
		},
		Message: "PremStats API is running",
	}

	respondWithJSON(w, http.StatusOK, response)
}

// NotFoundHandler handles 404 errors
func NotFoundHandler(w http.ResponseWriter, r *http.Request) {
	response := models.APIResponse{
		Success: false,
		Error:   fmt.Sprintf("Endpoint not found: %s %s", r.Method, r.URL.Path),
	}

	respondWithJSON(w, http.StatusNotFound, response)
}

// MethodNotAllowedHandler handles 405 errors
func MethodNotAllowedHandler(w http.ResponseWriter, r *http.Request) {
	response := models.APIResponse{
		Success: false,
		Error:   fmt.Sprintf("Method %s not allowed for endpoint %s", r.Method, r.URL.Path),
	}

	respondWithJSON(w, http.StatusMethodNotAllowed, response)
}
