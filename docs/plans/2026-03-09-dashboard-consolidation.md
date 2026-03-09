# Dashboard Components Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate dashboard components to eliminate 1,200+ lines of duplicate code across web and mobile platforms using primitive-first architecture.

**Architecture:** Replace all .native.tsx files with single .tsx components using cross-platform primitives (Box, ScrollView, Text, Pressable). Preserve all existing business logic and hooks while unifying UI rendering.

**Tech Stack:** React, TypeScript, Cross-platform UI primitives, existing hooks (useAgentClients, useAgentTodos, etc.)

---

### Task 1: Consolidate DashboardScreen Component (380 lines saved)

**Files:**
- Modify: `Client/packages/features/dashboard/components/DashboardScreen.native.tsx` → consolidate into unified component
- Create: `Client/packages/features/dashboard/components/DashboardScreen.tsx` (consolidated)
- Update: All imports referencing DashboardScreen components

**Step 1: Create consolidated DashboardScreen.tsx**

Create new file using primitives and preserving all business logic:

```typescript
import React, { useCallback, useMemo, useState } from "react";
import { useNavigation } from "packages/navigation";
import { color } from "packages/design-tokens";
import { Calendar, UpcomingEvents } from "packages/features/calendar";
import { useSavedPageView } from "packages/features/documents";
import { useIsAgent } from "packages/features/homeauth";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box, ScrollView, Text, Pressable, Input } from "packages/ui/components/primitives";
import { dateNow, dateParseISO } from "packages/utils/date";

// ... preserve all existing business logic, types, and functions from native version
// Replace FlatList with ScrollView, View with Box, TouchableOpacity with Pressable

export function DashboardScreen() {
  // ... all existing hooks and state logic preserved identically
  
  return (
    <ScrollView className="flex-1">
      <Box className="gap-6 px-4 pb-8 pt-4">
        {/* Preserve all existing UI structure using primitives */}
        {isAgent ? (
          <Box className="gap-3">
            <Text className="text-lg font-medium text-gray-800">Today</Text>
            <DashboardTodosSection isAgent={isAgent} />
            {/* ... all other sections using Box, Text, Pressable */}
          </Box>
        ) : null}
        
        <Box className="gap-3">
          <Text className="text-lg font-medium text-gray-800">Upcoming Events</Text>
          <UpcomingEvents embedInListHeader />
        </Box>
        
        <DashboardChecklists />
        
        <Box className="gap-3">
          <Text className="text-lg font-medium text-gray-800">Calendar</Text>
          <Calendar />
        </Box>
        
        {/* Client list section preserved with ScrollView instead of FlatList */}
      </Box>
    </ScrollView>
  );
}
```

**Step 2: Update imports in DashboardFeature.tsx**

```typescript
// Change import from:
// import DashboardScreenNative from "./DashboardScreen.native";
// To:
import { DashboardScreen } from "./DashboardScreen";
```

**Step 3: Scan and update all imports referencing DashboardScreen**

Run: `grep -r "DashboardScreen" Client/packages/features/dashboard/ Client/apps/`
Update all imports to use consolidated component

**Step 4: Test consolidated component**

Run: `cd Client && npm run lint`
Expected: No linting errors for DashboardScreen

**Step 5: Delete redundant native file**

```bash
rm Client/packages/features/dashboard/components/DashboardScreen.native.tsx
```

**Step 6: Commit consolidation**

```bash
git add .
git commit -m "feat: consolidate DashboardScreen components

- Replace DashboardScreen.native.tsx with unified DashboardScreen.tsx
- Use cross-platform primitives (ScrollView, Box, Text, Pressable)  
- Preserve all business logic and data fetching
- Eliminate 380 lines of duplicate code"
```

### Task 2: Consolidate ClientHubScreen Component (347 lines saved)

**Files:**
- Modify: `Client/packages/features/dashboard/components/ClientHub/ClientHubScreen.native.tsx`
- Modify: `Client/packages/features/dashboard/components/ClientHub/ClientHub.tsx`
- Create: `Client/packages/features/dashboard/components/ClientHub/ClientHubScreen.tsx` (consolidated)

**Step 1: Create consolidated ClientHubScreen.tsx**

Extract shared logic from both files and create unified component:

