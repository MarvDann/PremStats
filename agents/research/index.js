#!/usr/bin/env node

import { AgentWorker } from '../base/agent-worker.js'
import chalk from 'chalk'
import fetch from 'node-fetch'
import * as cheerio from 'cheerio'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname })

// Deep Research Agent for gathering knowledge and creating feature specs
async function handleResearchTask(task) {
  console.log(chalk.blue(`Research Agent processing: ${task.task}`))
  
  const taskLower = task.task.toLowerCase()
  
  try {
    if (taskLower.includes('feature spec') || taskLower.includes('specification')) {
      return await createFeatureSpec(task)
    } else if (taskLower.includes('competitor analysis') || taskLower.includes('competitive')) {
      return await performCompetitorAnalysis(task)
    } else if (taskLower.includes('best practices') || taskLower.includes('patterns')) {
      return await researchBestPractices(task)
    } else if (taskLower.includes('technology') || taskLower.includes('implementation')) {
      return await researchTechnology(task)
    } else if (taskLower.includes('user experience') || taskLower.includes('ux')) {
      return await researchUserExperience(task)
    } else {
      return await performGeneralResearch(task)
    }
  } catch (error) {
    console.error(chalk.red(`Research task failed: ${error.message}`))
    throw error
  }
}

// Create comprehensive feature specification based on research
async function createFeatureSpec(task) {
  console.log(chalk.gray('Creating feature specification...'))
  
  const feature = extractFeatureName(task.task)
  
  // Multi-step research process
  const research = {
    feature: feature,
    timestamp: new Date().toISOString(),
    sources: [],
    analysis: {}
  }
  
  try {
    // Step 1: Research existing implementations
    console.log(chalk.blue('Step 1: Researching existing implementations...'))
    research.analysis.existingImplementations = await searchExistingImplementations(feature)
    
    // Step 2: Analyze user needs and pain points
    console.log(chalk.blue('Step 2: Analyzing user needs...'))
    research.analysis.userNeeds = await analyzeUserNeeds(feature)
    
    // Step 3: Research technical requirements
    console.log(chalk.blue('Step 3: Researching technical requirements...'))
    research.analysis.technicalRequirements = await researchTechnicalRequirements(feature)
    
    // Step 4: Study best practices
    console.log(chalk.blue('Step 4: Studying best practices...'))
    research.analysis.bestPractices = await studyBestPractices(feature)
    
    // Step 5: Generate comprehensive feature spec
    console.log(chalk.blue('Step 5: Generating feature specification...'))
    const specification = generateFeatureSpecification(research)
    
    return {
      type: 'feature_specification',
      feature: feature,
      specification: specification,
      research: research,
      confidence: calculateConfidenceScore(research),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(chalk.red(`Feature spec creation failed: ${error.message}`))
    research.error = error.message
    return research
  }
}

// Perform competitor analysis
async function performCompetitorAnalysis(task) {
  console.log(chalk.gray('Performing competitor analysis...'))
  
  const domain = extractDomain(task.task)
  const searchQueries = generateCompetitorSearchQueries(domain)
  
  const analysis = {
    domain: domain,
    competitors: [],
    features: [],
    strengths: [],
    opportunities: [],
    timestamp: new Date().toISOString()
  }
  
  for (const query of searchQueries) {
    try {
      const results = await performWebSearch(query)
      analysis.competitors.push(...extractCompetitorInfo(results))
    } catch (error) {
      console.error(chalk.yellow(`Search failed for query "${query}": ${error.message}`))
    }
  }
  
  // Deduplicate and analyze
  analysis.competitors = deduplicateCompetitors(analysis.competitors)
  analysis.features = extractCommonFeatures(analysis.competitors)
  analysis.strengths = identifyCompetitorStrengths(analysis.competitors)
  analysis.opportunities = identifyMarketOpportunities(analysis.competitors)
  
  return {
    type: 'competitor_analysis',
    analysis: analysis,
    recommendations: generateCompetitorRecommendations(analysis),
    timestamp: new Date().toISOString()
  }
}

// Research best practices for specific technology/pattern
async function researchBestPractices(task) {
  console.log(chalk.gray('Researching best practices...'))
  
  const technology = extractTechnology(task.task)
  const searchQueries = generateBestPracticeQueries(technology)
  
  const practices = {
    technology: technology,
    patterns: [],
    antiPatterns: [],
    guidelines: [],
    examples: [],
    timestamp: new Date().toISOString()
  }
  
  for (const query of searchQueries) {
    try {
      const results = await performWebSearch(query)
      const extracted = extractBestPractices(results)
      
      practices.patterns.push(...extracted.patterns)
      practices.antiPatterns.push(...extracted.antiPatterns)
      practices.guidelines.push(...extracted.guidelines)
      practices.examples.push(...extracted.examples)
    } catch (error) {
      console.error(chalk.yellow(`Best practices search failed: ${error.message}`))
    }
  }
  
  return {
    type: 'best_practices',
    practices: practices,
    summary: summarizeBestPractices(practices),
    timestamp: new Date().toISOString()
  }
}

// Research technology implementation approaches
async function researchTechnology(task) {
  console.log(chalk.gray('Researching technology approaches...'))
  
  const tech = extractTechnology(task.task)
  const context = extractContext(task.task)
  
  const research = {
    technology: tech,
    context: context,
    approaches: [],
    tools: [],
    considerations: [],
    timestamp: new Date().toISOString()
  }
  
  const queries = [
    `${tech} implementation guide ${context}`,
    `${tech} best practices ${context}`,
    `${tech} architecture patterns`,
    `${tech} tools libraries frameworks`,
    `${tech} performance optimization`,
    `${tech} security considerations`
  ]
  
  for (const query of queries) {
    try {
      const results = await performWebSearch(query)
      const info = extractTechnicalInfo(results)
      
      research.approaches.push(...info.approaches)
      research.tools.push(...info.tools)
      research.considerations.push(...info.considerations)
    } catch (error) {
      console.error(chalk.yellow(`Technology research failed: ${error.message}`))
    }
  }
  
  return {
    type: 'technology_research',
    research: research,
    recommendations: generateTechRecommendations(research),
    timestamp: new Date().toISOString()
  }
}

// Research user experience patterns
async function researchUserExperience(task) {
  console.log(chalk.gray('Researching user experience patterns...'))
  
  const feature = extractFeatureName(task.task)
  const context = extractContext(task.task)
  
  const uxResearch = {
    feature: feature,
    context: context,
    patterns: [],
    usabilityPrinciples: [],
    examples: [],
    accessibility: [],
    timestamp: new Date().toISOString()
  }
  
  const queries = [
    `${feature} UX design patterns`,
    `${feature} user interface best practices`,
    `${feature} accessibility guidelines`,
    `${feature} usability principles`,
    `${context} user experience examples`
  ]
  
  for (const query of queries) {
    try {
      const results = await performWebSearch(query)
      const uxInfo = extractUXInfo(results)
      
      uxResearch.patterns.push(...uxInfo.patterns)
      uxResearch.usabilityPrinciples.push(...uxInfo.principles)
      uxResearch.examples.push(...uxInfo.examples)
      uxResearch.accessibility.push(...uxInfo.accessibility)
    } catch (error) {
      console.error(chalk.yellow(`UX research failed: ${error.message}`))
    }
  }
  
  return {
    type: 'ux_research',
    research: uxResearch,
    guidelines: generateUXGuidelines(uxResearch),
    timestamp: new Date().toISOString()
  }
}

// Perform general research
async function performGeneralResearch(task) {
  console.log(chalk.gray('Performing general research...'))
  
  const topic = extractTopic(task.task)
  const searchQueries = generateGeneralSearchQueries(topic)
  
  const research = {
    topic: topic,
    findings: [],
    sources: [],
    summary: '',
    timestamp: new Date().toISOString()
  }
  
  for (const query of searchQueries) {
    try {
      const results = await performWebSearch(query)
      research.findings.push(...extractKeyFindings(results))
      research.sources.push(...extractSources(results))
    } catch (error) {
      console.error(chalk.yellow(`General research failed: ${error.message}`))
    }
  }
  
  research.summary = generateResearchSummary(research.findings)
  
  return {
    type: 'general_research',
    research: research,
    timestamp: new Date().toISOString()
  }
}

// Web search implementation (using multiple search engines)
async function performWebSearch(query) {
  console.log(chalk.gray(`Searching: ${query}`))
  
  const results = []
  
  // Search multiple sources
  try {
    // DuckDuckGo search
    const duckResults = await searchDuckDuckGo(query)
    results.push(...duckResults)
  } catch (error) {
    console.error(chalk.yellow(`DuckDuckGo search failed: ${error.message}`))
  }
  
  return results
}

// DuckDuckGo search implementation
async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const results = []
    $('.result').each((i, element) => {
      const $result = $(element)
      const title = $result.find('.result__title').text().trim()
      const snippet = $result.find('.result__snippet').text().trim()
      const url = $result.find('.result__url').attr('href')
      
      if (title && snippet) {
        results.push({
          title: title,
          snippet: snippet,
          url: url,
          source: 'duckduckgo'
        })
      }
    })
    
    return results
  } catch (error) {
    console.error(chalk.red(`DuckDuckGo search error: ${error.message}`))
    return []
  }
}

