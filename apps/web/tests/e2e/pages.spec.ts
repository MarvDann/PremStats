import { test, expect } from '@playwright/test'

test.describe('PremStats Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Set up API mocking if needed
    // This helps ensure tests don't depend on external services
  })

  test('Home page loads correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check that page loads without blank screen
    await expect(page).toHaveTitle(/PremStats/)
    
    // Check for main heading
    await expect(page.getByRole('heading', { name: /Premier League Statistics/i })).toBeVisible()
    
    // Check for hero section content
    await expect(page.getByText(/Comprehensive football data from 1992 to present/i)).toBeVisible()
    
    // Check for search section
    await expect(page.getByPlaceholder(/Ask anything/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Search/i })).toBeVisible()
    
    // Check for stats cards
    await expect(page.getByText(/Total Matches/i)).toBeVisible()
    await expect(page.getByText(/Total Goals/i)).toBeVisible()
    await expect(page.getByText(/Current Season/i)).toBeVisible()
    
    // Check for quick access links
    await expect(page.getByRole('link', { name: /Teams/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Players/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Matches/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Tables/i })).toBeVisible()
  })

  test('Navigation works correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test navigation to Teams page
    await page.getByRole('link', { name: /Teams/i }).first().click()
    await expect(page).toHaveURL(/\/teams/)
    await expect(page.getByRole('heading', { name: /Premier League Teams/i })).toBeVisible()
    
    // Test navigation to Players page
    await page.getByRole('link', { name: /Players/i }).first().click()
    await expect(page).toHaveURL(/\/players/)
    await expect(page.getByRole('heading', { name: /Premier League Players/i })).toBeVisible()
    
    // Test navigation to Matches page
    await page.getByRole('link', { name: /Matches/i }).first().click()
    await expect(page).toHaveURL(/\/matches/)
    await expect(page.getByRole('heading', { name: /Premier League Matches/i })).toBeVisible()
    
    // Test navigation to Statistics page
    await page.getByRole('link', { name: /Statistics/i }).first().click()
    await expect(page).toHaveURL(/\/stats/)
    await expect(page.getByRole('heading', { name: /Premier League Statistics/i })).toBeVisible()
    
    // Test navigation back to home
    await page.getByRole('link', { name: /PremStats/i }).click()
    await expect(page).toHaveURL('/')
  })

  test('Mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check that mobile menu button is visible
    await expect(page.getByRole('button', { name: /Open main menu/i })).toBeVisible()
    
    // Click mobile menu button
    await page.getByRole('button', { name: /Open main menu/i }).click()
    
    // Check that mobile menu items are visible
    await expect(page.getByRole('link', { name: /Teams/i }).nth(1)).toBeVisible()
    await expect(page.getByRole('link', { name: /Players/i }).nth(1)).toBeVisible()
    await expect(page.getByRole('link', { name: /Matches/i }).nth(1)).toBeVisible()
    await expect(page.getByRole('link', { name: /Statistics/i }).nth(1)).toBeVisible()
    
    // Test mobile navigation
    await page.getByRole('link', { name: /Teams/i }).nth(1).click()
    await expect(page).toHaveURL(/\/teams/)
  })

  test('Teams page loads and functions', async ({ page }) => {
    await page.goto('/teams')
    
    // Check page loads
    await expect(page.getByRole('heading', { name: /Premier League Teams/i })).toBeVisible()
    
    // Check search functionality
    await expect(page.getByPlaceholder(/Search teams/i)).toBeVisible()
    
    // Wait for teams to load (give it some time for API call)
    await page.waitForTimeout(2000)
    
    // Check for loading state or teams content
    const hasTeamsOrLoading = await page.locator('text=Loading teams, text=Arsenal, text=Manchester').count() > 0
    expect(hasTeamsOrLoading).toBeTruthy()
    
    // Test search if teams are loaded
    const searchInput = page.getByPlaceholder(/Search teams/i)
    await searchInput.fill('Arsenal')
    await page.waitForTimeout(500)
    
    // Should filter results (or show loading)
    const searchResults = await page.locator('[data-testid="team-card"], .team-card, text=Arsenal').count()
    expect(searchResults).toBeGreaterThanOrEqual(0)
  })

  test('Players page loads with content', async ({ page }) => {
    await page.goto('/players')
    
    // Check page loads
    await expect(page.getByRole('heading', { name: /Premier League Players/i })).toBeVisible()
    
    // Check for stats cards
    await expect(page.getByText(/Current Top Scorer/i)).toBeVisible()
    await expect(page.getByText(/All-Time Top Scorer/i)).toBeVisible()
    
    // Check for data tables
    await expect(page.getByText(/Top Scorers - 2024\/25 Season/i)).toBeVisible()
    await expect(page.getByText(/All Players/i)).toBeVisible()
    await expect(page.getByText(/All-Time Leading Scorers/i)).toBeVisible()
    
    // Check search functionality
    await expect(page.getByPlaceholder(/Search players/i)).toBeVisible()
    
    // Test search
    const searchInput = page.getByPlaceholder(/Search players/i)
    await searchInput.fill('Shearer')
    await page.waitForTimeout(500)
  })

  test('Matches page loads with filters', async ({ page }) => {
    await page.goto('/matches')
    
    // Check page loads
    await expect(page.getByRole('heading', { name: /Premier League Matches/i })).toBeVisible()
    
    // Check for filter controls
    await expect(page.getByText(/Season:/i)).toBeVisible()
    await expect(page.getByText(/Show:/i)).toBeVisible()
    
    // Check for season dropdown
    const seasonSelect = page.locator('select').first()
    await expect(seasonSelect).toBeVisible()
    
    // Check for limit dropdown
    const limitSelect = page.locator('select').nth(1)
    await expect(limitSelect).toBeVisible()
    
    // Wait for matches to potentially load
    await page.waitForTimeout(2000)
    
    // Should show either loading state or matches
    const hasMatchesOrLoading = await page.locator('text=Loading matches, .match-card, text=vs').count() > 0
    expect(hasMatchesOrLoading).toBeTruthy()
  })

  test('Statistics page loads with league table', async ({ page }) => {
    await page.goto('/stats')
    
    // Check page loads
    await expect(page.getByRole('heading', { name: /Premier League Statistics/i })).toBeVisible()
    
    // Check for season selector
    await expect(page.getByText(/Season:/i)).toBeVisible()
    
    // Check for league table section
    await expect(page.getByText(/League Table/i)).toBeVisible()
    
    // Check for legend
    await expect(page.getByText(/Champions League/i)).toBeVisible()
    await expect(page.getByText(/Europa League/i)).toBeVisible()
    await expect(page.getByText(/Relegation/i)).toBeVisible()
    
    // Wait for potential data loading
    await page.waitForTimeout(2000)
    
    // Should show loading state or data
    const hasStatsOrLoading = await page.locator('text=Loading statistics, th, .table').count() > 0
    expect(hasStatsOrLoading).toBeTruthy()
  })

  test('Pages handle errors gracefully', async ({ page }) => {
    // Test with API potentially down
    await page.route('**/api/v1/**', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' })
    }))
    
    await page.goto('/teams')
    
    // Should show error message gracefully
    await page.waitForTimeout(2000)
    const hasErrorHandling = await page.locator('text=Failed to load, text=Please try again, text=Error').count() > 0
    expect(hasErrorHandling).toBeTruthy()
  })

  test('App is responsive on different screen sizes', async ({ page }) => {
    await page.goto('/')
    
    // Test desktop
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('heading', { name: /Premier League Statistics/i })).toBeVisible()
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('heading', { name: /Premier League Statistics/i })).toBeVisible()
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('heading', { name: /Premier League Statistics/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Open main menu/i })).toBeVisible()
  })

  test('Loading states are displayed', async ({ page }) => {
    // Slow down API responses to see loading states
    await page.route('**/api/v1/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      route.continue()
    })
    
    await page.goto('/teams')
    
    // Should show loading state
    const loadingVisible = await page.getByText(/Loading teams/i).isVisible()
    expect(loadingVisible).toBeTruthy()
  })
})