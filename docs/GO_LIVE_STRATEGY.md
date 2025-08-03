# PremStats Go-Live Strategy: Netlify + Railway Deployment

## Overview
This document outlines the complete deployment strategy for PremStats using Netlify for frontend hosting and Railway for backend services. The strategy includes staging environments, automated deployments, and comprehensive monitoring.

## Architecture

### Frontend (Netlify)
- **Production**: premstats.uk
- **Staging**: staging--premstats.netlify.app
- **Preview Deployments**: Auto-generated for each PR
- **CDN**: Global edge network included
- **SSL**: Automatic certificate provisioning

### Backend (Railway)
- **Production API**: api.premstats.uk
- **Staging API**: api-staging.premstats.uk
- **Database**: PostgreSQL (separate staging/production instances)
- **Cache**: Redis for performance optimization
- **Monitoring**: Built-in metrics and logging

## Cost Analysis

### Monthly Estimates
- **Netlify Frontend**: £0 (free tier: 100GB bandwidth, 300 build minutes)
- **Railway Backend**: 
  - Staging: ~£5-10/month (lower usage)
  - Production: ~£10-15/month (API + PostgreSQL + Redis)
- **Total**: ~£15-25/month for complete infrastructure

### Cost Optimization Tips
- Use Netlify's free tier features effectively
- Railway charges only for actual usage (CPU/memory hours)
- Consider caching strategies to reduce database queries
- Monitor usage patterns and scale accordingly

## Pre-Deployment Checklist

### Code Preparation
- [ ] All tests passing (unit, integration, E2E)
- [ ] No console.log statements in production code
- [ ] Environment variables documented
- [ ] API endpoints documented
- [ ] Error handling implemented
- [ ] Loading states for all async operations
- [ ] Mobile responsiveness verified

### Security Checklist
- [ ] API rate limiting configured
- [ ] CORS settings properly restricted
- [ ] Database connection using SSL
- [ ] Sensitive data in environment variables only
- [ ] Input validation on all forms
- [ ] SQL injection prevention verified
- [ ] XSS protection headers configured

### Performance Checklist
- [ ] Images optimized and lazy-loaded
- [ ] JavaScript bundles code-split
- [ ] CSS minimized
- [ ] Gzip compression enabled
- [ ] Database queries optimized
- [ ] Redis caching implemented
- [ ] API response times < 200ms

## Configuration Files

### 1. netlify.toml (Frontend Configuration)
```toml
[build]
  command = "pnpm build"
  publish = "apps/web/dist"

[build.environment]
  NODE_VERSION = "20"

# Production context
[context.production]
  command = "pnpm build"
  environment = { VITE_API_URL = "https://api.premstats.uk", VITE_ENV = "production" }

# Staging/branch deploys
[context.branch-deploy]
  command = "pnpm build"
  environment = { VITE_API_URL = "https://api-staging.premstats.uk", VITE_ENV = "staging" }

# Deploy previews for PRs
[context.deploy-preview]
  command = "pnpm build"
  environment = { VITE_API_URL = "https://api-staging.premstats.uk", VITE_ENV = "preview" }

# SPA routing support
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.premstats.uk https://api-staging.premstats.uk"

# Cache static assets
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Cache images
[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=604800"
```

### 2. railway.json (Backend Configuration)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "docker/Dockerfile.api.production"
  },
  "deploy": {
    "numReplicas": 1,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  },
  "environments": {
    "production": {
      "deploy": {
        "numReplicas": 2
      }
    },
    "staging": {
      "deploy": {
        "numReplicas": 1
      }
    }
  }
}
```

### 3. Production API Dockerfile
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go mod files
COPY packages/api/go.mod packages/api/go.sum ./
RUN go mod download

# Copy source code
COPY packages/api .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o api cmd/api/main.go

# Production stage
FROM alpine:latest

# Install runtime dependencies
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/api .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["./api"]
```

### 4. Production Frontend Build Script
Create `scripts/build-production.sh`:
```bash
#!/bin/bash
set -e

echo "Building PremStats for production..."

# Install dependencies
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build UI library first
echo "Building UI library..."
pnpm --filter @premstats/ui build

# Run tests
echo "Running tests..."
pnpm lint
pnpm typecheck
pnpm test:unit

# Build frontend
echo "Building frontend..."
pnpm --filter @premstats/web build

echo "Production build complete!"
```

## Environment Variables

### Netlify (Frontend)
```env
# Production
VITE_API_URL=https://api.premstats.uk
VITE_ENV=production

# Staging
VITE_API_URL=https://api-staging.premstats.uk
VITE_ENV=staging
```

