# PremStats API Documentation

## Base URL
```
http://localhost:8081/api/v1
```

## Authentication
Currently, no authentication is required for API access.

## Response Format
All responses follow this structure:
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string (only on errors)
}
```

## Endpoints

### Health Check
**GET** `/health`

Returns API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "premstats-api",
    "status": "healthy",
    "version": "1.0.0"
  },
  "message": "PremStats API is running"
}
```

### Seasons

#### Get All Seasons
**GET** `/seasons`

Returns all Premier League seasons in the database.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "1993/94"
    }
  ]
}
```

#### Get Season by ID
**GET** `/seasons/{id}`

Returns specific season details.

**Parameters:**
- `id` (path): Season ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "1993/94"
  }
}
```

#### Get Season Summary
**GET** `/seasons/{id}/summary`

Returns season statistics and summary information.

**Parameters:**
- `id` (path): Season ID

**Response:**
```json
{
  "success": true,
  "data": {
    "seasonId": 19,
    "season": "2008/09",
    "totalMatches": 380,
    "totalGoals": 942,
    "avgGoalsPerMatch": 2.48,
    "champion": "Manchester United FC",
    "relegated": ["West Bromwich Albion FC", "Middlesbrough FC", "Newcastle United FC"]
  }
}
```

### Teams

#### Get All Teams
**GET** `/teams`

Returns all teams. Optionally filter by season.

**Query Parameters:**
- `season` (optional): Season ID to filter teams

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "name": "Manchester United FC",
      "shortName": "MUN",
      "stadium": "Old Trafford",
      "founded": 1878
    }
  ]
}
```

#### Get Team by ID
**GET** `/teams/{id}`

Returns specific team details.

**Parameters:**
- `id` (path): Team ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Manchester United FC",
    "shortName": "MUN",
    "stadium": "Old Trafford",
    "founded": 1878
  }
}
```

### Matches

#### Get Matches
**GET** `/matches`

Returns matches with optional filtering.

**Query Parameters:**
- `season` (optional): Season ID
- `team` (optional): Team ID (returns matches where team played)
- `limit` (optional): Number of matches to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "seasonId": 3,
      "homeTeamId": 8,
      "awayTeamId": 1,
      "homeTeam": "Manchester United FC",
      "awayTeam": "Arsenal FC",
      "homeScore": 2,
      "awayScore": 1,
      "halfTimeHome": 1,
      "halfTimeAway": 0,
      "matchDate": "1993-08-14T14:00:00Z",
      "referee": "Graham Poll",
      "status": "completed"
    }
  ]
}
```

#### Get Match by ID
**GET** `/matches/{id}`

Returns specific match details.

**Parameters:**
- `id` (path): Match ID

#### Get Matches by Season
**GET** `/matches/season/{seasonId}`

Returns all matches for a specific season.

**Parameters:**
- `seasonId` (path): Season ID

### Standings

#### Get Standings
**GET** `/standings`

Returns league standings. Requires season parameter.

**Query Parameters:**
- `season` (required): Season ID

**Response:**
```json
{
  "success": true,
  "data": {
    "seasonId": 3,
    "season": "1993/94",
    "table": [
      {
        "position": 1,
        "team": "Manchester United FC",
        "teamId": 8,
        "played": 42,
        "won": 27,
        "drawn": 11,
        "lost": 4,
        "goalsFor": 80,
        "goalsAgainst": 38,
        "goalDifference": 42,
        "points": 92
      }
    ]
  }
}
```

#### Get Standings by Season ID
**GET** `/standings/{seasonId}`

Returns league standings for specific season.

**Parameters:**
- `seasonId` (path): Season ID

#### Get Available Seasons
**GET** `/standings/seasons`

Returns all seasons that have standings data available.

#### Get Team Season Stats
**GET** `/standings/team/{teamId}/season/{seasonId}`

Returns specific team's performance for a season.

**Parameters:**
- `teamId` (path): Team ID
- `seasonId` (path): Season ID

**Response:**
```json
{
  "success": true,
  "data": {
    "teamId": 8,
    "team": "Manchester United FC",
    "seasonId": 3,
    "season": "1993/94",
    "position": 1,
    "played": 42,
    "won": 27,
    "drawn": 11,
    "lost": 4,
    "goalsFor": 80,
    "goalsAgainst": 38,
    "goalDifference": 42,
    "points": 92
  }
}
```

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "error": "Resource not found",
  "message": "The requested resource could not be found"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "error": "Bad request",
  "message": "Invalid parameters provided"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting
Currently, no rate limiting is implemented. This may be added in future versions.

## CORS
CORS is enabled for all origins in development. In production, this should be restricted to specific domains.

## Data Freshness
- Historical data (1992/93 - 2023/24): Static, updated when new seasons are imported
- Current season data: Updated regularly via automated refresh system
- Live match data: Not currently supported

## Example Usage

### Get Current Season Standings
```bash
curl "http://localhost:8081/api/v1/standings?season=4"
```

### Get Team's Matches
```bash
curl "http://localhost:8081/api/v1/matches?team=8&season=3&limit=10"
```

### Get Season Summary
```bash
curl "http://localhost:8081/api/v1/seasons/19/summary"
```

## Database Schema
The API is built on a PostgreSQL database with the following key tables:
- `seasons`: Premier League seasons
- `teams`: All teams that have played in the Premier League
- `matches`: Historical and current match data
- `players`: Player information (future feature)
- `goals`: Goal events (future feature)

## Future Enhancements
- Player statistics endpoints
- Goal scorer data
- Transfer information
- Team comparison endpoints
- Advanced statistics and analytics
- Real-time match updates
- Webhook notifications