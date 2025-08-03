import { test, expect } from '@playwright/test'

test.describe('Theme System', () => {
  test('Theme switcher is visible and functional', async ({ page }) => {
    await page.goto('/')
    
    // Check theme switcher is visible in navigation
    const themeSwitcher = page.locator('button[aria-label*="Switch to"]')
    await expect(themeSwitcher).toBeVisible()
    
    // Check initial theme (should be light by default)
    await expect(themeSwitcher).toHaveAttribute('aria-label', /Switch to dark theme/)
    
    // Click to switch to dark theme
    await themeSwitcher.click()
    
    // Check theme switched
    await expect(themeSwitcher).toHaveAttribute('aria-label', /Switch to light theme/)
    
    // Check document has dark theme attribute
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    
    // Switch back to light theme
    await themeSwitcher.click()
    await expect(themeSwitcher).toHaveAttribute('aria-label', /Switch to dark theme/)
  })

  test('Theme is persisted across page loads', async ({ page }) => {
    await page.goto('/')
    
    const themeSwitcher = page.locator('button[aria-label*="Switch to"]')
    
    // Switch to dark theme
    await themeSwitcher.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    
    // Reload page
    await page.reload()
    
    // Check theme is still dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(themeSwitcher).toHaveAttribute('aria-label', /Switch to light theme/)
  })

  test('Mobile theme switcher works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Open mobile menu
    const mobileMenuButton = page.locator('button[aria-expanded]')
    await mobileMenuButton.click()
    
    // Check mobile theme switcher is visible
    const mobileThemeSwitcher = page.locator('div:has-text("Theme") button[aria-label*="Switch to"]').first()
    await expect(mobileThemeSwitcher).toBeVisible()
    
    // Test theme switching in mobile
    await mobileThemeSwitcher.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('Theme applies to all components', async ({ page }) => {
    await page.goto('/')
    
    const themeSwitcher = page.locator('button[aria-label*="Switch to"]')
    
    // Check light theme styles on stats cards
    const statsCard = page.locator('[data-testid="stats-card"], .stats-card, [class*="bg-[hsl(var(--card))]"]').first()
    await expect(statsCard).toBeVisible()
    
    // Switch to dark theme
    await themeSwitcher.click()
    
    // Verify dark theme is applied
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    
    // Components should still be visible and styled
    await expect(statsCard).toBeVisible()
  })
})