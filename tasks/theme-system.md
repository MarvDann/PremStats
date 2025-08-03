# Theme System Tasks

**Feature**: [Theme System](../features/theme-system.md)
**Status**: 🔄 **IN PROGRESS** - Base implementation complete, refinements needed

## Completed Tasks ✅

### Core Theme Infrastructure
- [x] Create ThemeContext.tsx for SolidJS state management
- [x] Implement ThemeSwitcher.tsx component with sun/moon icons
- [x] Add CSS variable definitions in apps/web/src/index.css
- [x] Integrate ThemeProvider wrapper in Layout.tsx
- [x] Add localStorage persistence for theme preferences
- [x] Implement system preference detection

### Component Integration
- [x] Update all UI components to use CSS variables
- [x] Remove hard-coded Tailwind color classes
- [x] Implement table row colors for league qualification zones
- [x] Ensure theme switching works across all components
- [x] Add theme support to navigation bar (desktop + mobile)

### Testing & Validation
- [x] Create E2E tests for theme switching
- [x] Test theme persistence across page reloads
- [x] Verify mobile menu theme integration
- [x] Update unit tests to expect CSS variable classes
- [x] Test accessibility (ARIA labels, keyboard navigation)

## Pending Improvements 🔄

### Light Theme Enhancements
- [ ] Improve light theme color palette for better readability
- [ ] Enhance light theme contrast ratios
- [ ] Refine light theme component styling
- [ ] Optimize light theme table colors
- [ ] Test light theme across all components and pages

### Dark Theme Refinements
- [ ] Implement dark theme badge styling
- [ ] Improve dark theme component contrast
- [ ] Refine dark theme navigation styling
- [ ] Optimize dark theme table row colors
- [ ] Enhance dark theme form elements

### CSS Variable Cleanup
- [ ] Consolidate all CSS variables into single source of truth
- [ ] Remove duplicate or unused CSS variables
- [ ] Standardize CSS variable naming convention
- [ ] Create comprehensive CSS variable documentation
- [ ] Ensure consistent variable usage across all components

### Remove Tailwind Variants
- [ ] Identify all tailwind-variants usage in codebase
- [ ] Replace tailwind-variants with standard CSS/Tailwind classes
- [ ] Remove tailwind-variants dependency from package.json
- [ ] Update component styling to use standard approaches
- [ ] Test all components after variants removal

### Look & Feel Improvements
- [ ] Improve overall design consistency
- [ ] Enhance component visual hierarchy
- [ ] Refine spacing and typography
- [ ] Improve hover and focus states
- [ ] Polish transition animations
- [ ] Optimize mobile responsive design

### Color System Overhaul
- [ ] Replace HSL color system with more understandable format
- [ ] Create clear color naming conventions
- [ ] Simplify color variable structure
- [ ] Document color usage guidelines
- [ ] Ensure accessibility compliance for all color combinations

## Validation Criteria

### Completed ✅
- [x] All 122 unit tests passing with CSS variable expectations
- [x] E2E tests cover theme switching, persistence, mobile support
- [x] Accessibility requirements met (ARIA labels, keyboard nav)
- [x] Theme preferences persist across browser sessions

### Pending 🔄
- [ ] Light theme improvements validated by visual testing
- [ ] Dark theme refinements tested across all components
- [ ] CSS variables consolidated into single source
- [ ] Tailwind variants completely removed
- [ ] Color system simplified and documented
- [ ] Overall look and feel improvements validated
- [ ] No performance regressions from improvements
- [ ] All components work correctly after changes

## Next Steps
1. **Light Theme Enhancement**: Focus on improving color palette and readability
2. **Dark Theme Badge Styling**: Implement proper dark theme badge components
3. **CSS Variable Consolidation**: Create single source of truth for all variables
4. **Tailwind Variants Removal**: Systematically remove and replace with standard CSS
5. **Color System Simplification**: Move away from HSL to more understandable format

## Commits Strategy
Each improvement should be implemented as a separate commit that can be rolled back:
- [ ] Commit: Light theme color palette improvements
- [ ] Commit: Dark theme badge styling implementation
- [ ] Commit: CSS variable consolidation
- [ ] Commit: Tailwind variants removal
- [ ] Commit: Color system simplification
- [ ] Commit: Final look and feel polish