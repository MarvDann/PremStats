#!/usr/bin/env node

import 'dotenv/config'
import pg from 'pg'
import chalk from 'chalk'
import ora from 'ora'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://premstats:premstats@localhost:5432/premstats'
})

async function cleanDuplicatePlayers() {
  const spinner = ora('Starting duplicate player cleanup...').start()
  
  try {
    // Find duplicate players by cleaning names and comparing
    const duplicatesQuery = `
      WITH cleaned_names AS (
        SELECT 
          p.id,
          p.name,
          p.current_team_id,
          t.name as team_name,
          p.nationality,
          p.position,
          p.date_of_birth,
          -- More aggressive name cleaning to handle diacritics and special characters
          LOWER(
            REGEXP_REPLACE(
              TRANSLATE(p.name, 
                'àáâãäåāăąçćĉċčďđèéêëēĕėęěĝğġģĥħìíîïĩīĭįıĵķĺļľŀłñńņňŉŋòóôõöøōŏőŕŗřśŝşšţťŧùúûüũūŭůűųŵýÿŷźżžß',
                'aaaaaaaaacccccddeeeeeeeeegggghhhiiiiiiiiijklllllnnnnnooooooooorrrssstttuuuuuuuuuuwyyyzzz'
              ), 
              '[^a-z ]', '', 'g'
            )
          ) as clean_name,
          -- Calculate completeness score (higher = more complete)
          (CASE WHEN p.current_team_id IS NOT NULL THEN 4 ELSE 0 END +
           CASE WHEN p.nationality IS NOT NULL THEN 2 ELSE 0 END +
           CASE WHEN p.position IS NOT NULL THEN 2 ELSE 0 END +
           CASE WHEN p.date_of_birth IS NOT NULL THEN 1 ELSE 0 END) as completeness_score,
          ROW_NUMBER() OVER (
            PARTITION BY LOWER(
              REGEXP_REPLACE(
                TRANSLATE(p.name, 
                  'àáâãäåāăąçćĉċčďđèéêëēĕėęěĝğġģĥħìíîïĩīĭįıĵķĺļľŀłñńņňŉŋòóôõöøōŏőŕŗřśŝşšţťŧùúûüũūŭůűųŵýÿŷźżžß',
                  'aaaaaaaaacccccddeeeeeeeeegggghhhiiiiiiiiijklllllnnnnnooooooooorrrssstttuuuuuuuuuuwyyyzzz'
                ), 
                '[^a-z ]', '', 'g'
              )
            )
            ORDER BY 
              -- First: Prefer players with teams (most important)
              CASE WHEN p.current_team_id IS NOT NULL THEN 1 ELSE 2 END,
              -- Second: Prefer more complete records
              (CASE WHEN p.current_team_id IS NOT NULL THEN 4 ELSE 0 END +
               CASE WHEN p.nationality IS NOT NULL THEN 2 ELSE 0 END +
               CASE WHEN p.position IS NOT NULL THEN 2 ELSE 0 END +
               CASE WHEN p.date_of_birth IS NOT NULL THEN 1 ELSE 0 END) DESC,
              -- Third: Prefer shorter names (usually official)
              LENGTH(p.name) ASC,
              -- Fourth: Stable sort by ID
              p.id ASC
          ) as rn
        FROM players p
        LEFT JOIN teams t ON p.current_team_id = t.id
      ),
      duplicates AS (
        SELECT clean_name, COUNT(*) as count
        FROM cleaned_names
        GROUP BY clean_name
        HAVING COUNT(*) > 1
      )
      SELECT 
        cn.id,
        cn.name,
        cn.team_name,
        cn.nationality,
        cn.position,
        cn.date_of_birth,
        cn.clean_name,
        cn.completeness_score,
        cn.rn,
        d.count
      FROM cleaned_names cn
      JOIN duplicates d ON cn.clean_name = d.clean_name
      ORDER BY cn.clean_name, cn.rn
    `
    
    const duplicatesResult = await pool.query(duplicatesQuery)
    
    if (duplicatesResult.rows.length === 0) {
      spinner.succeed('No duplicate players found!')
      return
    }
    
    spinner.succeed(`Found ${duplicatesResult.rows.length} duplicate player records`)
    
    // Group duplicates by clean name
    const duplicateGroups = {}
    for (const row of duplicatesResult.rows) {
      if (!duplicateGroups[row.clean_name]) {
        duplicateGroups[row.clean_name] = []
      }
      duplicateGroups[row.clean_name].push(row)
    }
    
    console.log(chalk.bold('\n🔍 Duplicate Player Groups:'))
    
    let totalCleaned = 0
    
    for (const [cleanName, players] of Object.entries(duplicateGroups)) {
      console.log(chalk.blue(`\n📝 ${cleanName}:`))
      
      // Keep the first player (best quality based on our ORDER BY)
      const keepPlayer = players[0]
      const duplicatePlayers = players.slice(1)
      
      const formatPlayerInfo = (player) => {
        const details = []
        if (player.team_name) details.push(`Team: ${player.team_name}`)
        if (player.nationality) details.push(`${player.nationality}`)
        if (player.position) details.push(`${player.position}`)
        if (player.date_of_birth) {
          const dateStr = typeof player.date_of_birth === 'string' ? 
            player.date_of_birth : 
            player.date_of_birth.toISOString()
          details.push(`DOB: ${dateStr.split('T')[0]}`)
        }
        return details.length > 0 ? ` | ${details.join(', ')}` : ' | No data'
      }
      
      console.log(chalk.green(`  ✅ KEEP: ${keepPlayer.name} (ID: ${keepPlayer.id}, Score: ${keepPlayer.completeness_score})${formatPlayerInfo(keepPlayer)}`))
      
      for (const duplicate of duplicatePlayers) {
        console.log(chalk.red(`  ❌ DELETE: ${duplicate.name} (ID: ${duplicate.id}, Score: ${duplicate.completeness_score})${formatPlayerInfo(duplicate)}`))
        
        try {
          // Start transaction for each player cleanup
          await pool.query('BEGIN')
          
          // Move any player_stats to the kept player
          await pool.query(`
            UPDATE player_stats 
            SET player_id = $1 
            WHERE player_id = $2 
            AND NOT EXISTS (
              SELECT 1 FROM player_stats ps2 
              WHERE ps2.player_id = $1 
              AND ps2.season_id = player_stats.season_id 
              AND ps2.team_id = player_stats.team_id
            )
          `, [keepPlayer.id, duplicate.id])
          
          // Move any goals to the kept player
          await pool.query(`
            UPDATE goals 
            SET player_id = $1 
            WHERE player_id = $2
          `, [keepPlayer.id, duplicate.id])
          
          // Move any match_events to the kept player
          await pool.query(`
            UPDATE match_events 
            SET player_id = $1 
            WHERE player_id = $2
          `, [keepPlayer.id, duplicate.id])
          
          // Delete any remaining player_stats for the duplicate
          await pool.query('DELETE FROM player_stats WHERE player_id = $1', [duplicate.id])
          
          // Delete the duplicate player
          await pool.query('DELETE FROM players WHERE id = $1', [duplicate.id])
          
          await pool.query('COMMIT')
          totalCleaned++
          
        } catch (error) {
          await pool.query('ROLLBACK')
          console.log(chalk.yellow(`    ⚠️  Failed to delete ${duplicate.name}: ${error.message}`))
        }
      }
    }
    
    spinner.succeed(chalk.green(`🎉 Cleanup completed! Removed ${totalCleaned} duplicate players`))
    
    // Final statistics
    const finalStatsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_players,
        COUNT(current_team_id) as players_with_teams,
        COUNT(*) - COUNT(current_team_id) as players_without_teams
      FROM players
    `)
    
    const stats = finalStatsResult.rows[0]
    console.log(chalk.bold('\n📊 Final Statistics:'))
    console.log(`• Total players: ${stats.total_players}`)
    console.log(`• Players with teams: ${stats.players_with_teams}`)
    console.log(`• Players without teams: ${stats.players_without_teams}`)
    
  } catch (error) {
    spinner.fail(chalk.red(`Cleanup failed: ${error.message}`))
    console.error(error)
  } finally {
    await pool.end()
  }
}

// Run the cleanup
console.log(chalk.bold('🧹 Starting duplicate player cleanup...'))
console.log(chalk.gray('This will merge duplicate players and preserve all statistics'))

cleanDuplicatePlayers().then(() => {
  console.log(chalk.bold('\n✨ Duplicate cleanup complete!'))
  process.exit(0)
}).catch(error => {
  console.error(chalk.red('\n💥 Cleanup failed:'), error.message)
  process.exit(1)
})