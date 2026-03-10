---
name: resolve-variants-violation
description: Resolves ESLint violations from the variants-justification rule by either consolidating files or documenting legitimate technology swap exceptions
---

# Resolve Platform Technology Variants Violations

## Overview

This skill helps resolve ESLint violations from the `silverkey/variants-justification` rule. When you see this error, it means a file uses platform-specific technology dependencies and isn't documented in `variants.json`.

## When This Rule Triggers

The variants linter flags files that:
- Are in `/packages/` directory  
- Have `.web.tsx` or `.native.tsx` extensions
- Import platform-specific dependencies (react-dom, react-native modules, etc.)
- Are NOT documented in `packages/config/platform/variants.json`

## Platform-Specific Dependencies Detected

**Web Dependencies:**
- `react-dom`, `react-router-dom`, `@headlessui/react`
- `react-virtuoso`, `framer-motion`, `hls.js`
- `lucide-react`, `embla-carousel-react`

**Native Dependencies:**
- `react-native`, `@react-native/*`, `@react-navigation/*`
- `react-native-reanimated`, `expo-av`, `react-native-video`
- `@expo/vector-icons`, `lucide-react-native`

## Resolution Options

### Option 1: Create Platform Adapter (Preferred)

**When to use:** When the same functionality can be achieved with different libraries but same API.

**Steps:**
1. **Create adapter layer** that abstracts the platform differences
2. **Move platform-specific code** into adapter implementations
3. **Use shared interface** in business logic

**Example - Animation adapter:**
```typescript
// packages/adapters/animation/Motion.tsx (shared interface)
export interface MotionProps {
  children: React.ReactNode;
  animate?: string;
  transition?: { duration: number };
}

// packages/adapters/animation/Motion.web.tsx
import { motion } from 'framer-motion';
export function Motion({ children, animate, transition }: MotionProps) {
  return (
    <motion.div animate={animate} transition={transition}>
      {children}
    </motion.div>
  );
}

// packages/adapters/animation/Motion.native.tsx  
import Animated from 'react-native-reanimated';
export function Motion({ children, animate, transition }: MotionProps) {
  return (
    <Animated.View>
      {children}
    </Animated.View>
  );
}
```

### Option 2: Document as Legitimate Technology Variant

**When to use:** When platform-specific libraries are necessary and cannot be abstracted.

**Steps:**
1. **Add entry to `packages/config/platform/variants.json`:**
   ```json
   {
     "id": "video-player",
     "description": "Video playback with HLS support",
     "webPath": "packages/ui/components/media/Video.web.tsx", 
     "nativePath": "packages/ui/components/media/Video.native.tsx",
     "reason": "Web uses hls.js for HLS streaming, native uses expo-av. Different media APIs and capabilities."
   }
   ```

2. **Document in `documentation/client/platformVariants/`** (if not already documented)

## Decision Framework

### Create Adapter if:
- [ ] Same functionality achievable on both platforms
- [ ] Different libraries but similar capabilities
- [ ] Business logic can be shared
- [ ] API can be unified

### Document as Variant if:  
- [ ] Fundamentally different platform capabilities
- [ ] Libraries serve the same purpose but have different APIs
- [ ] Already documented in `documentation/client/platformVariants/`
- [ ] Part of established technology swap pattern

## Common Technology Variants

**Navigation:**
- Web: `react-router-dom` 
- Native: `@react-navigation/native`
- **Reason**: Different routing paradigms (URL-based vs stack-based)

**Animation:**
- Web: `framer-motion`
- Native: `react-native-reanimated`
- **Reason**: Different animation engines and capabilities

**Video:**
- Web: `hls.js`
- Native: `expo-av` or `react-native-video`  
- **Reason**: Web needs MSE for HLS, native has built-in HLS support

**Icons:**
- Web: `lucide-react` (SVG)
- Native: `@expo/vector-icons` or `lucide-react-native`
- **Reason**: SVG rendering vs vector icons

**Lists:**
- Web: `react-virtuoso` 
- Native: `FlatList` (built-in)
- **Reason**: Web needs virtualization library, native has built-in virtualized lists

## Example Documentation Entries

```json
[
  {
    "id": "carousel-implementation",
    "description": "Image and content carousel with gesture support",
    "webPath": "packages/ui/components/carousel/Carousel.web.tsx",
    "nativePath": "packages/ui/components/carousel/Carousel.native.tsx", 
    "reason": "Web uses embla-carousel-react for DOM manipulation, native uses FlatList with horizontal scrolling and native gestures."
  },
  {
    "id": "router-navigation",
    "description": "Application routing and navigation",
    "webPath": "packages/navigation/router/",
    "nativePath": "packages/navigation/stack/",
    "reason": "Web uses react-router-dom for URL-based routing, native uses react-navigation for stack-based navigation with different deep linking."
  }
]
```

## Verification Steps

After resolving the violation:

1. **Run linter:** `npm run lint` should no longer show the violation
2. **Check documentation:** Ensure entry exists in `documentation/client/platformVariants/` if documented as variant
3. **Test functionality:** Verify feature works on both platforms
4. **Review API consistency:** If using adapter, ensure API is consistent

## Anti-Patterns to Avoid

❌ **Don't create adapters for:**
- Fundamentally different platform paradigms (DOM vs Native Views)
- Libraries that can't be reasonably abstracted
- One-off usage that won't be reused

❌ **Don't document as variant if:**
- Same library can be used on both platforms
- Difference is only in configuration, not library choice
- Can be resolved with conditional imports or feature detection

## Related Documentation

All documented variants should have corresponding documentation in:
- `documentation/client/platformVariants/[library-name].md`
- `documentation/client/platformVariants/technology-swap-rationale.md`

## Related Skills

- Use `react-native-migration` when converting web code to work with native variants
- Use `platform-file-extension-choice` when creating new variant files