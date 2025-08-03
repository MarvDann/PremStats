# Validation Rules & Commit Strategy

This document defines the validation rules and commit strategy for PremStats feature development.

## 🎯 Feature Validation Rules

### Pre-Implementation Validation
- [ ] Feature is documented in `features/` directory
- [ ] Corresponding task file exists in `tasks/` directory with clear checkboxes
- [ ] All dependencies and requirements are identified
- [ ] Success criteria and validation metrics are defined
- [ ] Implementation approach is approved

### Development Validation
- [ ] Each task creates a separate, rollback-ready commit
- [ ] All existing tests continue to pass during development
- [ ] New functionality includes appropriate tests
- [ ] Code follows established style guidelines
- [ ] No breaking changes introduced without explicit approval

### Pre-Commit Validation
- [ ] `pnpm lint` passes without errors
- [ ] `pnpm typecheck` passes without errors  
- [ ] `pnpm test:unit` passes all tests
- [ ] `pnpm test:e2e` passes all tests
- [ ] Manual testing confirms feature works as expected
- [ ] Task checklist updated with progress

### Feature Completion Validation
- [ ] All task checkboxes marked complete
- [ ] All validation criteria in task file met
- [ ] Feature documentation updated
- [ ] No performance regressions introduced
- [ ] API endpoints (if applicable) tested and documented
- [ ] Frontend components (if applicable) tested across themes
- [ ] Database changes (if applicable) include proper migrations

## 🔄 Commit Strategy

### Commit Structure
Each feature implementation should follow this commit pattern:

```
feat(component): brief description of change

- Specific change 1
- Specific change 2
- Related to: features/feature-name.md
- Task: tasks/task-name.md

Validation:
- [x] All tests passing
- [x] Linting and type checks pass
- [x] Manual testing complete
- [x] Task checklist updated
```

### Commit Types
- **feat**: New feature implementation
- **fix**: Bug fixes
- **refactor**: Code refactoring without feature changes
- **style**: Styling and CSS changes
- **test**: Adding or updating tests
- **docs**: Documentation updates
- **chore**: Maintenance tasks

### Rollback Strategy
Each commit must be independently rollback-ready:
- **Atomic Changes**: Each commit represents a complete, functional state
- **No Breaking Commits**: Never commit broken or incomplete code
- **Clear Descriptions**: Commit messages clearly describe what was changed
- **Linked Tasks**: Commits reference specific task files and checkboxes
- **Validation Proof**: Commit messages include validation status

### Branch Strategy
- **Main Branch**: Always production-ready, all tests passing
- **Feature Branches**: Optional for complex features requiring multiple commits
- **Direct Commits**: Simple tasks can commit directly to main if all validation passes
- **Revert Policy**: Any commit can be reverted without breaking the system

## 🧪 Testing Requirements

### Automated Testing
- **Unit Tests**: All new components/functions must have unit tests
- **Integration Tests**: API changes require integration test coverage
- **E2E Tests**: User-facing features require E2E test coverage
- **Performance Tests**: Features affecting performance must include benchmarks

### Manual Testing
- **Cross-Browser**: Test in Chrome, Firefox, Safari
- **Responsive**: Test mobile and desktop viewports
- **Theme Testing**: Verify both light and dark themes
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Edge Cases**: Test error states and boundary conditions

### Test Coverage Requirements
- **Unit Tests**: Maintain >90% code coverage
- **E2E Tests**: Cover all critical user journeys
- **API Tests**: Cover all endpoints and error scenarios
- **Component Tests**: Test all props and interaction states

## 📊 Quality Gates

### Code Quality
- **Linting**: ESLint rules must pass
- **Type Safety**: TypeScript strict mode compliance
- **Performance**: No significant performance regressions
- **Security**: No security vulnerabilities introduced
- **Accessibility**: WCAG 2.1 AA compliance maintained

### Documentation Quality
- **Feature Docs**: Complete feature documentation in `features/`
- **Task Tracking**: Accurate task progress in `tasks/`
- **Code Comments**: Complex logic documented inline
- **API Docs**: Endpoint changes documented
- **README Updates**: User-facing changes reflected in docs

### Data Quality (for data features)
- **Validation**: Data import success rates >95%
- **Integrity**: No data corruption or loss
- **Performance**: Database queries remain efficient
- **Backup**: Critical data changes include backup procedures
- **Monitoring**: Data quality metrics tracked and reported

## 🚫 Blocking Conditions

### Never Commit If:
- [ ] Any test is failing
- [ ] Linting or type errors exist
- [ ] Feature breaks existing functionality
- [ ] Performance significantly degrades
- [ ] Security vulnerabilities introduced
- [ ] Accessibility standards violated
- [ ] Documentation is incomplete or outdated

### Immediate Rollback If:
- [ ] Production issues detected
- [ ] Data corruption occurs
- [ ] Security breach identified
- [ ] Performance severely impacted
- [ ] User-facing functionality broken
- [ ] Critical tests failing in CI/CD

## ✅ Success Criteria

A feature is considered complete when:
- [ ] All task checkboxes marked complete
- [ ] All validation rules satisfied
- [ ] All tests passing consistently
- [ ] Documentation comprehensive and accurate
- [ ] Performance maintained or improved
- [ ] No security or accessibility regressions
- [ ] Team review and approval received
- [ ] Production deployment successful

## 📈 Continuous Improvement

### Metrics Tracking
- Track validation rule compliance over time
- Monitor commit quality and rollback frequency
- Measure feature delivery speed vs quality
- Analyze test coverage trends
- Review documentation completeness

### Process Refinement
- Regular retrospectives on validation effectiveness
- Update rules based on lessons learned
- Incorporate new best practices
- Streamline validation where possible
- Maintain balance between rigor and productivity