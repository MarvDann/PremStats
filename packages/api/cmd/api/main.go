package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := mux.NewRouter()
	
	// API routes
	api := router.PathPrefix("/api/v1").Subrouter()
	
	// Health check
	api.HandleFunc("/health", healthHandler).Methods("GET")
	
	// Teams endpoints
	api.HandleFunc("/teams", getTeamsHandler).Methods("GET")
	api.HandleFunc("/teams/{id}", getTeamHandler).Methods("GET")
	
	// Players endpoints
	api.HandleFunc("/players", getPlayersHandler).Methods("GET")
	api.HandleFunc("/players/{id}", getPlayerHandler).Methods("GET")
	
	// Matches endpoints
	api.HandleFunc("/matches", getMatchesHandler).Methods("GET")
	api.HandleFunc("/matches/{id}", getMatchHandler).Methods("GET")
	
	// Statistics endpoints
	api.HandleFunc("/stats/top-scorers", getTopScorersHandler).Methods("GET")
	api.HandleFunc("/stats/standings", getStandingsHandler).Methods("GET")
	
	// Natural language query endpoint
	api.HandleFunc("/query", queryHandler).Methods("POST")

	// CORS middleware
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(router)

	fmt.Printf("🚀 PremStats API server starting on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status": "healthy", "service": "premstats-api"}`)
}

func getTeamsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"teams": [
			{"id": 1, "name": "Arsenal", "shortName": "ARS", "stadium": "Emirates Stadium"},
			{"id": 2, "name": "Chelsea", "shortName": "CHE", "stadium": "Stamford Bridge"},
			{"id": 3, "name": "Liverpool", "shortName": "LIV", "stadium": "Anfield"},
			{"id": 4, "name": "Manchester City", "shortName": "MCI", "stadium": "Etihad Stadium"},
			{"id": 5, "name": "Manchester United", "shortName": "MUN", "stadium": "Old Trafford"}
		]
	}`)
}

func getTeamHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	teamID := vars["id"]
	
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"id": %s,
		"name": "Arsenal",
		"shortName": "ARS",
		"stadium": "Emirates Stadium",
		"founded": 1886
	}`, teamID)
}

func getPlayersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"players": [
			{"id": 1, "name": "Bukayo Saka", "position": "RW", "team": "Arsenal"},
			{"id": 2, "name": "Erling Haaland", "position": "ST", "team": "Manchester City"},
			{"id": 3, "name": "Mohamed Salah", "position": "RW", "team": "Liverpool"}
		]
	}`)
}

func getPlayerHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	playerID := vars["id"]
	
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"id": %s,
		"name": "Bukayo Saka",
		"position": "RW",
		"team": "Arsenal",
		"goals": 12,
		"assists": 8
	}`, playerID)
}

func getMatchesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"matches": [
			{
				"id": 1,
				"homeTeam": "Arsenal",
				"awayTeam": "Chelsea",
				"homeScore": 2,
				"awayScore": 1,
				"date": "2024-01-15T15:00:00Z",
				"status": "completed"
			},
			{
				"id": 2,
				"homeTeam": "Liverpool",
				"awayTeam": "Manchester City",
				"homeScore": 1,
				"awayScore": 1,
				"date": "2024-01-16T17:30:00Z",
				"status": "completed"
			}
		]
	}`)
}

func getMatchHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	matchID := vars["id"]
	
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"id": %s,
		"homeTeam": "Arsenal",
		"awayTeam": "Chelsea",
		"homeScore": 2,
		"awayScore": 1,
		"date": "2024-01-15T15:00:00Z",
		"status": "completed"
	}`, matchID)
}

func getTopScorersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"topScorers": [
			{"player": "Erling Haaland", "team": "Manchester City", "goals": 15},
			{"player": "Mohamed Salah", "team": "Liverpool", "goals": 12},
			{"player": "Bukayo Saka", "team": "Arsenal", "goals": 10}
		]
	}`)
}

func getStandingsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"standings": [
			{"position": 1, "team": "Arsenal", "played": 20, "points": 45, "goalDifference": 15},
			{"position": 2, "team": "Liverpool", "played": 20, "points": 44, "goalDifference": 12},
			{"position": 3, "team": "Manchester City", "played": 20, "points": 43, "goalDifference": 18}
		]
	}`)
}

func queryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
		"query": "Who is the top scorer?",
		"answer": "Erling Haaland is currently the top scorer with 15 goals",
		"data": {
			"player": "Erling Haaland",
			"team": "Manchester City",
			"goals": 15
		}
	}`)
}