// Helper functions for extracting information
function extractFeatureName(text) {
  // Simple extraction - could be enhanced with NLP
  const match = text.match(/(?:feature|spec|specification).*?(?:for|of)\s+([^,\.\n]+)/i)
  return match ? match[1].trim() : text.split(' ').slice(0, 3).join(' ')
}

function extractDomain(text) {
  const domains = ['football', 'sports', 'analytics', 'dashboard', 'web app']
  return domains.find(domain => text.toLowerCase().includes(domain)) || 'general'
}

function extractTechnology(text) {
  const techs = ['react', 'vue', 'angular', 'solidjs', 'nodejs', 'go', 'python', 'javascript', 'typescript']
  return techs.find(tech => text.toLowerCase().includes(tech)) || 'web development'
}

function extractContext(text) {
  if (text.includes('football') || text.includes('sports')) return 'sports application'
  if (text.includes('dashboard')) return 'dashboard interface'
  if (text.includes('api')) return 'api development'
  return 'web application'
}

function extractTopic(text) {
  return text.replace(/research|analyze|study|investigate/gi, '').trim()
}

// Generate search queries
function generateCompetitorSearchQueries(domain) {
  return [
    `${domain} top competitors analysis`,
    `best ${domain} applications 2024`,
    `${domain} software comparison`,
    `${domain} market leaders`
  ]
}

