import fetch from 'node-fetch'
import chalk from 'chalk'
import csv from 'csv-parser'
import { Readable } from 'stream'

export class HistoricalCSVScraper {
  constructor(pool) {
    this.pool = pool
    this.baseUrl = 'https://www.football-data.co.uk/mmz4281'
    this.teamMappings = {
      // Handle team name variations - normalize TO short versions
      'Man United': 'Manchester United',
      'Man City': 'Manchester City',
      'Newcastle': 'Newcastle United',
      'Tottenham': 'Tottenham',
      'Sheff Utd': 'Sheffield United',
      'Sheffield United': 'Sheffield United',
      'Sheff Wed': 'Sheffield Wednesday',
      'Sheffield Weds': 'Sheffield Wednesday',
      'Nottm Forest': 'Nottingham Forest',
      'Nott\'m Forest': 'Nottingham Forest',
      'Leicester': 'Leicester City',
      'Leeds': 'Leeds United',
      'Wolves': 'Wolverhampton Wanderers',
      'West Ham': 'West Ham United',
      'West Brom': 'West Bromwich Albion',
      'Stoke': 'Stoke City',
      'Swansea': 'Swansea City',
      'Norwich': 'Norwich City',
      'Fulham': 'Fulham',
      'Cardiff': 'Cardiff City',
      'Hull': 'Hull City',
      'Birmingham': 'Birmingham City',
      'Blackburn': 'Blackburn Rovers',
      'Bolton': 'Bolton Wanderers',
      'Middlesbrough': 'Middlesbrough',
      'Middlesboro': 'Middlesbrough',
      'QPR': 'Queens Park Rangers',
      'Brighton': 'Brighton & Hove Albion',
      'Burnley': 'Burnley',
      'Huddersfield': 'Huddersfield Town',
      'Bournemouth': 'Bournemouth',
      // Standard names (already short versions)
      'Arsenal': 'Arsenal',
      'Chelsea': 'Chelsea',
      'Liverpool': 'Liverpool',
      'Everton': 'Everton',
      'Southampton': 'Southampton',
      'Coventry': 'Coventry City',
      'Oldham': 'Oldham Athletic',
      'Ipswich': 'Ipswich Town',
      'Swindon': 'Swindon Town',
      'Wimbledon': 'Wimbledon',
      'Derby': 'Derby County',
      'Barnsley': 'Barnsley',
      'Bradford': 'Bradford City',
      'Charlton': 'Charlton Athletic',
      'Portsmouth': 'Portsmouth',
      'Watford': 'Watford',
      'Wigan': 'Wigan Athletic',
      'Reading': 'Reading',
      'Sunderland': 'Sunderland',
      'Luton': 'Luton Town',
      'Aston Villa': 'Aston Villa',
      'Crystal Palace': 'Crystal Palace',
      'Blackpool': 'Blackpool',
      'Brentford': 'Brentford'
    }
  }

  // Get season year format for CSV files (9293, 9394, etc.)
  getSeasonCode(seasonName) {
    const match = seasonName.match(/(\d{2})(\d{2})\/(\d{2})/)
    if (match) {
      return match[2] + match[3]
    }
    // Handle full year format
    const yearMatch = seasonName.match(/(\d{4})\/(\d{2})/)
    if (yearMatch) {
      return yearMatch[1].substr(2) + yearMatch[2]
    }
    return null
  }

  // Normalize team names to short versions
  normalizeTeamName(name) {
    if (!name) return null
    const trimmed = name.trim()
    
    // Use mapping if available, otherwise return as-is
    return this.teamMappings[trimmed] || trimmed
  }

  // Parse date in various formats
  parseDate(dateStr) {
    if (!dateStr) return null
    
    // Try DD/MM/YYYY format first (4-digit years)
    const ddmmyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
    }
    
    // Try DD/MM/YY format (2-digit years only)
    const ddmmyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
    if (ddmmyy) {
      const year = parseInt(ddmmyy[3]) > 50 ? '19' + ddmmyy[3] : '20' + ddmmyy[3]
      return `${year}-${ddmmyy[2].padStart(2, '0')}-${ddmmyy[1].padStart(2, '0')}`
    }
    
