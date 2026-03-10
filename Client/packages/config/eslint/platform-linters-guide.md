# Platform File Linters Guide

## Overview

The platform consolidation system includes three specialized ESLint rules that provide targeted guidance for different types of platform-specific file violations:

## The Three Linters

### 1. `silverkey/primitives-justification`
**Purpose**: Ensures UI primitive components with platform-specific implementations are documented.

**Triggers on**: Files matching UI primitive patterns (Button, Input, Modal, etc.) with `.web/.native` extensions.

**Resolution**: Use the `resolve-primitives-violation` cursor skill for guidance.

**Example violation**:
```
UI primitive 'Button.web.tsx' should be documented in packages/config/platform/primitives.json. 
This appears to be a platform-specific UI component that needs justification. 
Use the 'resolve-primitives-violation' skill for guidance on proper documentation.
```

### 2. `silverkey/variants-justification`  
**Purpose**: Ensures files using platform-specific technology dependencies are documented.

**Triggers on**: Files importing platform-specific libraries (react-dom, react-native, framer-motion, etc.).

**Resolution**: Use the `resolve-variants-violation` cursor skill for guidance.

**Example violation**:
```
Technology variant 'VideoPlayer.web.tsx' should be documented in packages/config/platform/variants.json. 
This file appears to use platform-specific dependencies and needs justification for why it cannot be shared. 
Use the 'resolve-variants-violation' skill for guidance on proper documentation.
```

### 3. `silverkey/layouts-justification`
**Purpose**: Ensures layout/navigation components with platform-specific patterns are documented.

**Triggers on**: Files matching layout patterns (Layout, Screen, Navigation, etc.) with platform extensions.

**Resolution**: Use the `resolve-layouts-violation` cursor skill for guidance.

**Example violation**:
```
Layout file 'HomeScreen.native.tsx' should be documented in packages/config/platform/layouts.json. 
This appears to implement different layout patterns between platforms and needs justification. 
Use the 'resolve-layouts-violation' skill for guidance on proper documentation.
```

## Configuration Files

Each linter checks against its corresponding configuration file:

- **Primitives**: `packages/config/platform/primitives.json`
- **Variants**: `packages/config/platform/variants.json`  
- **Layouts**: `packages/config/platform/layouts.json`

## Resolution Workflow

When you encounter a violation:

1. **Read the error message** to identify which linter flagged the file
2. **Use the appropriate cursor skill**:
   - Primitives → `resolve-primitives-violation` skill
   - Variants → `resolve-variants-violation` skill
   - Layouts → `resolve-layouts-violation` skill
3. **Follow the skill guidance** to either consolidate or document the file
4. **Verify resolution** with `npm run lint`

## Benefits of Targeted Linters

### Before (Generic Rule)
- Single generic error message for all platform files
- No specific guidance on resolution approach
- Unclear which config file to update

### After (Specialized Rules)
- Targeted error messages for each violation type
- Specific cursor skills with detailed resolution guidance
- Clear indication of which config file to update
- Category-specific decision frameworks

## Detection Logic

### Primitives Linter
**Detects**: Files in primitive-related paths or with primitive component names
**Patterns**: `/primitives/`, `/button/`, `/input/`, `Button.web.tsx`, etc.

### Variants Linter  
**Detects**: Files importing platform-specific dependencies
**Dependencies**: react-dom, react-native, framer-motion, react-virtuoso, etc.

### Layouts Linter
**Detects**: Files matching layout/navigation patterns
**Patterns**: `/layout/`, `/screen/`, `/navigation/`, `Layout.web.tsx`, etc.

## Maintenance

### Adding New Detection Patterns
Update the pattern arrays in each linter rule:
- `primitives-justification.js`: Update `isPrimitiveFile()` patterns
- `variants-justification.js`: Update `PLATFORM_DEPENDENCIES` arrays
- `layouts-justification.js`: Update `isLayoutFile()` patterns

### Performance Optimization  
All linters use 5-second caching for config file reads to minimize I/O overhead.

## Testing the Linters

```bash
# Run all linters to see current violations
npm run lint

# Check specific file types
npm run lint -- --ext .web.tsx
npm run lint -- --ext .native.tsx

# Test a specific file
npm run lint -- path/to/Component.web.tsx
```