---
name: resolve-primitives-violation
description: Resolves ESLint violations from the primitives-justification rule by either consolidating files or documenting legitimate UI primitive exceptions
---

# Resolve Platform Primitives Violations

## Overview

This skill helps resolve ESLint violations from the `silverkey/primitives-justification` rule. When you see this error, it means a UI primitive component has platform-specific implementations (.web/.native files) that aren't documented in `primitives.json`.

## When This Rule Triggers

The primitives linter flags files that:
- Are in `/packages/` directory
- Have `.web.tsx` or `.native.tsx` extensions
- Match UI primitive patterns (Button, Input, Modal, Image, etc.)
- Are NOT documented in `packages/config/platform/primitives.json`

## Resolution Options

### Option 1: Consolidate to Shared Component (Preferred)

**When to use:** If the web and native versions use the same API and can work cross-platform with shared primitives.

**Steps:**
1. **Compare the files** to see if they're identical or nearly identical
2. **Check for shared primitive usage** (Box, Text from design system)
3. **Consolidate if possible:**
   ```bash
   # Example: Button.web.tsx + Button.native.tsx → Button.tsx
   mv Button.web.tsx Button.tsx
   rm Button.native.tsx
   # Update all imports from ./Button.web to ./Button
   ```

**Example consolidation:**
```typescript
// Before: Button.web.tsx + Button.native.tsx (different implementations)
// After: Button.tsx (shared implementation)

import { Box, Text } from "../../primitives";
import { ButtonProps } from "./types";

export function Button({ children, variant, onPress, ...props }: ButtonProps) {
  return (
    <Box
      as="button"
      className={`btn btn-${variant}`}
      onPress={onPress}
      {...props}
    >
      <Text>{children}</Text>
    </Box>
  );
}
```

### Option 2: Document as Legitimate Primitive

**When to use:** If the component genuinely needs platform-specific rendering (HTML elements vs React Native components).

**Steps:**
1. **Add entry to `packages/config/platform/primitives.json`:**
   ```json
   {
     "id": "button-primitive",
     "kind": "component",
     "module": "packages/ui/components/primitives/button/Button",
     "platformIndependent": false,
     "reason": "Requires platform-specific press handling and ripple effects"
   }
   ```

2. **Provide clear justification** explaining why platform-specific implementations are necessary

## Decision Framework

Use this checklist to decide between consolidation and documentation:

### Consolidate if:
- [ ] Both files import only from shared design system
- [ ] No platform-specific APIs used (no react-dom, react-native imports)
- [ ] Same component API and behavior expected
- [ ] Uses shared primitives (Box, Text, etc.)

### Document if:
- [ ] Uses platform-specific rendering (DOM elements vs RN components)  
- [ ] Different interaction models (mouse/hover vs touch)
- [ ] Platform-specific styling requirements
- [ ] Performance optimizations specific to platform

## Common Primitives That Should Be Documented

**Legitimate platform-specific primitives:**
- **Button**: Different press handling (DOM events vs RN Pressable)
- **Input**: HTML input vs TextInput with different keyboard handling
- **Modal**: Portal vs react-native Modal component
- **Image**: HTML img vs react-native Image with different loading states
- **ScrollView**: CSS overflow vs react-native ScrollView

## Example Documentation Entries

```json
[
  {
    "id": "input-primitive",
    "kind": "component", 
    "module": "packages/ui/components/primitives/input/Input",
    "platformIndependent": false,
    "reason": "HTML input vs TextInput - different focus/keyboard behavior, validation, and accessibility requirements"
  },
  {
    "id": "modal-primitive",
    "kind": "component",
    "module": "packages/ui/components/modals/BaseModal", 
    "platformIndependent": false,
    "reason": "Web uses React Portal for DOM rendering, native uses react-native Modal component with different z-index and animation behavior"
  }
]
```

## Verification Steps

After resolving the violation:

1. **Run linter:** `npm run lint` should no longer show the violation
2. **Test build:** `npm run build` should pass
3. **Verify functionality:** Component works identically on both platforms

## Anti-Patterns to Avoid

❌ **Don't consolidate if:**
- Component behavior differs between platforms
- Requires platform-specific dependencies
- Would break existing functionality

❌ **Don't document if:**
- Files are actually identical
- Component could work cross-platform with minimal changes
- Only difference is styling that could be handled by shared design tokens

## Related Skills

- Use `platform-file-extension-choice` when creating new primitive files
- Use `react-native-migration` when converting web primitives to work cross-platform