    return dateStr
  }

  // Download and parse CSV file
  async downloadCSV(seasonCode) {
    const url = `${this.baseUrl}/${seasonCode}/E0.csv`
    console.log(chalk.gray(`Downloading: ${url}`))
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const text = await response.text()
      return await this.parseCSV(text)
    } catch (error) {
      console.error(chalk.red(`Failed to download CSV: ${error.message}`))
      throw error
    }
  }

  // Parse CSV text into array of match objects
  parseCSV(csvText) {
    return new Promise((resolve, reject) => {
      const results = []
      const stream = Readable.from(csvText)
      
      stream
        .pipe(csv())
        .on('data', (row) => {
          // Map CSV columns to our format
          const match = {
            date: this.parseDate(row.Date),
            homeTeam: this.normalizeTeamName(row.HomeTeam),
            awayTeam: this.normalizeTeamName(row.AwayTeam),
            homeScore: parseInt(row.FTHG) || 0, // Full Time Home Goals
            awayScore: parseInt(row.FTAG) || 0, // Full Time Away Goals
            halfTimeHome: parseInt(row.HTHG) || null, // Half Time Home Goals
            halfTimeAway: parseInt(row.HTAG) || null, // Half Time Away Goals
            result: row.FTR, // Full Time Result (H/D/A)
            referee: row.Referee || null,
            // Additional stats if available
            homeShots: parseInt(row.HS) || null,
            awayShots: parseInt(row.AS) || null,
            homeShotsTarget: parseInt(row.HST) || null,
            awayShotsTarget: parseInt(row.AST) || null,
            homeCorners: parseInt(row.HC) || null,
            awayCorners: parseInt(row.AC) || null,
            homeFouls: parseInt(row.HF) || null,
            awayFouls: parseInt(row.AF) || null,
            homeYellow: parseInt(row.HY) || null,
            awayYellow: parseInt(row.AY) || null,
            homeRed: parseInt(row.HR) || null,
            awayRed: parseInt(row.AR) || null
          }
          
          if (match.date && match.homeTeam && match.awayTeam) {
            results.push(match)
          }
        })
        .on('end', () => {
          console.log(chalk.green(`Parsed ${results.length} matches`))
          resolve(results)
        })
        .on('error', reject)
    })
  }

  // Map CSV team name to database team name
  mapTeamName(csvName) {
    return this.teamMappings[csvName] || csvName
  }

  // Store matches in database
  async storeMatches(matches, seasonId) {
    let stored = 0
    let failed = 0
    
    for (const match of matches) {
      try {
        // Map team names from CSV to database format
        const homeTeamName = this.mapTeamName(match.homeTeam)
        const awayTeamName = this.mapTeamName(match.awayTeam)
        
        // Get team IDs
        const homeTeamResult = await this.pool.query(
          'SELECT id FROM teams WHERE name = $1 OR short_name = $1',
          [homeTeamName]
        )
        const awayTeamResult = await this.pool.query(
          'SELECT id FROM teams WHERE name = $1 OR short_name = $1',
          [awayTeamName]
        )
        
        if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
          console.error(chalk.yellow(`Teams not found: ${match.homeTeam} -> ${homeTeamName} vs ${match.awayTeam} -> ${awayTeamName}`))
          failed++
          continue
        }
        
        const homeTeamId = homeTeamResult.rows[0].id
        const awayTeamId = awayTeamResult.rows[0].id
        
        // Insert match
        await this.pool.query(`
          INSERT INTO matches (
            season_id, home_team_id, away_team_id, match_date,
            home_score, away_score, half_time_home, half_time_away,
            status, referee
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          seasonId, homeTeamId, awayTeamId, match.date,
          match.homeScore, match.awayScore, match.halfTimeHome, match.halfTimeAway,
          'FINISHED', match.referee
        ])
        
        stored++
      } catch (error) {
        console.error(chalk.red(`Failed to store match: ${error.message}`))
        failed++
      }
    }
    
    return { stored, failed, total: matches.length }
  }

  // Scrape a full season
  async scrapeSeason(seasonName) {
    console.log(chalk.blue(`\nScraping season: ${seasonName}`))
    
    // Get season from database
    const seasonResult = await this.pool.query(
      'SELECT id, year FROM seasons WHERE name = $1',
      [seasonName]
    )
    
    if (seasonResult.rows.length === 0) {
      throw new Error(`Season ${seasonName} not found in database`)
    }
    
    const seasonId = seasonResult.rows[0].id
    const seasonCode = this.getSeasonCode(seasonName)
    
    if (!seasonCode) {
      throw new Error(`Invalid season format: ${seasonName}`)
    }
    
    // Download and parse CSV
    const matches = await this.downloadCSV(seasonCode)
    
    // Store matches
    const result = await this.storeMatches(matches, seasonId)
    
    console.log(chalk.green(`Season ${seasonName} complete:`))
    console.log(chalk.green(`- Stored: ${result.stored}`))
    console.log(chalk.yellow(`- Failed: ${result.failed}`))
    
    return result
  }

  // Scrape multiple seasons
  async scrapeMultipleSeasons(startYear, endYear) {
    const results = []
    
    for (let year = startYear; year <= endYear; year++) {
      const seasonName = `${year}/${(year + 1).toString().substr(2)}`
      
      try {
        const result = await this.scrapeSeason(seasonName)
        results.push({ season: seasonName, ...result })
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(chalk.red(`Failed to scrape ${seasonName}: ${error.message}`))
        results.push({ season: seasonName, error: error.message })
      }
    }
    
    return results
  }
}