### Railway (Backend)
```env
# Production Environment
DATABASE_URL=${{POSTGRES.DATABASE_URL}}
REDIS_URL=${{REDIS.REDIS_URL}}
PORT=8080
ENV=production
CORS_ORIGINS=https://premstats.uk,https://www.premstats.uk
LOG_LEVEL=info
# Add any API keys or secrets here

# Staging Environment
DATABASE_URL=${{POSTGRES.DATABASE_URL}}
REDIS_URL=${{REDIS.REDIS_URL}}
PORT=8080
ENV=staging
CORS_ORIGINS=https://staging--premstats.netlify.app,http://localhost:3000
LOG_LEVEL=debug
```

## Step-by-Step Deployment Guide

### Phase 1: Initial Setup (Day 1-2)

#### 1. Create Accounts
- [ ] Sign up for Netlify account
- [ ] Sign up for Railway account
- [ ] Connect GitHub to both services

#### 2. Netlify Setup
```bash
# Install Netlify CLI (optional but helpful)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Create new site
netlify init

# Link to existing site (if already created in UI)
netlify link
```

#### 3. Railway Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new premstats-backend

# Link to project
railway link
```

### Phase 2: Database Migration (Day 3-4)

#### 1. Export Local Database
```bash
# Create backup directory
mkdir -p backups/migration

# Export full database
pg_dump -h localhost -U premstats -d premstats -f backups/migration/premstats_full.sql

# Export schema only (for reference)
pg_dump -h localhost -U premstats -d premstats --schema-only -f backups/migration/premstats_schema.sql
```

#### 2. Import to Railway Staging
```bash
# Switch to staging environment
railway environment staging

# Create PostgreSQL service
railway add postgresql

# Get database URL
railway variables

# Import database
railway run psql < backups/migration/premstats_full.sql

# Verify import
railway run psql -c "SELECT COUNT(*) FROM matches;"
```

#### 3. Import to Railway Production (after testing)
```bash
# Switch to production environment
railway environment production

# Repeat import process
railway add postgresql
railway run psql < backups/migration/premstats_full.sql
```

### Phase 3: Deploy Backend (Day 5-6)

#### 1. Deploy to Staging
```bash
# Create staging branch if not exists
git checkout -b staging
git push origin staging

# Deploy to Railway staging
railway up --environment staging
```

#### 2. Test Staging API
```bash
# Health check
curl https://api-staging.premstats.uk/health

# Test endpoints
curl https://api-staging.premstats.uk/api/v1/teams
curl https://api-staging.premstats.uk/api/v1/matches?limit=10
```

#### 3. Deploy to Production
```bash
# After staging tests pass
git checkout main
git merge staging
git push origin main

# Deploy to Railway production
railway up --environment production
```

### Phase 4: Deploy Frontend (Day 7-8)

#### 1. Configure Netlify Site
- Go to Netlify Dashboard
- Create new site from Git
- Connect to GitHub repository
- Configure build settings:
  - Build command: `pnpm build`
  - Publish directory: `apps/web/dist`
  - Add environment variables

#### 2. Deploy Staging
- Set up branch deploys for `staging` branch
- Push to staging branch
- Verify deployment at staging URL

#### 3. Deploy Production
- Configure custom domain (premstats.uk)
- Push to main branch
- Verify deployment

### Phase 5: Domain Configuration (Day 9)

#### 1. GoDaddy DNS Settings
```
# Remove any existing A records for @ and www

# Add Netlify DNS records
Type    Name    Value                           TTL
A       @       75.2.60.5                      600
CNAME   www     premstats.uk                   600

# Add Railway API subdomain
CNAME   api     [railway-production-domain]    600
CNAME   api-staging [railway-staging-domain]   600
```

#### 2. SSL Configuration
- Netlify: Automatic SSL provisioning
- Railway: Automatic SSL for custom domains
- Verify HTTPS works for all domains

### Phase 6: Monitoring Setup (Day 10)

#### 1. Uptime Monitoring
```yaml
# UptimeRobot configuration
monitors:
  - name: PremStats Frontend
    url: https://premstats.uk
    interval: 5 minutes
    
  - name: PremStats API
    url: https://api.premstats.uk/health
    interval: 5 minutes
    
  - name: PremStats Staging
    url: https://staging--premstats.netlify.app
    interval: 15 minutes
