---
name: resolve-layouts-violation
description: Resolves ESLint violations from the layouts-justification rule by either consolidating files or documenting legitimate layout pattern exceptions
---

# Resolve Platform Layout Violations

## Overview

This skill helps resolve ESLint violations from the `silverkey/layouts-justification` rule. When you see this error, it means a layout/navigation file has platform-specific implementations that aren't documented in `layouts.json`.

## When This Rule Triggers

The layouts linter flags files that:
- Are in `/packages/` directory
- Have `.web.tsx` or `.native.tsx` extensions
- Match layout patterns (Layout, Screen, Page, Navigation, Container components)
- Are NOT documented in `packages/config/platform/layouts.json`

## Layout Patterns Detected

**File patterns that trigger this rule:**
- `/layout/`, `/layouts/`, `/screen/`, `/screens/`
- `/page/`, `/pages/`, `/shell/`, `/shells/`
- `/navigation/`, `/nav/`, `/container/`, `/containers/`
- Files ending in `Layout.web.tsx`, `Screen.native.tsx`, etc.
- `AppRoot.web.tsx`, `Root.native.tsx`

## Resolution Options

### Option 1: Use Responsive Design (Preferred)

**When to use:** When the same layout can adapt to different screen sizes using responsive design patterns.

**Steps:**
1. **Analyze layout differences** - are they just responsive variations?
2. **Create shared responsive component:**
   ```typescript
   // Before: HomeLayout.web.tsx + HomeLayout.native.tsx
   // After: HomeLayout.tsx (responsive)

   export function HomeLayout({ children }: HomeLayoutProps) {
     return (
       <Box className="home-layout">
         <Box className="hidden md:block md:w-64">
           <Sidebar />
         </Box>
         <Box className="flex-1">
           <Box className="md:hidden">
             <MobileNavigation />
           </Box>
           <main>{children}</main>
         </Box>
       </Box>
     );
   }
   ```

3. **Use design system breakpoints** and responsive utilities
4. **Remove platform-specific files** and update imports

### Option 2: Document as Legitimate Layout Difference

**When to use:** When platforms require fundamentally different navigation paradigms or layout structures.

**Steps:**
1. **Add entry to `packages/config/platform/layouts.json`:**
   ```json
   {
     "id": "app-navigation",
     "description": "Primary application navigation structure",
     "webPath": "packages/features/navigation/AppNavigation.web.tsx",
     "nativePath": "packages/features/navigation/AppNavigation.native.tsx",
     "reason": "Web uses sidebar navigation with react-router, native uses bottom tabs with react-navigation. Different navigation paradigms require separate implementations.",
     "category": "navigation"
   }
   ```

2. **Provide detailed justification** explaining why different layout patterns are necessary

## Decision Framework

### Use Responsive Design if:
- [ ] Same content, different arrangement
- [ ] Differences are viewport-based (desktop vs mobile)
- [ ] No fundamental interaction model changes
- [ ] Can be handled with CSS/design system breakpoints

### Document as Layout Difference if:
- [ ] Different navigation paradigms (sidebar vs tabs vs stack)
- [ ] Platform-specific interaction patterns
- [ ] Fundamentally different user flows
- [ ] Different information architecture requirements

## Common Layout Categories

### **Navigation Paradigms**
- **Web**: Sidebar navigation, breadcrumbs, URL routing
- **Native**: Tab navigation, stack navigation, gesture-based

**Example:**
```json
{
  "id": "primary-navigation",
  "category": "navigation",
  "reason": "Web uses persistent sidebar with nested routes, native uses bottom tabs with stack navigation"
}
```

### **App Shell Patterns**
- **Web**: Header + sidebar + main content area
- **Native**: Full-screen with overlays and modals

**Example:**
```json
{
  "id": "app-shell",
  "category": "app-shell",
  "reason": "Web supports persistent sidebar and multi-pane layouts, native uses full-screen stack pattern"
}
```

### **Responsive Layout Differences**
- **Desktop**: Multi-column, side-by-side views
- **Mobile**: Single-column, full-screen toggles