```typescript
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useNavigation } from "packages/navigation";
import { useLocalization } from "packages/contexts";
import { useIsAgent } from "packages/features/homeauth";
import { Box, ScrollView, Text, Pressable } from "packages/ui/components/primitives";
import { UnderlineTabs } from "packages/ui/components/tabs";

// ... preserve all hooks and business logic from both versions
// Unify tab system, modal handling, and content rendering

export function ClientHubScreen({ clientId }: ClientHubScreenProps) {
  // ... combine all state and hooks from both versions
  // Use unified tab system and scrolling approach
  
  return (
    <Box className="flex-1">
      {/* Unified header with back navigation */}
      <Box className="mb-4 flex-row items-center justify-between px-4 pt-4">
        <Pressable onPress={() => navigation.goBack()}>
          <Text className="text-brand-accent text-sm font-medium">← Back</Text>
        </Pressable>
        <Text className="text-xs text-gray-500">Client overview</Text>
      </Box>

      {/* Client info header */}
      <Box className="mb-4 gap-1 px-4">
        {/* ... client details */}
      </Box>

      {/* Unified tabs */}
      <Box className="px-4">
        <UnderlineTabs
          items={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as ClientHubTab)}
          className="mb-4"
        />
      </Box>

      {/* Content area with ScrollView */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* ... render tab content using primitives */}
      </ScrollView>
    </Box>
  );
}
```

**Step 2: Update imports and exports**

Update barrel exports and component imports to reference consolidated version

**Step 3: Scan for import references**

Run: `grep -r "ClientHubScreen\|ClientHub" Client/`
Update all references to use consolidated component

**Step 4: Test consolidated component**

Run: `cd Client && npm run lint`
Expected: No linting errors

**Step 5: Delete redundant files**

```bash
rm Client/packages/features/dashboard/components/ClientHub/ClientHubScreen.native.tsx
```

**Step 6: Commit consolidation**

```bash
git add .
git commit -m "feat: consolidate ClientHubScreen components

- Merge ClientHubScreen.native.tsx and ClientHub.tsx
- Use unified tab system with cross-platform primitives
- Preserve all client data management and mock data logic
- Eliminate 347 lines of duplicate code"
```

### Task 3: Consolidate ClientList Component (179 lines saved)

**Files:**
- Modify: `Client/packages/features/dashboard/components/ClientList/ClientList.native.tsx`
- Modify: `Client/packages/features/dashboard/components/ClientList/ClientList.tsx`
- Create: `Client/packages/features/dashboard/components/ClientList/ClientList.tsx` (consolidated)

**Step 1: Create consolidated ClientList.tsx**

Merge both implementations using primitives:

```typescript
import React, { useMemo, useState } from "react";
import type { ClientDealInfo, DealStage } from "packages/schemas/agent";
import { Box, ScrollView, Text, Pressable } from "packages/ui/components/primitives";
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
// ... preserve all imports and business logic

type ClientListProps = {
  onClientClick?: (clientId: string) => void;
};

export function ClientList({ onClientClick }: ClientListProps) {
  // ... preserve all existing hooks, state, and business logic
  // Merge filter logic from both versions
  
  return (
    <Box className="space-y-4 sm:space-y-6">
      {/* Unified filter UI using primitives */}
      <Box className="mb-3 gap-2 rounded-lg bg-gray-50 p-2">
        <Text className="mb-1 text-xs font-semibold text-gray-700">Filter by stage</Text>
        <Box className="flex-row flex-wrap gap-2">
          {/* ... filter buttons using Pressable */}
        </Box>
      </Box>
      
      {/* Client list using ScrollView instead of FlatList */}
      <ScrollView>
        {filteredClients.map((client) => (
          <ClientRow 
            key={client.id} 
            client={client} 
            onClick={() => onClientClick?.(client.id)} 
          />
        ))}
      </ScrollView>
    </Box>
  );
}
```

**Step 2: Update useClientListData hook**

Consolidate `useClientListData.native.tsx` logic into main hook

**Step 3: Update imports throughout codebase**

Run: `grep -r "ClientList" Client/packages/features/dashboard/`
Update all imports to consolidated version

**Step 4: Test consolidated component**

Run: `cd Client && npm run lint`
Expected: No linting errors

**Step 5: Delete redundant native files**

```bash
rm Client/packages/features/dashboard/components/ClientList/ClientList.native.tsx
rm Client/packages/features/dashboard/components/ClientList/useClientListData.native.tsx
```

**Step 6: Commit consolidation**

```bash
git add .
git commit -m "feat: consolidate ClientList components

- Merge ClientList.native.tsx with main ClientList.tsx
- Use ScrollView and primitives for cross-platform rendering  
- Preserve filter logic and client data management
- Eliminate 179 lines of duplicate code"
```

### Task 4: Consolidate ClientSavedHomes Component (200+ lines saved)

