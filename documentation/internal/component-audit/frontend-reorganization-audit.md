# Frontend reorganization audit

**Date:** 2026-06-04  
**Last docs sync:** 2026-06-04 (Phase 5 — documentation reflects current tree; wave rows below track **code reorg work**, not doc accuracy).  
**Scope:** `Client/apps/*`, `Client/packages/features/*`, shared packages (`hooks`, `ui`, `store`, `utils`, `schemas`, `contexts`).  
**Orchestration:** default agent or `silverkey-engineer` + this checklist; optional subagents from the [component audit rubric](../../client/patterns/react-component-audit-rubric.md) (*Remediation subagents*). Per-wave fleet agents were removed from `.cursor/agents/` (low use).  
**Related:** [feature-module-folder-and-layering-audit.md](./feature-module-folder-and-layering-audit.md), [cross-feature-composition.md](../../client/architecture/cross-feature-composition.md).

---

## Wave status

| Wave | Work area | Status | PR / notes |
| ---- | --------- | ------ | ---------- |
| 0 | Baseline (`pnpm audit:cross-feature-imports:json`, gates) | done | 2026-06-04 — 51 edge pairs, 213 import refs; baseline JSON in `cross-feature-baseline-phase0.json` |
| 1 | Shared hooks rehome (`packages/hooks/data`) | pending | |
| 1 | Store barrel diet (`packages/store`) | pending | |
| 1 | Feature structure / barrels | pending | |
| 1 | Mobile nav state | pending | |
| 2 | Web thin shell (`apps/web`) | pending | |
| 2 | Cross-feature utils consolidation | pending | |
| 3 | UI domain extract (`packages/ui`) | pending | |
| 4 | Optional size splits (`silverkey-audit-axis1-size-responsibility-fixer`, per feature) | pending | |

Status values: `pending` | `in_progress` | `done`

---

## Phase 0 — Baseline (coordinator)

```bash
cd Client && pnpm audit:cross-feature-imports:json > /tmp/cross-feature-before.json
find apps packages -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*" ! -name "*.test.*" ! -name "api.generated.ts" -exec wc -l {} + | sort -rn | head -20
pnpm typecheck && pnpm lint && pnpm lint:cycles
```

**Recorded 2026-06-04:**

| Gate | Result |
| ---- | ------ |
| `pnpm typecheck` | pass |
| `pnpm lint:cycles` | pass (no circular deps) |
| Cross-feature | 51 edge pairs, 213 total import refs — see [`cross-feature-baseline-phase0.json`](./cross-feature-baseline-phase0.json) |

Top LOC (sample): `useMessaging.sendHelpers.ts` (410), `useCalendarQuickCreateSession.ts` (403), `ImportantLocationsInput.web.tsx` (399).

---

## Wave 1 — shared-hooks

**Suggested subagents:** `silverkey-architecture-boundary-auditor`, `silverkey-file-module-reorganizer`

**Allowlist:** `Client/packages/hooks/data/{admin,agenda,calendar,property,integrations,polling}/**`, target `Client/packages/features/*/hooks/data/**`, thin re-exports in `packages/hooks/data/index.ts`.

### Move into owning features

| Source (shared hooks) | Target feature |
| --------------------- | -------------- |
| `hooks/data/admin/*` (6 mutations) | `features/admin/hooks/data/` |
| `hooks/data/agenda/*` | `features/documents` or `features/calendar` (orchestrator: documents + calendar + checklists) |
| `hooks/data/calendar/useLocalAvailabilityCalendarScreen.ts`, `useEventRequestScheduleAvailability.ts` | `features/calendar/hooks/data/` |
| `hooks/data/property/useAgentSearchShareBundle*.ts`, `useGoogleMaps.ts`, `usePropertyCommuteLocationMap*.ts`, `usePropertyDetailsLocationMap.web.ts`, `propertyCommuteLocationMapWeb.*` | `features/search/hooks/data/` or `features/agent/hooks/data/` per owner |
| `hooks/data/integrations/useChecklistFormSendContext.ts` | `features/messaging` or `features/agent` |
| `hooks/data/polling/usePrefetchHelpers.ts`, `libraryRouteDataPrefetch.ts` | Split: documents/checklists/messaging prefetch → owning features; keep shell in shared if cross-route |

### Keep in `packages/hooks` (cross-feature)

