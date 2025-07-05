import chalk from 'chalk'

export class HistoricalDataHelper {
  constructor(pool) {
    this.pool = pool
  }

  // Get relegation/promotion rules for a specific season
  getRelegationRules(seasonYear) {
    if (seasonYear < 1994) {
      // First 3 seasons: 22 teams, 3 down, 3 up
      return {
        teamCount: 22,
        relegated: 3,
        promoted: 3,
        positions: [20, 21, 22]
      }
    } else if (seasonYear === 1994) {
      // Special transition season: 22 teams, 4 down, 2 up
      return {
        teamCount: 22,
        relegated: 4,
        promoted: 2,
        positions: [19, 20, 21, 22]
      }
    } else {
      // Modern era: 20 teams, 3 down, 3 up
      return {
        teamCount: 20,
        relegated: 3,
        promoted: 3,
        positions: [18, 19, 20]
      }
    }
  }

  // Identify relegated teams from final standings
  async identifyRelegatedTeams(seasonId) {
    const seasonResult = await this.pool.query(`
      SELECT year, name FROM seasons WHERE id = $1
    `, [seasonId])
    
    if (seasonResult.rows.length === 0) {
      throw new Error('Season not found')
    }
    
    const { year, name } = seasonResult.rows[0]
    const rules = this.getRelegationRules(year)
    
    // Get final standings
    const standingsResult = await this.pool.query(`
      SELECT t.id as team_id, t.name, s.position, s.points
      FROM standings s
      JOIN teams t ON s.team_id = t.id
      WHERE s.season_id = $1
      AND s.position IN (${rules.positions.join(',')})
      ORDER BY s.date DESC, s.position
      LIMIT ${rules.relegated}
    `, [seasonId])
    
    console.log(chalk.red(`Season ${name}: ${rules.relegated} teams relegated`))
    
    for (const team of standingsResult.rows) {
      console.log(chalk.red(`- ${team.name} (Position: ${team.position}, Points: ${team.points})`))
      
      // Record relegation
      await this.pool.query(`
        INSERT INTO division_changes (team_id, season_id, change_type, from_division, to_division, position)
        VALUES ($1, $2, 'relegated', 'Premier League', 'Championship', $3)
        ON CONFLICT DO NOTHING
      `, [team.team_id, seasonId, team.position])
      
      // Update team_seasons if exists
      await this.pool.query(`
        UPDATE team_seasons 
        SET relegated = true, final_position = $3
        WHERE team_id = $1 AND season_id = $2
      `, [team.team_id, seasonId, team.position])
    }
    
    return standingsResult.rows
  }

  // Track match counts for validation
  async getExpectedMatches(seasonYear) {
    const rules = this.getRelegationRules(seasonYear)
    const teams = rules.teamCount
    // Each team plays every other team twice (home and away)
    return teams * (teams - 1)
  }

  // Validate season data completeness
  async validateSeasonData(seasonId) {
    const result = await this.pool.query(`
      SELECT 
        s.name, s.year, s.team_count,
        COUNT(DISTINCT ts.team_id) as actual_teams,
        COUNT(DISTINCT m.id) as matches,
        COUNT(DISTINCT st.team_id) as standings_teams
      FROM seasons s
      LEFT JOIN team_seasons ts ON s.id = ts.season_id
      LEFT JOIN matches m ON s.id = m.season_id
      LEFT JOIN standings st ON s.id = st.season_id
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.year, s.team_count
    `, [seasonId])
    
    if (result.rows.length === 0) {
      return { valid: false, error: 'Season not found' }
    }
    
    const data = result.rows[0]
    const expectedMatches = await this.getExpectedMatches(data.year)
    
    const issues = []
    if (data.actual_teams !== data.team_count) {
      issues.push(`Expected ${data.team_count} teams, found ${data.actual_teams}`)
    }
    if (data.matches !== expectedMatches) {
      issues.push(`Expected ${expectedMatches} matches, found ${data.matches}`)
    }
    if (data.standings_teams !== data.team_count) {
      issues.push(`Expected ${data.team_count} teams in standings, found ${data.standings_teams}`)
    }
    
    return {
      valid: issues.length === 0,
      season: data.name,
      year: data.year,
      expectedTeams: data.team_count,
      actualTeams: data.actual_teams,
      expectedMatches: expectedMatches,
      actualMatches: data.matches,
      issues: issues
    }
  }
}