**Files:**
- Modify: `Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.native.tsx`
- Modify: `Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.tsx`
- Create: `Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.tsx` (consolidated)

**Step 1: Create consolidated ClientSavedHomes.tsx**

```typescript
import React, { useCallback, useMemo, useState } from "react";
import { useLocalization } from "packages/contexts";
import { PropertyDetailsModal } from "packages/features/propertyDetails";
import type { SavedHome } from "packages/types";
import { Box, ScrollView, Text, Pressable } from "packages/ui/components/primitives";
import { BaseModal } from "packages/ui/components/modals";

export function ClientSavedHomes({ clientId }: ClientSavedHomesProps) {
  // ... preserve all hooks and state management
  // Merge modal handling and property details logic
  
  return (
    <Box className="flex-1">
      <ScrollView>
        {homes.map((home) => (
          <Box key={home.id} className="mb-4 rounded-lg bg-white p-3 shadow-sm">
            {/* Property card using primitives */}
            <Pressable onPress={() => handleOpenDetails(home)}>
              <Text>{home.address}</Text>
              {/* ... property details using Text and Box */}
            </Pressable>
          </Box>
        ))}
      </ScrollView>
      
      {/* Modals preserved identically */}
      <PropertyDetailsModal 
        isOpen={!!selectedProperty}
        property={selectedProperty}
        onClose={clearSelectedProperty}
      />
    </Box>
  );
}
```

**Step 2: Update component exports**

Update barrel exports and imports

**Step 3: Test consolidated component**  

Run: `cd Client && npm run lint`
Expected: No linting errors

**Step 4: Delete redundant native file**

```bash
rm Client/packages/features/dashboard/components/ClientHub/saved-homes/ClientSavedHomes.native.tsx
```

**Step 5: Commit consolidation**

```bash
git add .
git commit -m "feat: consolidate ClientSavedHomes components

- Merge native and web ClientSavedHomes implementations
- Use ScrollView and primitives for property list rendering
- Preserve modal handling and property details integration  
- Eliminate 200+ lines of duplicate code"
```

### Task 5: Consolidate Remaining Dashboard Components (320+ lines saved)

**Files:**
- Consolidate: `DashboardChecklists.native.tsx` → `DashboardChecklists.tsx`
- Consolidate: `ClientAgreements.native.tsx` → `ClientAgreements.tsx`  
- Consolidate: `ClientDocuments.native.tsx` → `ClientDocuments.tsx`
- Consolidate: `ClientChecklists.native.tsx` → `ClientChecklists.tsx`

**Step 1: Consolidate DashboardChecklists component**

```typescript
// Create unified DashboardChecklists.tsx using ScrollView and Box primitives
// Preserve all checklist logic and progress tracking
```

**Step 2: Consolidate ClientAgreements component**

```typescript
// Create unified ClientAgreements.tsx using primitives
// Preserve agreement display and management logic
```

**Step 3: Consolidate ClientDocuments component**

```typescript
// Create unified ClientDocuments.tsx using ScrollView for document lists
// Preserve document actions and modal handling
```

**Step 4: Consolidate ClientChecklists component**

```typescript
// Create unified ClientChecklists.tsx using primitives  
// Preserve checklist item management and updates
```

**Step 5: Update all imports and delete native files**

Run comprehensive import scan and updates across codebase

**Step 6: Final validation**

Run: `cd Client && npm run lint && npm run typecheck`
Expected: All checks pass

**Step 7: Commit final consolidations**

```bash
git add .
git commit -m "feat: consolidate remaining dashboard components

- Consolidate DashboardChecklists, ClientAgreements, ClientDocuments, ClientChecklists
- Replace all platform-specific implementations with primitives
- Preserve all business logic and data management
- Complete dashboard consolidation: 1,200+ lines eliminated"
```

### Task 6: Final Validation and Documentation

**Step 1: Run comprehensive linting**

```bash
cd Client
npm run lint
npm run typecheck
```

Expected: All checks pass

**Step 2: Verify line count reduction**

```bash
git log --oneline | head -10
git diff --stat HEAD~6 HEAD
```

Expected: Show 1,200+ line reduction across consolidated files

**Step 3: Create consolidation summary**

Document final results and any remaining platform-specific components

**Step 4: Final commit**

```bash
git add .
git commit -m "docs: complete dashboard consolidation validation

- All dashboard components successfully consolidated
- 1,200+ lines of duplicate code eliminated  
- Identical functionality preserved across platforms
- All linting and type checking passes"
```

---

Plan complete and saved to `docs/plans/2026-03-09-dashboard-consolidation.md`. Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**