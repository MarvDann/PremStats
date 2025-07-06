# PremStats E2E Testing Guide

## 🎯 Overview

End-to-end tests ensure that the PremStats application works correctly from a user perspective. These tests verify that pages load properly, navigation works, and the frontend integrates correctly with the backend API.

## 🧪 Test Coverage

### **Page Tests** (`pages.spec.ts`)
- ✅ **Home page loads correctly** - Verifies hero section, search, stats cards, navigation links
- ✅ **Navigation works correctly** - Tests routing between all pages
- ✅ **Mobile navigation works** - Tests responsive mobile menu
- ✅ **Teams page loads and functions** - Verifies teams list and search
- ✅ **Players page loads with content** - Checks player stats and data tables
- ✅ **Matches page loads with filters** - Tests season/limit filters
- ✅ **Statistics page loads with league table** - Verifies standings and legend
- ✅ **Pages handle errors gracefully** - Tests error state handling
- ✅ **App is responsive** - Tests different screen sizes
- ✅ **Loading states are displayed** - Verifies loading indicators

### **Team Detail Tests** (`team-detail.spec.ts`)
- ✅ **Team detail page loads from teams list** - Navigation from teams page
- ✅ **Team detail back button works** - Return navigation
- ✅ **Team detail handles invalid team ID** - Error handling for bad routes

### **API Integration Tests** (`api-integration.spec.ts`)
- ✅ **API endpoints are accessible** - Health check verification
- ✅ **Teams API integration works** - Frontend ↔ Backend communication
- ✅ **Seasons API integration works** - Dropdown population
- ✅ **Frontend handles API errors gracefully** - Error state testing
- ✅ **Frontend handles API timeouts gracefully** - Timeout handling
- ✅ **CORS is properly configured** - Cross-origin request testing

## 🚀 Running Tests

### **Command Line**
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI (visual test runner)
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# View test report
pnpm test:e2e:report
```

### **VS Code Tasks**
Use `Ctrl+Shift+P` → "Tasks: Run Task":
- **🎭 Run E2E Tests** - Run all tests headless
- **🎭 Run E2E Tests (UI Mode)** - Visual test runner
- **🎭 Run E2E Tests (Headed)** - Run with visible browser
- **📊 View E2E Test Report** - Open HTML report
- **🧪 Run All Tests** - Unit + E2E tests

## 🔧 Test Configuration

### **Playwright Config** (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Base URL**: http://localhost:3000
- **Auto-start**: Development server starts automatically
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### **Test Environment Setup**
1. **Prerequisites**: Tests require running backend API at localhost:8081
2. **Auto-start**: Frontend dev server starts automatically at localhost:3000
3. **Database**: Tests assume PostgreSQL and Redis are running

## 🎯 Test Scenarios

### **Critical Path Testing**
1. **Application Startup** - Ensures app loads without blank screens
2. **Page Navigation** - All routes accessible and working
3. **API Integration** - Frontend can communicate with backend
4. **Error Handling** - Graceful degradation when APIs fail
5. **Responsive Design** - Works on mobile and desktop

### **Data Flow Testing**
1. **Teams List → Team Detail** - Navigation and data loading
2. **Season Selection** - Dropdown interactions and API calls
3. **Search Functionality** - Filtering and results display
4. **Loading States** - Progress indicators during API calls

### **Browser Compatibility**
- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome on Android, Safari on iOS
- **Responsive**: Multiple viewport sizes tested

## 🚨 Troubleshooting

### **Tests Fail Due to Blank Page**
```bash
# Check if services are running
pnpm run setup
./quick-start.sh

# Verify API is accessible
curl http://localhost:8081/api/v1/health

# Check UI components are built
ls packages/ui/dist/
```

### **API Connection Issues**
```bash
# Ensure backend is running
cd packages/api && go run cmd/api/main.go

# Check Docker services
docker compose ps

# Test API manually
curl http://localhost:8081/api/v1/teams
```

### **Browser Dependencies Missing**
```bash
# Install Playwright browsers
pnpm exec playwright install

# Install system dependencies (Linux)
sudo pnpm exec playwright install-deps
```

### **Test Environment Issues**
```bash
# Clean restart everything
./stop.sh
./launch.sh

# Run tests with debugging
pnpm test:e2e:headed --debug
```

## 📊 Test Reports

### **HTML Report**
After running tests, view the HTML report:
```bash
pnpm test:e2e:report
```

### **CI/CD Integration**
Tests are configured for CI environments:
- **Headless mode** in CI
- **Retry on failure** (2 retries)
- **Parallel execution** disabled in CI
- **Screenshots and videos** on failure

## 🎯 Best Practices

### **Writing New Tests**
1. **Start with page load** - Verify basic page structure
2. **Test user journeys** - Complete workflows, not just individual actions
3. **Handle async operations** - Wait for API calls and loading states
4. **Test error scenarios** - Mock API failures and timeouts
5. **Be resilient** - Tests should handle varying data states

### **Test Maintenance**
1. **Update selectors** when UI changes
2. **Mock external dependencies** for consistent tests
3. **Keep tests focused** - One concern per test
4. **Use data attributes** for reliable element selection

The E2E tests provide confidence that the PremStats application works correctly for real users across different browsers and devices!