function generateBestPracticeQueries(technology) {
  return [
    `${technology} best practices 2024`,
    `${technology} coding standards`,
    `${technology} design patterns`,
    `${technology} anti-patterns avoid`
  ]
}

function generateGeneralSearchQueries(topic) {
  return [
    `${topic} overview`,
    `${topic} latest trends 2024`,
    `${topic} implementation guide`,
    `${topic} best practices`
  ]
}

// Placeholder functions for more sophisticated analysis
// These would be enhanced with proper NLP and analysis
function searchExistingImplementations(feature) {
  return Promise.resolve([`Research existing ${feature} implementations`])
}

function analyzeUserNeeds(feature) {
  return Promise.resolve([`Analyze user needs for ${feature}`])
}

function researchTechnicalRequirements(feature) {
  return Promise.resolve([`Research technical requirements for ${feature}`])
}

function studyBestPractices(feature) {
  return Promise.resolve([`Study best practices for ${feature}`])
}

function generateFeatureSpecification(research) {
  return {
    title: research.feature,
    description: `Comprehensive specification for ${research.feature}`,
    requirements: research.analysis,
    implementation: 'To be defined based on research findings',
    timeline: 'To be estimated',
    resources: 'To be allocated'
  }
}

function calculateConfidenceScore(research) {
  // Simple confidence calculation based on data availability
  let score = 0
  Object.values(research.analysis).forEach(analysis => {
    if (Array.isArray(analysis) && analysis.length > 0) score += 25
  })
  return Math.min(score, 100)
}

function extractCompetitorInfo(results) {
  return results.map(result => ({
    name: result.title,
    description: result.snippet,
    source: result.url
  }))
}

function deduplicateCompetitors(competitors) {
  const seen = new Set()
  return competitors.filter(comp => {
    const key = comp.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractCommonFeatures(competitors) {
  return competitors.map(comp => comp.description).slice(0, 10)
}

function identifyCompetitorStrengths(competitors) {
  return ['Market presence', 'Feature completeness', 'User experience']
}

function identifyMarketOpportunities(competitors) {
  return ['Performance optimization', 'Better UX', 'Advanced analytics']
}

function generateCompetitorRecommendations(analysis) {
  return [
    'Focus on differentiation',
    'Improve user experience',
    'Add unique features',
    'Optimize performance'
  ]
}

function extractBestPractices(results) {
  return {
    patterns: results.map(r => r.snippet).slice(0, 3),
    antiPatterns: [],
    guidelines: results.map(r => r.title).slice(0, 3),
    examples: []
  }
}

function summarizeBestPractices(practices) {
  return `Found ${practices.patterns.length} patterns and ${practices.guidelines.length} guidelines`
}

function extractTechnicalInfo(results) {
  return {
    approaches: results.map(r => r.snippet).slice(0, 2),
    tools: results.map(r => r.title).slice(0, 2),
    considerations: ['Performance', 'Security', 'Maintainability']
  }
}

function generateTechRecommendations(research) {
  return [
    'Choose proven technologies',
    'Follow industry standards',
    'Consider long-term maintenance',
    'Prioritize performance'
  ]
}

function extractUXInfo(results) {
  return {
    patterns: results.map(r => r.snippet).slice(0, 2),
    principles: ['Usability', 'Accessibility', 'Consistency'],
    examples: results.map(r => r.title).slice(0, 2),
    accessibility: ['WCAG compliance', 'Keyboard navigation', 'Screen reader support']
  }
}

function generateUXGuidelines(uxResearch) {
  return [
    'Prioritize user needs',
    'Ensure accessibility',
    'Maintain consistency',
    'Test with real users'
  ]
}

function extractKeyFindings(results) {
  return results.map(result => ({
    finding: result.snippet,
    source: result.title,
    url: result.url
  }))
}

function extractSources(results) {
  return results.map(result => ({
    title: result.title,
    url: result.url
  }))
}

function generateResearchSummary(findings) {
  return `Research completed with ${findings.length} key findings`
}

// Create and start the agent
const agent = new AgentWorker(
  'Deep Research Agent',
  'research',
  handleResearchTask
)

// Start the agent
agent.start().catch(error => {
  console.error(chalk.red(`Failed to start research agent: ${error}`))
  process.exit(1)
})