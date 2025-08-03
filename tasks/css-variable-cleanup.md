# CSS Variable Cleanup & Consolidation

**Feature**: [Theme System](../features/theme-system.md)
**Status**: 📋 **PENDING** - Part of theme system improvements

## Objective
Create a single source of truth for all CSS variables, eliminate HSL color usage, and standardize variable naming across the entire application.

## Current Issues
- CSS variables scattered across multiple files
- HSL color format hard to understand and maintain
- Inconsistent variable naming conventions
- Duplicate or unused variables
- No centralized documentation

## Tasks

### CSS Variable Audit
- [ ] Catalog all existing CSS variables across codebase
- [ ] Identify duplicate variables with different names
- [ ] Find unused or orphaned variables
- [ ] Document current variable usage patterns
- [ ] Map variable dependencies between components

### Create Single Source of Truth
- [ ] Design centralized CSS variable structure
- [ ] Choose primary location for variable definitions
- [ ] Create variable organization system (colors, spacing, typography, etc.)
- [ ] Establish clear naming conventions
- [ ] Document variable hierarchy and relationships

### Replace HSL Color System
- [ ] Convert HSL variables to hex/rgb format for clarity
- [ ] Maintain color accessibility while simplifying format
- [ ] Update all color variable definitions
- [ ] Test color consistency across light/dark themes
- [ ] Document new color system guidelines

### Standardize Naming Convention
- [ ] Define variable naming standards (--prefix-category-property)
- [ ] Rename existing variables to follow convention
- [ ] Update all component references to new names
- [ ] Create variable naming documentation
- [ ] Implement linting rules for variable naming

### Consolidate Variable Files
- [ ] Move all variables to centralized location
- [ ] Remove variable definitions from scattered files
- [ ] Update import/usage patterns
- [ ] Ensure proper cascade and specificity
- [ ] Test variable resolution across all components

### Component Updates
- [ ] Update all UI components to use new variables
- [ ] Remove hard-coded color values
- [ ] Ensure consistent variable usage patterns
- [ ] Test all components with new variable system
- [ ] Update component documentation

### Documentation & Guidelines
- [ ] Create comprehensive variable documentation
- [ ] Document color system and usage guidelines
- [ ] Create examples for common variable patterns
- [ ] Establish maintenance procedures
- [ ] Create developer guidelines for adding new variables

## Proposed Structure
```css
/* Primary Variables - Single Source of Truth */
:root {
  /* Colors - Simple hex/rgb format */
  --color-primary: #7c3aed;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-danger: #ef4444;
  --color-warning: #f59e0b;
  
  /* Theme Colors */
  --color-background: #ffffff;
  --color-foreground: #1e293b;
  --color-muted: #f8fafc;
  --color-border: #e2e8f0;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
}

[data-theme="dark"] {
  --color-background: #0f172a;
  --color-foreground: #f1f5f9;
  --color-muted: #1e293b;
  --color-border: #334155;
}
```

## Validation Criteria
- [ ] All CSS variables defined in single location
- [ ] HSL format completely removed
- [ ] Consistent naming convention applied
- [ ] No duplicate or unused variables
- [ ] All components use centralized variables
- [ ] Theme switching works correctly
- [ ] No visual regressions introduced
- [ ] Performance maintained or improved

## Implementation Strategy
1. **Audit Phase**: Catalog existing variables and usage
2. **Design Phase**: Create new variable structure and naming
3. **Migration Phase**: Systematically update components
4. **Testing Phase**: Validate all components and themes
5. **Documentation Phase**: Create comprehensive guidelines

## Success Metrics
- **Centralization**: 100% of variables in single source
- **Consistency**: All variables follow naming convention
- **Clarity**: No HSL format, clear color definitions
- **Maintainability**: Easy to add/modify variables
- **Performance**: No regression in CSS load times
- **Developer Experience**: Clear documentation and guidelines

## Related Tasks
- [Theme System](theme-system.md) - Overall theme improvements
- [Tailwind Variants Removal](remove-tailwind-variants.md) - Styling system cleanup