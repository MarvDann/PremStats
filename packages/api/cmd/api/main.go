package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/premstats/api/internal/database"
	"github.com/premstats/api/internal/handlers"
	"github.com/premstats/api/internal/services"
	"github.com/rs/cors"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// Initialize database connection
	db, err := database.NewConnection()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize services
	teamService := services.NewTeamService(db)
	matchService := services.NewMatchService(db)
	standingsService := services.NewStandingsService(db)
	seasonService := services.NewSeasonService(db)
	playerService := services.NewPlayerService(db)

	// Initialize handlers
	teamHandler := handlers.NewTeamHandler(teamService)
	matchHandler := handlers.NewMatchHandler(matchService)
	standingsHandler := handlers.NewStandingsHandler(standingsService)
	seasonHandler := handlers.NewSeasonHandler(seasonService)
	playerHandler := handlers.NewPlayerHandler(playerService)
	reportsHandler := &handlers.Handler{DB: db}

	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api/v1").Subrouter()

	// Health check
	api.HandleFunc("/health", handlers.HealthHandler).Methods("GET")

	// Teams endpoints
	api.HandleFunc("/teams", teamHandler.GetTeams).Methods("GET")
	api.HandleFunc("/teams/{id:[0-9]+}", teamHandler.GetTeamByID).Methods("GET")

	// Seasons endpoints
	api.HandleFunc("/seasons", seasonHandler.GetSeasons).Methods("GET")
	api.HandleFunc("/seasons/{id:[0-9]+}", seasonHandler.GetSeasonByID).Methods("GET")
	api.HandleFunc("/seasons/{id:[0-9]+}/summary", seasonHandler.GetSeasonSummary).Methods("GET")

	// Matches endpoints
	api.HandleFunc("/matches", matchHandler.GetMatches).Methods("GET")
	api.HandleFunc("/matches/{id:[0-9]+}", matchHandler.GetMatchByID).Methods("GET")
	api.HandleFunc("/matches/{id:[0-9]+}/events", matchHandler.GetMatchEvents).Methods("GET")
	api.HandleFunc("/matches/season/{seasonId:[0-9]+}", matchHandler.GetMatchesBySeason).Methods("GET")

	// Standings endpoints
	api.HandleFunc("/standings", standingsHandler.GetStandings).Methods("GET")
	api.HandleFunc("/standings/{seasonId:[0-9]+}", standingsHandler.GetStandingsBySeasonID).Methods("GET")
	api.HandleFunc("/standings/seasons", standingsHandler.GetAvailableSeasons).Methods("GET")
	api.HandleFunc("/standings/team/{teamId:[0-9]+}/season/{seasonId:[0-9]+}", standingsHandler.GetTeamStats).Methods("GET")

	// Statistics endpoints (legacy compatibility)
	api.HandleFunc("/stats/standings", standingsHandler.GetStandings).Methods("GET")
	api.HandleFunc("/stats/top-scorers", playerHandler.GetTopScorers).Methods("GET")

	// Player endpoints
	api.HandleFunc("/players", playerHandler.GetPlayers).Methods("GET")
	api.HandleFunc("/players/{id:[0-9]+}", playerHandler.GetPlayerByID).Methods("GET")
	api.HandleFunc("/players/positions", playerHandler.GetPlayerPositions).Methods("GET")
	api.HandleFunc("/players/nationalities", playerHandler.GetPlayerNationalities).Methods("GET")

	// Search endpoint
	api.HandleFunc("/search", playerHandler.SearchPlayers).Methods("GET")

	// Reports endpoints
	api.HandleFunc("/reports/data-completeness", reportsHandler.GetDataCompletenessReport).Methods("GET")
	api.HandleFunc("/reports/season-completeness", reportsHandler.GetSeasonCompleteness).Methods("GET")

	// Natural language query endpoint (placeholder)
	api.HandleFunc("/query", queryHandler).Methods("POST")

	// Set up error handlers
	router.NotFoundHandler = http.HandlerFunc(handlers.NotFoundHandler)
	router.MethodNotAllowedHandler = http.HandlerFunc(handlers.MethodNotAllowedHandler)

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
