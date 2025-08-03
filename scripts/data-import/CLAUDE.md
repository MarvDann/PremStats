# Data Import & Scraping - Claude Development Guide

This file provides data import and scraping-specific guidance for PremStats.

## 📊 Data Management Guidelines

### Import Dependencies & Workflow
- **Import Dependencies**: Squad data must be imported first before goal scorers (#28)
- **Name Normalization**: Critical for linking across data sources ("Mohamed Salah" vs "M. Salah") (#30)
- **Transfer Tracking**: Players need team attribution by season/date for transfers (#31)
- **Duplicate Handling**: Use aggressive name cleaning with diacritic normalization (#34)
- **Data Sources**: OpenFootball Project, API-Football, Football-Data.co.uk (#29)

### ⚠️ Critical Data Import Best Practices

#### 📊 Data Import & Validation (Critical Issue #43)
- **Always validate CSV parsing** with known data samples before bulk processing
- **Test player/team linking** on small datasets before production runs
- **Implement progressive debugging**: Start with 1 match, then 10, then 50, then production
- **Match Linking Strategy**: Use teams + date, not CSV IDs for cross-source linking
- **Data Quality**: Verify 80%+ success rates before considering import successful

#### 🕒 Date/Time Handling (Critical Issue #40)
- **NEVER** manipulate timezone offsets manually in date parsing
- **Use UTC date parsing**: `new Date(dateString + ' UTC')` to avoid timezone conversion
- **Example Bug**: `new Date(tempDate.getTime() + tempDate.getTimezoneOffset() * 60000)` converted "August 18" to "August 17"
- **Match Linking**: Date inconsistencies caused 0% match rate, fixed to 85.8% match rate
- **Best Practice**: Always validate date parsing with known test cases before production use

#### 🔧 Regex Patterns in JavaScript Strings (Critical Issue #41)
- **NEVER** use double-escaped regex in JavaScript: `\\d+` becomes literal `\d+` string, not regex
- **Correct**: `/(\d+)/` or `new RegExp('(\\d+)')`
- **Bug Impact**: Caused 100% parsing failure in goal minute extraction
- **Best Practice**: Test regex patterns immediately with simple examples

#### 🎯 Team Attribution Strategy (Critical Issue #44 - Phase 3)
- **NEVER** default all goals to home team - causes massive data skew (97% home goals)
- **Use CSV goal order and timing**: Match goals by minute and player name similarity
- **Implement Levenshtein distance**: For fuzzy player name matching across data sources
- **Validate team balance**: Home/away ratio should be ~1.3:1, not 34:1
- **Best Practice**: Always cross-reference team attribution with original source data

#### 🔍 Coverage Gap Analysis (Critical Issue #45 - Phase 4)
- **Identify high-impact targets first**: 50 high-scoring matches can add 394 goals
- **Use systematic gap analysis**: Seasonal, team, and temporal coverage patterns
- **Implement priority-based imports**: Focus on matches with highest goal potential
- **Data source validation**: Not all data sources cover all time periods consistently
- **Best Practice**: Analyze gaps before attempting data imports to maximize efficiency

#### 🏗️ Data Quality Framework (Critical Issue #46 - Phases 1-4)
- **Implement comprehensive validation**: Score consistency, team attribution, duplicates
- **Use progressive improvement**: 7.9% → 24.3% score consistency through systematic fixes
- **Build reusable validation tools**: Automated checks prevent regression
- **Track metrics continuously**: Coverage %, consistency %, attribution rates
- **Best Practice**: Validate after every major data operation to catch issues early

### 📚 KEY 6 SIGMA LEARNINGS - METHODOLOGY PROVEN
- **Historical Data Supremacy**: Verified historical sources must be treated as authoritative truth
- **No Assumptions Policy**: "Not just 3pm for everything" - eliminate all guessed data
- **Fixture-Based Approach**: Home/away team combinations more reliable than CSV IDs
- **Live Monitoring Essential**: Real-time visibility crucial for 6 Sigma quality maintenance
- **User Feedback Critical**: "Make sure date/time is accurate" drove breakthrough innovations

#### User Feedback: "Let's make sure the date / time of the match is accurate, not just 3pm for everything"
- **Problem**: Previous system assumed 3pm kick-off times for all matches
- **Solution**: Implemented verified historical time preservation - only use authenticated kick-off times and fallback to 3pm if we simply can not get the kcik off time
- **Impact**: Eliminated assumptions, achieved 93.8% fixture-based matching success
- **Learning**: User feedback drives breakthrough innovations in data authenticity

### 🔧 CRITICAL BREAKTHROUGHS - TECHNICAL INNOVATIONS

#### **Fixture-Based Matching System** - ✅ **REVOLUTIONARY**
- **Script**: `scripts/6sigma/fixture-based-matching.js` achieving 93.8% match success
- **Team Resolution**: Canonical name mapping with fuzzy algorithms handling 26+ team variations, never make any assumptions here. Verify with user
- **Date/Time Accuracy**: User requirement "not just 3pm for everything" - preserved historical authenticity
- **Historical Data Authority**: Treated verified sources as authoritative truth, no assumptions

### Data Import Scripts Status
- **Production Script**: `scripts/data/import-goals-to-existing-matches.js` ✅ **WORKING**
- **Data Source**: Kaggle Premier League Match Events (21 seasons) ✅ Downloaded
- **Test Results**: 986 goals successfully imported from 500 matches ✅ **VERIFIED**
- **Match Rate**: 85.8% (429/500 matches found) ✅ **EXCELLENT**
- **Player Linking**: 89.5% success rate (986 goals, 115 linking issues) ✅ **STRONG**

### 📊 Data Source Research & Strategy (August 2025)

#### Comprehensive Research Completed ✅
- **Research Document**: `docs/data-sourcing-research.md` - Complete analysis of all viable data sources
- **Primary Recommendation**: FBref (Sports Reference) - Complete 1992-present coverage, free access
- **Secondary Options**: Sportmonks API (commercial), Understat (xG metrics), Academic datasets

#### What We've Tried - Results
- **Football-Data.org**: ❌ Limited to 2 years only
- **Kaggle Match Events**: ✅ Successfully integrated (21 seasons)

#### Next Implementation Priority
1. **FBref Integration**: Use `soccerdata` Python library for comprehensive historical data
2. **Understat Integration**: Add xG/xA metrics for 2014+ seasons  
3. **Commercial API Evaluation**: Test Sportmonks 14-day trial for production reliability

#### Implementation Strategy
- **Phase 1**: FBref scraping for missing historical coverage
- **Phase 2**: Advanced analytics with Understat xG data
- **Phase 3**: Commercial API evaluation for production use

### Development Commands
```bash
# Start data agent (from project root)
node agents/data/index.js

# Dispatch data tasks
node scripts/agent-cli.js task data "Your task here"
node scripts/agent-cli.js status

# Run data import scripts
node scripts/data/import-goals-to-existing-matches.js
```

## Data Import Status
- **🔄 GOALS IMPORT STATUS (Phase 1: 2001-2022)** - ✅ **MAJOR BREAKTHROUGH**
- **Database Status**: 59,368 total goals in database ✅ **MASSIVE IMPROVEMENT**
- **API Integration**: Goal events serving correctly via REST API ✅ **WORKING**
- **Frontend Display**: Timeline shows goal scorer information ✅ **WORKING**