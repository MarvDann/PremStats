import { test, expect } from '@playwright/test'

test.describe('Theme Regression Analysis - Light Theme Background Colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')
  })

  test('should capture dark theme (working correctly) for baseline', async ({ page }) => {
    // Ensure we're in dark theme first
    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    await expect(themeToggle).toBeVisible()

    // Check current theme and switch to dark if needed
    const html = page.locator('html')
    const currentTheme = await html.getAttribute('data-theme')

    if (currentTheme !== 'dark') {
      await themeToggle.click()
      await page.waitForTimeout(500) // Wait for theme transition
    }

    // Navigate to teams page to test table rows
    await page.click('text=Teams')
    await page.waitForLoadState('networkidle')

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible()

    // Capture dark theme screenshot
    await page.screenshot({
      path: 'test-results/dark-theme-teams-baseline.png',
      fullPage: true
    })

    // Navigate to matches page
    await page.click('text=Matches')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeVisible()

    await page.screenshot({
      path: 'test-results/dark-theme-matches-baseline.png',
      fullPage: true
    })

    // Navigate to standings page
    await page.click('text=Standings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeVisible()

    await page.screenshot({
      path: 'test-results/dark-theme-standings-baseline.png',
      fullPage: true
    })
  })

  test('should capture light theme (regression) for comparison', async ({ page }) => {
    // Switch to light theme
    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    await expect(themeToggle).toBeVisible()

    // Check current theme and switch to light if needed
    const html = page.locator('html')
    const currentTheme = await html.getAttribute('data-theme')

    if (currentTheme !== 'light') {
      await themeToggle.click()
      await page.waitForTimeout(500) // Wait for theme transition
    }

    // Navigate to teams page to test table rows
    await page.click('text=Teams')
    await page.waitForLoadState('networkidle')

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible()

    // Capture light theme screenshot
    await page.screenshot({
      path: 'test-results/light-theme-teams-regression.png',
      fullPage: true
    })

    // Navigate to matches page
    await page.click('text=Matches')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeVisible()

    await page.screenshot({
      path: 'test-results/light-theme-matches-regression.png',
      fullPage: true
    })

    // Navigate to standings page
    await page.click('text=Standings')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeVisible()

    await page.screenshot({
      path: 'test-results/light-theme-standings-regression.png',
      fullPage: true
    })
  })

  test('should analyze table row background colors in both themes', async ({ page }) => {
    // Test dark theme first
    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    await expect(themeToggle).toBeVisible()

    // Ensure dark theme
    const html = page.locator('html')
    const currentTheme = await html.getAttribute('data-theme')

    if (currentTheme !== 'dark') {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }

    // Navigate to teams page
    await page.click('text=Teams')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('table')).toBeVisible()

    // Analyze dark theme row colors
    const darkThemeRows = await page.locator('tbody tr').all()
    const darkRowColors = []

    for (let i = 0; i < Math.min(5, darkThemeRows.length); i++) {
      const bgColor = await darkThemeRows[i].evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      darkRowColors.push({ row: i, backgroundColor: bgColor })
    }

    console.log('Dark theme row colors:', darkRowColors)

    // Switch to light theme
    await themeToggle.click()
    await page.waitForTimeout(500)

    // Analyze light theme row colors
    const lightThemeRows = await page.locator('tbody tr').all()
    const lightRowColors = []

    for (let i = 0; i < Math.min(5, lightThemeRows.length); i++) {
      const bgColor = await lightThemeRows[i].evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      lightRowColors.push({ row: i, backgroundColor: bgColor })
    }

    console.log('Light theme row colors:', lightRowColors)

    // Compare and flag differences
    const colorDifferences = []
    for (let i = 0; i < Math.min(darkRowColors.length, lightRowColors.length); i++) {
      if (darkRowColors[i].backgroundColor === lightRowColors[i].backgroundColor) {
        colorDifferences.push({
          row: i,
          issue: 'Same background color in both themes',
          dark: darkRowColors[i].backgroundColor,
          light: lightRowColors[i].backgroundColor
        })
      }
    }

    if (colorDifferences.length > 0) {
      console.log('⚠️  Background color regression detected:', colorDifferences)
    }
  })

  test('should test theme persistence and transitions', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    await expect(themeToggle).toBeVisible()

    // Test theme switching
    const html = page.locator('html')

    // Switch to light theme
    await themeToggle.click()
    await page.waitForTimeout(500)
    let theme = await html.getAttribute('data-theme')
    expect(theme).toBe('light')

    // Switch to dark theme
    await themeToggle.click()
    await page.waitForTimeout(500)
    theme = await html.getAttribute('data-theme')
    expect(theme).toBe('dark')

    // Test persistence across page navigation
    await page.click('text=Teams')
    await page.waitForLoadState('networkidle')
    theme = await html.getAttribute('data-theme')
    expect(theme).toBe('dark')

    // Switch to light and navigate
    await themeToggle.click()
    await page.waitForTimeout(500)
    await page.click('text=Matches')
    await page.waitForLoadState('networkidle')
    theme = await html.getAttribute('data-theme')
    expect(theme).toBe('light')
  })

  test('should analyze CSS variables in both themes', async ({ page }) => {
    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    await expect(themeToggle).toBeVisible()

    // Analyze dark theme CSS variables
    const html = page.locator('html')
    const currentTheme = await html.getAttribute('data-theme')

    if (currentTheme !== 'dark') {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }

    const darkVariables = await page.evaluate(() => {
      const root = document.documentElement
      const computedStyle = window.getComputedStyle(root)

      return {
        background: computedStyle.getPropertyValue('--background').trim(),
        foreground: computedStyle.getPropertyValue('--foreground').trim(),
        muted: computedStyle.getPropertyValue('--muted').trim(),
        mutedForeground: computedStyle.getPropertyValue('--muted-foreground').trim(),
        accent: computedStyle.getPropertyValue('--accent').trim(),
        accentForeground: computedStyle.getPropertyValue('--accent-foreground').trim(),
        border: computedStyle.getPropertyValue('--border').trim()
      }
    })

    console.log('Dark theme CSS variables:', darkVariables)

    // Switch to light theme
    await themeToggle.click()
    await page.waitForTimeout(500)

    const lightVariables = await page.evaluate(() => {
      const root = document.documentElement
      const computedStyle = window.getComputedStyle(root)

      return {
        background: computedStyle.getPropertyValue('--background').trim(),
        foreground: computedStyle.getPropertyValue('--foreground').trim(),
        muted: computedStyle.getPropertyValue('--muted').trim(),
        mutedForeground: computedStyle.getPropertyValue('--muted-foreground').trim(),
        accent: computedStyle.getPropertyValue('--accent').trim(),
        accentForeground: computedStyle.getPropertyValue('--accent-foreground').trim(),
        border: computedStyle.getPropertyValue('--border').trim()
      }
    })

    console.log('Light theme CSS variables:', lightVariables)

    // Validate that themes have different values
    const variableKeys = Object.keys(darkVariables) as (keyof typeof darkVariables)[]
    for (const key of variableKeys) {
      if (darkVariables[key] === lightVariables[key] && darkVariables[key] !== '') {
        console.log(`⚠️  CSS variable --${key} has same value in both themes: ${darkVariables[key]}`)
      }
    }
  })
})
