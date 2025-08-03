import { test, expect } from '@playwright/test'

test.describe('Light Theme Background Color Regression', () => {
  test('should compare dark vs light theme backgrounds', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    await expect(themeToggle).toBeVisible()

    // First, ensure we start in dark theme
    const html = page.locator('html')
    let currentTheme = await html.getAttribute('data-theme')

    if (currentTheme !== 'dark') {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }

    // Capture dark theme (working correctly)
    await page.screenshot({
      path: 'test-results/dark-theme-home.png',
      fullPage: true
    })

    // Go to Tables page which should have actual tables
    await page.click('text=Tables')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: 'test-results/dark-theme-tables.png',
      fullPage: true
    })

    // Switch to light theme
    await themeToggle.click()
    await page.waitForTimeout(500)

    // Verify theme switched
    currentTheme = await html.getAttribute('data-theme')
    console.log('Current theme after switch:', currentTheme)

    // Capture light theme (regression)
    await page.screenshot({
      path: 'test-results/light-theme-home.png',
      fullPage: true
    })

    // Capture Tables page in light theme
    await page.screenshot({
      path: 'test-results/light-theme-tables.png',
      fullPage: true
    })

    // Go back to home to compare main page
    await page.click('text=PremStats')
    await page.waitForLoadState('networkidle')

    await page.screenshot({
      path: 'test-results/light-theme-home-final.png',
      fullPage: true
    })
  })

  test('should analyze computed styles in both themes', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    const html = page.locator('html')

    // Ensure dark theme first
    const currentTheme = await html.getAttribute('data-theme')
    if (currentTheme !== 'dark') {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }

    // Analyze dark theme background colors
    const darkThemeStyles = await page.evaluate(() => {
      const body = document.body
      const main = document.querySelector('main')
      const nav = document.querySelector('nav')

      return {
        bodyBackground: window.getComputedStyle(body).backgroundColor,
        mainBackground: main ? window.getComputedStyle(main).backgroundColor : 'not found',
        navBackground: nav ? window.getComputedStyle(nav).backgroundColor : 'not found',
        documentTheme: document.documentElement.getAttribute('data-theme')
      }
    })

    console.log('Dark theme styles:', darkThemeStyles)

    // Switch to light theme
    await themeToggle.click()
    await page.waitForTimeout(500)

    // Analyze light theme background colors
    const lightThemeStyles = await page.evaluate(() => {
      const body = document.body
      const main = document.querySelector('main')
      const nav = document.querySelector('nav')

      return {
        bodyBackground: window.getComputedStyle(body).backgroundColor,
        mainBackground: main ? window.getComputedStyle(main).backgroundColor : 'not found',
        navBackground: nav ? window.getComputedStyle(nav).backgroundColor : 'not found',
        documentTheme: document.documentElement.getAttribute('data-theme')
      }
    })

    console.log('Light theme styles:', lightThemeStyles)

    // Check if backgrounds are the same (regression indicator)
    if (darkThemeStyles.bodyBackground === lightThemeStyles.bodyBackground) {
      console.log('🚨 REGRESSION: Body background colors are identical between themes')
    }

    if (darkThemeStyles.mainBackground === lightThemeStyles.mainBackground) {
      console.log('🚨 REGRESSION: Main background colors are identical between themes')
    }

    // Expect themes to be different
    expect(darkThemeStyles.documentTheme).toBe('dark')
    expect(lightThemeStyles.documentTheme).toBe('light')
  })

  test('should analyze CSS variables directly', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const themeToggle = page.locator('button[aria-label*="Switch to"]')
    const html = page.locator('html')

    // Dark theme analysis
    const currentTheme = await html.getAttribute('data-theme')
    if (currentTheme !== 'dark') {
      await themeToggle.click()
      await page.waitForTimeout(500)
    }

    const darkVariables = await page.evaluate(() => {
      const root = document.documentElement
      const style = window.getComputedStyle(root)

      return {
        colorBackground: style.getPropertyValue('--color-background').trim(),
        colorForeground: style.getPropertyValue('--color-foreground').trim(),
        colorCard: style.getPropertyValue('--color-card').trim(),
        colorMuted: style.getPropertyValue('--color-muted').trim(),
        background: style.getPropertyValue('--background').trim(),
        foreground: style.getPropertyValue('--foreground').trim(),
        muted: style.getPropertyValue('--muted').trim()
      }
    })

    console.log('Dark theme CSS variables:', darkVariables)

    // Light theme analysis
    await themeToggle.click()
    await page.waitForTimeout(500)

    const lightVariables = await page.evaluate(() => {
      const root = document.documentElement
      const style = window.getComputedStyle(root)

      return {
        colorBackground: style.getPropertyValue('--color-background').trim(),
        colorForeground: style.getPropertyValue('--color-foreground').trim(),
        colorCard: style.getPropertyValue('--color-card').trim(),
        colorMuted: style.getPropertyValue('--color-muted').trim(),
        background: style.getPropertyValue('--background').trim(),
        foreground: style.getPropertyValue('--foreground').trim(),
        muted: style.getPropertyValue('--muted').trim()
      }
    })

    console.log('Light theme CSS variables:', lightVariables)

    // Flag identical values (potential regression)
    const variableKeys = Object.keys(darkVariables) as (keyof typeof darkVariables)[]
    for (const key of variableKeys) {
      if (darkVariables[key] === lightVariables[key] && darkVariables[key] !== '') {
        console.log(`🚨 REGRESSION: CSS variable --${key} has same value in both themes: ${darkVariables[key]}`)
      }
    }
  })
})
