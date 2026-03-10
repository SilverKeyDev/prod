# Platform File Consolidation Design

## Overview

Systematic audit and consolidation of 210+ platform-specific files (.web.* and .native.*) in the SilverKey Client codebase to maximize code sharing while maintaining legitimate platform differences through a documented three-category exception system.

## Goals

- **Primary:** Maximize code sharing between web and React Native platforms
- **Secondary:** Document all legitimate platform divergences in config files
- **Tertiary:** Create sustainable process to prevent future unnecessary platform splits

## Current State Analysis

- **Total platform files:** 210+ files (78 .web.*, 132+ .native.*)
- **Currently documented exceptions:** 4 files in variants.json
- **Gap:** 206+ undocumented platform files in packages/
- **Architecture principle:** packages/ should be mostly shared; apps/ can be platform-specific

## Three-Category Exception System

### 1. primitives.json - UI Component Adaptations
- **Purpose:** Low-level UI components requiring platform-specific rendering
- **Examples:** Button, Image, Video, Input, Modal, ScrollView  
- **Criteria:** Shared API but different platform implementation (DOM vs Native Views)
- **Current state:** 4 entries, needs expansion to ~15-20 legitimate primitives

### 2. variants.json - Technology Swaps
- **Purpose:** Direct technology dependencies requiring different packages
- **Examples:** react-dom → RN renderer, framer-motion → reanimated, react-virtuoso → FlatList
- **Criteria:** Web package has no React Native equivalent
- **Current state:** Well documented in documentation/client/platformVariants/
- **Expected:** ~10-15 technology swaps

### 3. layouts.json - Layout & Navigation Differences (NEW)
- **Purpose:** High-level layout and navigation patterns differing by platform
- **Examples:** Home screen layout, sidebar navigation, desktop vs mobile reels view
- **Criteria:** Fundamentally different UX patterns between desktop and mobile
- **Current state:** Not yet created
- **Expected:** ~5-10 layout patterns

## Implementation Phases

### Phase 1: Systematic File Audit (Weeks 1-2)

**Decision Tree for Each File:**
1. Does it import web-only or native-only APIs? → variants.json
2. Is it a UI component with platform rendering differences? → primitives.json  
3. Is it a layout/navigation pattern difference? → layouts.json
4. None of above? → Mark for consolidation

**Deliverables:**
- Comprehensive audit spreadsheet with categorization
- Updated primitives.json (expand from 4 to ~15-20 entries)
- Updated variants.json (validate existing entries)
- New layouts.json with ~5-10 layout exceptions
- Phase 2 consolidation queue (~160+ files)

### Phase 2: Phased Consolidation (Weeks 3-6)

**Wave 1 - Easy Consolidations (Week 3):**
- Utilities and helpers with no platform logic
- Business logic accidentally split  
- Hook files without platform-specific APIs

**Wave 2 - UI Component Consolidation (Weeks 4-5):**
- Components incorrectly split despite using shared primitives
- Feature components that can use shared design system
- Forms and data display components

**Wave 3 - Complex Consolidations (Week 6):**
- Components with subtle platform differences
- Files with circular dependencies
- Edge cases requiring careful testing

### Phase 3: Enhanced Linter Rules (Week 7)

**New ESLint Rule:** `silverkey/platform-file-justification`
- Reads from packages/config/platform/ files
- Requires documentation for any new .web/.native files
- Enforces three-category system
- Prevents future unnecessary platform splits

## Expected Outcomes

**Before:** 210+ platform files  
**After:** ~30-50 legitimate platform files
- primitives.json: ~15-20 UI components
- variants.json: ~10-15 technology swaps  
- layouts.json: ~5-10 layout patterns
- **Consolidated:** ~160+ files become shared (.tsx/.ts)

## Risk Mitigation

- **Controlled phases** prevent breaking changes
- **Comprehensive testing** after each consolidation wave
- **Git branch strategy** for rollback capability
- **Component audit** to catch subtle UX differences
- **Documentation-first approach** ensures conscious decisions

## Success Metrics

- **Code sharing ratio:** Target 85%+ shared files in packages/
- **Documentation coverage:** 100% of platform files documented in config
- **Process sustainability:** New platform files require explicit justification
- **Functionality preservation:** No regression in user experience
- **Performance maintenance:** No degradation in build or runtime performance

## Related Documentation

- [Cross-Platform Component Reuse Strategy](.cursor/rules/shared/cross-platform-component-reuse.mdc)
- [Platform File Extensions Rules](.cursor/rules/frontend/platform-file-extensions.mdc)  
- [Platform Variants Documentation](documentation/client/platformVariants/README.md)
- [Technology Swap Rationale](documentation/client/platformVariants/technology-swap-rationale.md)