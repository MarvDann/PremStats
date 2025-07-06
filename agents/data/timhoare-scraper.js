import fetch from 'node-fetch'
import chalk from 'chalk'
import csv from 'csv-parser'
import { Readable } from 'stream'

export class TimHoareScraper {
  constructor(pool) {
    this.pool = pool
    this.baseUrl = 'https://raw.githubusercontent.com/TimHoare/Premier_League_Data/master/data'
    this.teamMappings = {
      // Map TimHoare team names to our database team names
      'Arsenal': 'Arsenal FC',
      'Aston Villa': 'Aston Villa FC',
      'Blackburn Rovers': 'Blackburn Rovers FC',
      'Chelsea': 'Chelsea FC',
      'Coventry City': 'Coventry City FC',
      'Crystal Palace': 'Crystal Palace FC',
      'Everton': 'Everton FC',
      'Ipswich Town': 'Ipswich Town FC',
      'Leeds United': 'Leeds United FC',
      'Liverpool': 'Liverpool FC',
      'Manchester City': 'Manchester City FC',
      'Manchester United': 'Manchester United FC',
      'Middlesbrough': 'Middlesbrough FC',
      'Norwich City': 'Norwich City FC',
      'Nottingham Forest': 'Nottingham Forest FC',
      'Oldham Athletic': 'Oldham Athletic AFC',
      'Queens Park Rangers': 'Queens Park Rangers FC',
      'Sheffield United': 'Sheffield United FC',
      'Sheffield Wednesday': 'Sheffield Wednesday FC',
      'Southampton': 'Southampton FC',
      'Tottenham Hotspur': 'Tottenham Hotspur FC',
      'Wimbledon': 'Wimbledon FC'
    }
  }

  // Download and parse CSV file
  async downloadCSV(filename) {
    const url = `${this.baseUrl}/${filename}`
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
          // Only process 1992/93 season matches
          if (row.season === '1992/93') {
            const match = {
              matchId: parseInt(row.match_id),
              season: row.season,
              gameWeek: parseInt(row.game_week),
              kickoff: row.kickoff,
              homeTeam: row.home,
              homeTeamId: parseInt(row.home_id),
              homeScore: parseInt(row.home_score) || 0,
              homeHtScore: parseInt(row.home_ht_score) || 0,
              awayTeam: row.away,
              awayTeamId: parseInt(row.away_id),
              awayScore: parseInt(row.away_score) || 0,
              awayHtScore: parseInt(row.away_ht_score) || 0,
              groundId: parseInt(row.ground_id),
              groundName: row.ground_name,
              groundCity: row.ground_city,
              refereeId: parseInt(row.referee_id),
              refereeName: row.referee_name,
              behindClosedDoors: row.behind_closed_doors
            }
            
            if (match.homeTeam && match.awayTeam) {
              results.push(match)
            }
          }
        })
        .on('end', () => {
          console.log(chalk.green(`Parsed ${results.length} matches for 1992/93 season`))
          resolve(results)
        })
        .on('error', reject)
    })
  }

  // Parse kickoff time to date
  parseKickoffDate(kickoffStr) {
    if (!kickoffStr) return null
    
    // Format: "Sat 15 Aug 1992, 15:00 BST"
    const match = kickoffStr.match(/(\w+)\s+(\d{1,2})\s+(\w+)\s+(\d{4}),\s+(\d{1,2}):(\d{2})/)
    if (!match) return null
    
    const [, , day, monthStr, year, hour, minute] = match
    
    const months = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    }
    
    const month = months[monthStr]
    if (!month) return null
    
    return `${year}-${month}-${day.padStart(2, '0')}`
  }

  // Map team name to database format
  mapTeamName(teamName) {
    return this.teamMappings[teamName] || teamName
  }

  // Store matches in database
  async storeMatches(matches, seasonId) {
    let stored = 0
    let failed = 0
    
    for (const match of matches) {
      try {
        // Map team names
        const homeTeamName = this.mapTeamName(match.homeTeam)
        const awayTeamName = this.mapTeamName(match.awayTeam)
        
        // Get team IDs from database
        const homeTeamResult = await this.pool.query(
          'SELECT id FROM teams WHERE name = $1',
          [homeTeamName]
        )
        const awayTeamResult = await this.pool.query(
          'SELECT id FROM teams WHERE name = $1',
          [awayTeamName]
        )
        
        if (homeTeamResult.rows.length === 0 || awayTeamResult.rows.length === 0) {
          console.error(chalk.yellow(`Teams not found: ${match.homeTeam} -> ${homeTeamName} vs ${match.awayTeam} -> ${awayTeamName}`))
          failed++
          continue
        }
        
        const homeTeamId = homeTeamResult.rows[0].id
        const awayTeamId = awayTeamResult.rows[0].id
        
        // Parse match date
        const matchDate = this.parseKickoffDate(match.kickoff)
        
        // Insert match
        await this.pool.query(`
          INSERT INTO matches (
            season_id, home_team_id, away_team_id, match_date,
            home_score, away_score, half_time_home, half_time_away,
            status, referee
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING
        `, [
          seasonId, homeTeamId, awayTeamId, matchDate,
          match.homeScore, match.awayScore, match.homeHtScore, match.awayHtScore,
          'FINISHED', match.refereeName
        ])
        
        stored++
      } catch (error) {
        console.error(chalk.red(`Failed to store match: ${match.homeTeam} vs ${match.awayTeam} - ${error.message}`))
        failed++
      }
    }
    
    return { stored, failed, total: matches.length }
  }

  // Scrape 1992/93 season
  async scrape1992Season() {
    console.log(chalk.blue(`\nScraping 1992/93 season from TimHoare repository`))
    
    // Get season from database
    const seasonResult = await this.pool.query(
      'SELECT id, year FROM seasons WHERE name = $1',
      ['1992/93']
    )
    
    if (seasonResult.rows.length === 0) {
      throw new Error(`Season 1992/93 not found in database`)
    }
    
    const seasonId = seasonResult.rows[0].id
    
    // Download and parse CSV
    const matches = await this.downloadCSV('matches.csv')
    
    // Store matches
    const result = await this.storeMatches(matches, seasonId)
    
    console.log(chalk.green(`Season 1992/93 complete:`))
    console.log(chalk.green(`- Stored: ${result.stored}`))
    console.log(chalk.yellow(`- Failed: ${result.failed}`))
    console.log(chalk.gray(`- Total processed: ${result.total}`))
    
    return result
  }
}