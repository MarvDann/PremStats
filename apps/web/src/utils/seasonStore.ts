import { createSignal, createEffect } from 'solid-js'

export interface Season {
  id: number
  name: string
}

// Global signal for the current/default season
const [currentSeasonId, setCurrentSeasonId] = createSignal<number | null>(null)
const [allSeasons, setAllSeasons] = createSignal<Season[]>([])

// Function to fetch and determine the most recent season with data
export const initializeCurrentSeason = async () => {
  try {
    // Fetch all seasons
    const seasonsResponse = await fetch('http://localhost:8081/api/v1/seasons')
    if (!seasonsResponse.ok) {
      throw new Error('Failed to fetch seasons')
    }
    
    const seasonsResult = await seasonsResponse.json()
    const seasons: Season[] = seasonsResult.data.seasons
    setAllSeasons(seasons)
    
    // Sort seasons by name descending (most recent first)
    const sortedSeasons = seasons.sort((a, b) => b.name.localeCompare(a.name))
    
    // Find the most recent season that has actual match data
    for (const season of sortedSeasons) {
      try {
        const matchesResponse = await fetch(`http://localhost:8081/api/v1/matches?season=${season.id}&limit=1`)
        if (matchesResponse.ok) {
          const matchesResult = await matchesResponse.json()
          if (matchesResult.data.matches && matchesResult.data.matches.length > 0) {
            console.log(`Setting current season to ${season.name} (ID: ${season.id})`)
            setCurrentSeasonId(season.id)
            return season.id
          }
        }
      } catch (error) {
        console.warn(`Failed to check matches for season ${season.name}:`, error)
        continue
      }
    }
    
    // Fallback to most recent season if no season has matches
    if (sortedSeasons.length > 0) {
      console.log(`Fallback: Setting current season to ${sortedSeasons[0].name} (ID: ${sortedSeasons[0].id})`)
      setCurrentSeasonId(sortedSeasons[0].id)
      return sortedSeasons[0].id
    }
    
    return null
  } catch (error) {
    console.error('Failed to initialize current season:', error)
    return null
  }
}

// Getter for current season ID
export const getCurrentSeasonId = () => currentSeasonId()

// Getter for all seasons
export const getAllSeasons = () => allSeasons()

// Function to get sorted seasons (most recent first)
export const getSortedSeasons = () => {
  return allSeasons().sort((a, b) => b.name.localeCompare(a.name))
}

// Function to manually set current season
export const setCurrentSeason = (seasonId: number) => {
  setCurrentSeasonId(seasonId)
}

// Export the signals for reactive access
export { currentSeasonId, allSeasons }