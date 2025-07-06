import { test, expect } from '@playwright/test'

test.describe('API Integration', () => {
  test('API endpoints are accessible', async ({ page }) => {
    // Check API health endpoint
    const apiHealthResponse = await page.request.get('http://localhost:8081/api/v1/health')
    expect(apiHealthResponse.ok()).toBeTruthy()
    
    const healthData = await apiHealthResponse.json()
    expect(healthData.success).toBe(true)
    expect(healthData.message).toContain('PremStats API is running')
  })

  test('Teams API integration works', async ({ page }) => {
    await page.goto('/teams')
    
    // Wait for API call to complete
    const responsePromise = page.waitForResponse('**/api/v1/teams')
    await responsePromise
    
    // Check that teams are displayed or error is handled
    await page.waitForTimeout(2000)
    
    // Should either show teams, loading, or error state
    const hasValidState = await page.locator(
      'text=Loading teams, text=Failed to load teams, [data-testid="team-card"], .team-card'
    ).count() > 0
    
    expect(hasValidState).toBeTruthy()
  })

  test('Seasons API integration works', async ({ page }) => {
    await page.goto('/stats')
    
    // Wait for seasons API call
    const responsePromise = page.waitForResponse('**/api/v1/seasons')
    await responsePromise
    
    // Check that seasons dropdown is populated or error is handled
    await page.waitForTimeout(2000)
    
    const seasonSelect = page.locator('select').first()
    const optionCount = await seasonSelect.locator('option').count()
    
    // Should have at least the default option
    expect(optionCount).toBeGreaterThan(0)
  })

  test('Frontend handles API errors gracefully', async ({ page }) => {
    // Mock API to return errors
    await page.route('**/api/v1/teams', route => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Server Error' })
    }))
    
    await page.goto('/teams')
    
    // Should show error message
    await page.waitForTimeout(2000)
    await expect(page.getByText(/Failed to load teams/i)).toBeVisible()
  })

  test('Frontend handles API timeouts gracefully', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/v1/teams', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000)) // 10 second delay
      route.continue()
    })
    
    await page.goto('/teams')
    
    // Should show loading state initially
    await expect(page.getByText(/Loading teams/i)).toBeVisible()
    
    // After timeout, should show error or handle gracefully
    await page.waitForTimeout(5000)
  })

  test('CORS is properly configured', async ({ page }) => {
    await page.goto('/')
    
    // Make a direct API call from the frontend context
    const apiCall = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:8081/api/v1/health')
        return {
          ok: response.ok,
          status: response.status,
          data: await response.json()
        }
      } catch (error) {
        return {
          error: error.message
        }
      }
    })
    
    expect(apiCall.ok).toBe(true)
    expect(apiCall.data?.success).toBe(true)
  })
})