- `hooks/data/user/useUserData.ts`, `useClientSettings.ts`
- `hooks/data/saved/useSavedHomesData.ts`
- `hooks/data/polling/useDataPolling.ts`, `useRoutePolling.ts`, `useDataInitialization.ts`

### Acceptance

- [ ] No feature-orchestration hook left in `packages/hooks/data/` that imports deep `packages/features/*` trees (except documented re-exports)
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm lint:cycles` green from `Client/`
- [ ] Backward-compat re-exports documented if barrels changed

---

## Wave 1 — store-barrel

**Suggested subagents:** `silverkey-architecture-boundary-auditor`

**Allowlist:** `Client/packages/store/slices/**`, `Client/packages/store/index.ts`, `Client/packages/features/*/store/**`

### Colocate slices

| Slice | Move to |
| ----- | ------- |
| `slices/reports/reports.slice.ts` | `features/documents/store/` |
| `slices/agentDashboard/agentDashboard.slice.ts` | `features/agent/store/` |
| `slices/notifications/notifications.slice.ts` | `features/messaging/store/` |
| `slices/maps/googleMaps.slice.ts` | `features/search/store/` |

### Keep in `packages/store`

- `workspace`, `ui`, `view`, `featureFlags`, devtools middleware

### Acceptance

- [ ] `packages/store/index.ts` exports only global slices + optional thin re-exports from feature barrels
- [ ] All import sites updated or re-exported for one release
- [ ] Client gates green

---

## Wave 1 — feature-structure

**Suggested subagents:** `silverkey-file-module-reorganizer`, `silverkey-architecture-boundary-auditor`

**Allowlist:** `Client/packages/features/**` only

### ESLint root violations (`silverkey/package-module-allowed-children`)

| Path | Fix |
| ---- | --- |
| `agent/native.ts`, `dashboard/native.ts`, `homeauth/native.ts`, `profile/native.ts`, `propertyDetails/native.ts`, `saved/native.ts`, `search/native.ts` | Fold into `index.ts` + platform subpaths |
| `search/index.native.ts` | Merge into barrel pattern |
| `documents/README.md` | Move to `documentation/client/features/` or delete if duplicate |

### Hooks in `components/` → `hooks/`

| Current | Hook(s) |
| ------- | ------- |
| `profile/components/layout/PersonalizationSectionLayout.tsx` | `useShowPersonalizationSectionBodyTitle`, `useProfileUiSurface` |
| `search/components/header/SearchHeaderLocations/useSearchHeaderLocations.ts` | entire file |
| `search/components/header/location-bar/useSearchLocationBarSuggestionEffects.web.ts` | entire file |
| `documents/components/docusign/docuSignWidget/useDocuSignWidgetController.ts` | entire file |
| `documents/components/forms/formsBrowser/useFormsBrowserController.ts` | entire file |
| `checklists/components/steps/ChecklistStepSubmitContext.tsx` | `useChecklistStepSubmitRegistry` |
| `profile/components/settings/inputs/sliders/useSliderTickMapping.ts` | entire file |
| `calendar/components/viewings/viewingStopListIds.ts` | `useViewingStopRowIds` |

Fix inverted layering: hooks importing components should import from `hooks/` after moves.

### Acceptance

- [ ] No disallowed feature root children
- [ ] Client gates green

---

## Wave 1 — mobile-nav

**Suggested subagents:** default agent (mobile `apps/mobile` scope)

**Allowlist:** `Client/apps/mobile/app/navigation/**`

### Fixes

| File | Issue |
| ---- | ----- |
| `useDeepLink.native.ts` | `useAuthStore.getState()` → selector |
| `RootNavigator.native.tsx` | same |
| `AuthStack.native.tsx` | same |

### Acceptance

- [ ] No `getState()` in navigation files (`rg getState apps/mobile/app/navigation`)
- [ ] Client gates green

---

## Wave 2 — web-shell

**Suggested subagents:** `silverkey-audit-architecture-remediation`

**Allowlist:** `Client/apps/web/**`, target feature packages for extracted containers

### Extractions

| App file | ~LOC | Target |
| -------- | ---- | ------ |
| `pages/misc/AgentProfilePage.tsx` | 229 | `features/profile` public page container |
| `pages/property/PropertyDetailsPage.tsx` | 199 | `features/propertyDetails` |
| `pages/property/SearchPageContent.tsx` | 199 | Delete or merge into `features/search` (verify no importers) |
| `app/error/ErrorBoundary.tsx` | 336 | Split: fallback UI → `packages/ui` or error feature |
| `app/layouts/admin/AdminWorkspaceLayout.web.tsx` | 230 | `features/admin` |
| `app/guards/auth/AdminGuard.tsx` | 179 | `features/admin` or `packages/hooks/auth` |
| `app/seo/*` | — | `packages/utils/seo` + `packages/hooks/seo` |
| Dashboard prefetch hooks under `app/layouts/dashboard/` | — | `packages/hooks/navigation` |

App pages after extraction: ~10–20 LOC compose-only.

### Acceptance

- [ ] No app page >200 LOC except documented routing shell exceptions
- [ ] Client gates green

---

## Wave 2 — cross-feature-utils

**Suggested subagents:** `utility-deduplication-subagents` skill or `silverkey-architecture-boundary-auditor`

**Allowlist:** `Client/packages/utils/**`, `Client/packages/schemas/**`, `Client/packages/features/{messaging,search,profile,checklists,agent,homeauth}/**`

### Lifts

| Current | Target |
| ------- | ------ |
| `messaging/utils/agreementEventPayload`, `eventRequestPayload` | `packages/utils/comms/messaging/` or `packages/schemas` |
| `search/types/search/formatters/address` | `packages/utils/core/format/property/` (canonical) |
| `search/types/search/map/scorePinMarker.ts`, `isochroneRenderer.ts` | `search/utils/map/` |
| Checklists deep imports of `profile/components/sections/*` | Export checklist step panels from `features/profile` barrel |
| `homeauth/types/index.ts` re-export of `agent/types/agent` | Remove or narrow to documented subpath |

### Acceptance

- [ ] `pnpm audit:cross-feature-imports:json` — utils warn edges reduced or flat
- [ ] Client gates green

---

## Wave 3 — ui-domain

**Suggested subagents:** `silverkey-file-module-reorganizer`

**Allowlist:** `Client/packages/ui/**`, target `Client/packages/features/*/components/**`

### Extract from design system

| UI component | Target feature |
| ------------ | -------------- |
| `surfaces/modals/ShareHomeModal.tsx` | `features/agent` or `features/search` |
| `actions/button/propertyActions/*` | `features/saved` / `features/search` |
| `surfaces/cards/document/*`, `agreement/*` | `features/documents` |
| `surfaces/modals/standalone/PreferencesModal.tsx` | `features/profile` |
| `inputs/form/dropdowns/FavoriteHomesDropdown.tsx` | `features/profile` |
| Duplicate `ImportantLocationsInput` (ui vs profile) | Consolidate to one canonical location |

### Acceptance

- [ ] No new feature imports under `packages/ui` except documented exceptions
- [ ] Client gates green

---

## Wave 4 — optional size splits (axis1)

Use existing `silverkey-audit-axis1-size-responsibility-fixer` per feature when touching product work.

**Top components >300 LOC (sample):**

| Feature | File | LOC |
| ------- | ---- | --- |
| profile | `ImportantLocationsInput.web.tsx` | 399 |
| calendar | `CalendarStyleDateRangePicker.tsx` | 391 |
| checklists | `ChecklistLayout.tsx` | 378 |
| saved | `SavedFeature.tsx` | 366 |
| messaging | `ClientMessaging.tsx` | 361 |
| search | `SearchResultListingCard.web.tsx` | 346 |
| propertyDetails | `PropertyImageGallery.tsx` | 346 |
| feed | `MediaCarousel.web.tsx` | 345 |
| agent | `MessagingScreen.native.tsx` | 344 |

---

## Out of scope (separate tickets)

- `packages/services/data/*` route decoupling
- `packages/contexts` ServiceContext refactor
- ESLint rule expansion for all UI cards (ui-domain may propose)
- OpenAPI / server changes

---

## Related links

- Rubric remediation table: [react-component-audit-rubric.md](../../client/patterns/react-component-audit-rubric.md)
- Thin app: [documentation/client/architecture/thin-app-architecture.md](../../client/architecture/thin-app-architecture.md)
- Layer imports: [documentation/client/architecture/layered-architecture-imports.md](../../client/architecture/layered-architecture-imports.md)