```

#### 2. Error Tracking
- Sign up for Sentry
- Install Sentry SDK in frontend and backend
- Configure error reporting

#### 3. Analytics
- Add Google Analytics 4 to frontend
- Configure conversion tracking
- Set up custom events

## Deployment Workflows

### Feature Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/team-comparison

# 2. Develop and test locally
pnpm dev

# 3. Push to GitHub
git push origin feature/team-comparison

# 4. Create PR
# - Netlify creates preview deployment
# - Run CI/CD tests
# - Review preview at: deploy-preview-XX--premstats.netlify.app

# 5. Merge to staging
git checkout staging
git merge feature/team-comparison
git push origin staging

# 6. Test in staging environment
# - Frontend: staging--premstats.netlify.app
# - API: api-staging.premstats.uk

# 7. Merge to production
git checkout main
git merge staging
git push origin main
```

### Hotfix Workflow
```bash
# 1. Create hotfix from main
git checkout -b hotfix/critical-bug main

# 2. Fix and test
# Make fixes
pnpm test

# 3. Deploy directly to staging for testing
git push origin hotfix/critical-bug

# 4. Fast-track to production
git checkout main
git merge hotfix/critical-bug
git push origin main

# 5. Backport to staging
git checkout staging
git merge main
git push origin staging
```

### Rollback Procedures

#### Frontend Rollback (Netlify)
1. Go to Netlify Dashboard > Deploys
2. Find last working deployment
3. Click "Publish deploy" on the good version
4. Instant rollback complete

#### Backend Rollback (Railway)
1. Go to Railway Dashboard
2. Select the service to rollback
3. Go to Deployments tab
4. Click "Rollback" on the last working version
5. Confirm rollback

## Maintenance Tasks

### Daily
- [ ] Check uptime monitoring alerts
- [ ] Review error logs in Sentry
- [ ] Monitor API response times
- [ ] Check database connection pool

### Weekly
- [ ] Review Google Analytics data
- [ ] Check Railway usage and costs
- [ ] Review and merge dependabot PRs
- [ ] Database backup verification

### Monthly
- [ ] Security updates review
- [ ] Performance audit
- [ ] Cost analysis and optimization
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] SSL certificate check (should auto-renew)

## Troubleshooting Guide

### Common Issues and Solutions

#### Frontend Not Building on Netlify
```bash
# Check build logs in Netlify dashboard
# Common fixes:
- Ensure NODE_VERSION is set to 20
- Check pnpm-lock.yaml is committed
- Verify UI library builds first
- Clear cache and retry: Netlify Dashboard > Site Settings > Build & Deploy > Clear Cache
```

#### API Connection Issues
```bash
# Verify CORS settings
# Check Railway logs: railway logs

# Test from browser console:
fetch('https://api.premstats.uk/health')
  .then(r => r.json())
  .then(console.log)
```

#### Database Connection Errors
```bash
# Check connection string
railway variables

# Test connection
railway run psql -c "SELECT NOW();"

# Check connection pool settings
# Ensure max connections not exceeded
```

## Success Metrics

### Technical Metrics
- **Uptime**: > 99.9%
- **API Response Time**: < 200ms average
- **Page Load Time**: < 2 seconds
- **Error Rate**: < 0.1%
- **SSL Rating**: A+ on SSL Labs

### Business Metrics
- **User Growth**: Track weekly active users
- **Engagement**: Average session duration
- **Performance**: Core Web Vitals scores
- **SEO**: Search ranking improvements

## Post-Launch Tasks

### Week 1 After Launch
- [ ] Monitor all metrics closely
- [ ] Address any user-reported issues
- [ ] Fine-tune caching strategies
- [ ] Optimize slow queries
- [ ] Update documentation

### Month 1 After Launch
- [ ] Implement user feedback
- [ ] Plan feature roadmap
- [ ] Optimize costs based on usage
- [ ] Security audit
- [ ] Performance optimization

## Emergency Contacts

### Service Providers
- **Netlify Support**: https://www.netlify.com/support/
- **Railway Support**: https://railway.app/help
- **GoDaddy Support**: 24/7 phone support

### Team Contacts
- **Project Lead**: [Your contact]
- **Backend Engineer**: [Contact]
- **Frontend Engineer**: [Contact]
- **DevOps**: [Contact]

## Appendix

### Useful Commands
```bash
# Netlify CLI
netlify dev          # Local development with Netlify features
netlify deploy       # Manual deploy
netlify open         # Open Netlify dashboard
netlify logs         # View function logs

# Railway CLI
railway up           # Deploy current directory
railway logs         # View logs
railway run [cmd]    # Run command in Railway environment
railway variables    # List environment variables

# Database
railway run psql     # Connect to database
railway run pg_dump  # Backup database
```

### Resources
- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [SolidJS Deployment Guide](https://www.solidjs.com/guides/deployment)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: Before deployment