**Example:**
```json
{
  "id": "search-results-layout",
  "category": "responsive-layout",
  "reason": "Desktop shows map and list side-by-side, mobile toggles between full-screen map and list views"
}
```

### **Media Interaction Patterns**
- **Desktop**: Hover states, keyboard navigation
- **Mobile**: Touch gestures, swipe interactions

**Example:**
```json
{
  "id": "media-viewer",
  "category": "media-interaction",
  "reason": "Desktop uses hover preview and keyboard controls, mobile uses swipe gestures and touch interactions"
}
```

## Example Documentation Entries

```json
[
  {
    "id": "home-screen-structure",
    "description": "Main home/landing screen with platform-optimized layout",
    "webPath": "packages/features/home/HomeScreen.web.tsx",
    "nativePath": "packages/features/home/HomeScreen.native.tsx",
    "reason": "Desktop layout uses multi-column approach with sidebar and main content area, mobile uses full-screen vertical stack with bottom navigation",
    "category": "responsive-layout"
  },
  {
    "id": "modal-presentation",
    "description": "Modal and dialog presentation patterns",
    "webPath": "packages/ui/modals/ModalContainer.web.tsx",
    "nativePath": "packages/ui/modals/ModalContainer.native.tsx",
    "reason": "Web uses overlay modals with backdrop, native uses full-screen or slide-up presentation with platform-specific animations",
    "category": "interaction-pattern"
  }
]
```

## Responsive Design Patterns

**Use shared layout with responsive utilities:**
```typescript
// Responsive layout that works across platforms
export function SearchLayout({ children, showMap }: SearchLayoutProps) {
  return (
    <Box className="search-layout">
      {/* Desktop: side-by-side */}
      <Box className="hidden lg:flex lg:h-screen">
        <Box className="w-1/2 border-r">
          <SearchResults />
        </Box>
        <Box className="w-1/2">
          <MapView />
        </Box>
      </Box>

      {/* Mobile: toggle between views */}
      <Box className="lg:hidden">
        {showMap ? <MapView /> : <SearchResults />}
        <ToggleButton />
      </Box>
    </Box>
  );
}
```

## Verification Steps

After resolving the violation:

1. **Run linter:** `pnpm lint` (from `Client/`) should no longer show the violation
2. **Test responsive behavior:** Verify layout works across screen sizes
3. **Check platform parity:** Ensure functionality is equivalent on both platforms
4. **Verify navigation:** Test user flows work as expected

## Anti-Patterns to Avoid

❌ **Don't create separate layouts for:**
- Minor styling differences that could use design tokens
- Content that only needs responsive reordering
- Differences that could be handled with conditional rendering

❌ **Don't document as layout difference if:**
- Same layout could work with responsive design
- Differences are only cosmetic/styling
- No fundamental interaction model changes

## Layout Consolidation Examples

**Before (separate files):**
```typescript
// HomeLayout.web.tsx - Desktop layout
export function HomeLayout() {
  return (
    <div className="flex">
      <Sidebar className="w-64" />
      <main className="flex-1">{children}</main>
    </div>
  );
}

// HomeLayout.native.tsx - Mobile layout
export function HomeLayout() {
  return (
    <View style={{ flex: 1 }}>
      <BottomTabs />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
```

**After (responsive shared layout):**
```typescript
// HomeLayout.tsx - Responsive layout
export function HomeLayout({ children }: HomeLayoutProps) {
  return (
    <Box className="home-layout flex h-screen">
      {/* Desktop sidebar */}
      <Box className="hidden md:block w-64 border-r">
        <Sidebar />
      </Box>

      {/* Mobile bottom tabs */}
      <Box className="md:hidden fixed bottom-0 left-0 right-0">
        <BottomTabs />
      </Box>

      {/* Main content area */}
      <Box className="flex-1 pb-16 md:pb-0">
        {children}
      </Box>
    </Box>
  );
}
```

## Related Skills

- Use `platform-file-extension-choice` when creating new layout files
- Use `react-native-migration` when converting web layouts to work cross-platform
