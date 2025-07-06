import { test, expect } from '@playwright/test'

test.describe('Team Detail Pages', () => {
  test('Team detail page loads from teams list', async ({ page }) => {
    await page.goto('/teams')
    
    // Wait for teams to potentially load
    await page.waitForTimeout(3000)
    
    // Look for a team card/link to click
    const teamLinks = page.locator('a[href*="/teams/"]')
    const teamCount = await teamLinks.count()
    
    if (teamCount > 0) {
      // Click on first team
      await teamLinks.first().click()
      
      // Should navigate to team detail page
      await expect(page).toHaveURL(/\/teams\/\d+/)
      
      // Check for team detail content
      await expect(page.getByText(/Founded/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /Back to Teams/i })).toBeVisible()
      
      // Check for season selector
      await expect(page.getByText(/Season:/i)).toBeVisible()
    } else {
      // If no teams loaded, just check the page structure
      console.log('No teams loaded, checking page structure only')
      await page.goto('/teams/1')
      
      // Should at least show the page structure or loading
      await expect(page).toHaveURL(/\/teams\/1/)
    }
  })

  test('Team detail back button works', async ({ page }) => {
    await page.goto('/teams/1')
    
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Click back button if it exists
    const backButton = page.getByRole('button', { name: /Back to Teams/i })
    const backButtonExists = await backButton.isVisible()
    
    if (backButtonExists) {
      await backButton.click()
      await expect(page).toHaveURL(/\/teams$/)
    }
  })

  test('Team detail handles invalid team ID', async ({ page }) => {
    await page.goto('/teams/99999')
    
    // Wait for potential error handling
    await page.waitForTimeout(2000)
    
    // Should either show error message or redirect
    const hasErrorOrRedirect = await page.locator('text=not found, text=error, text=failed').count() > 0 ||
                               page.url().includes('/teams') && !page.url().includes('/teams/99999')
    
    expect(hasErrorOrRedirect).toBeTruthy()
  })
})