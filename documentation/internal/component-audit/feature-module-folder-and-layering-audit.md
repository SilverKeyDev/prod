# Feature module folders and layering audit

**Date:** 2026-05-13
**Scope:** Feature packages under [`Client/packages/features/`](../../../Client/packages/features/) that are missing one or more canonical top-level folders (`api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`).
**Rubric:** [documentation/architecture/patterns/react-component-audit-rubric.md](../../architecture/patterns/react-component-audit-rubric.md) (five axes, 1–3; fix list when total ≤ 9 or any axis = 1).

## ESLint vs “full skeleton”

Rule [`silverkey/package-module-allowed-children`](../../../Client/packages/config/eslint/eslint-plugin-silverkey/rules/architecture/package-module-allowed-children.js) rejects **extra** roots under each feature module; it does **not** require every allowed folder to exist. Missing `api/` or `store/` is therefore **valid** unless product code needs that layer.

---

## Section A — Folder necessity matrix

Legend: **Not needed** = no action; **Defer** = add only when a concrete need appears; **Add when** = trigger for introducing the folder.

| Package | api | components | hooks | store | types | utils |
|---------|-----|------------|-------|-------|-------|-------|
| **admin** | no | yes | no | no | no | yes |
| **agent** | yes | yes | yes | no | yes | yes |
| **checklists** | yes | yes | yes | no | yes | yes |
| **compare** | no | yes | yes | no | yes | yes |
| **dashboard** | no | yes | yes | no | yes | yes |
| **messaging** | yes | yes | yes | no | yes | yes |
| **profile** | yes | yes | yes | no | yes | yes |
| **propertyDetails** | no | yes | yes | no | yes | yes |
| **saved** | no | yes | yes | yes | yes | yes |

### Missing folder decisions (per package)

| Package | Missing | Verdict | Rationale |
|---------|---------|---------|-----------|
| **admin** | api, hooks, store, types | **Defer** each | Data uses [`packages/hooks/data/admin/*`](../../../Client/packages/hooks/data/admin/); UI is thin sections. **`types/translations.ts`** only if admin copy moves to shared `t()` pattern (no `t()` in admin today). **`api/`** only if admin-specific HTTP wrappers leave `packages/hooks`. **`hooks/`** if feature-local UI state grows beyond one component. **`store/`** only for cross-route admin UI state. |
| **agent** | store | **Defer** | Prefer `packages/store` + React Query unless agent-owned client state is clearly isolated. |
| **checklists** | store | **Defer** | Same; checklist server state lives in hooks + query keys. |
| **compare** | api, store | **Not needed** (api) / **Defer** (store) | Compare streams via [`search/api/research`](../../../Client/packages/features/search/api/research.ts) in [`usePropertyComparison.ts`](../../../Client/packages/features/compare/hooks/data/usePropertyComparison.ts)—a duplicate `compare/api/` adds little. |
| **dashboard** | api, store | **Defer** | Composes other features; no dedicated HTTP surface required. **`store/`** only if dashboard-specific UI state spans routes. |
| **messaging** | store | **Defer** | Large surface; still often server-backed; add `store/` only for messaging-owned global UI state not covered by `packages/store`. |
| **profile** | store | **Defer** | Same pattern as agent. |
| **propertyDetails** | api, store | **Defer** | Details often flow from props + search/listing hooks; add **`api/`** only if this feature owns new endpoints. |
| **saved** | api | **Defer** | Types already re-export API shapes from [`packages/api`](../../../Client/packages/features/saved/types/favorites.ts); hooks do not require a feature-local `api/` root unless duplicated clients appear. |

**Conclusion:** No empty placeholder folders were added. Physical **`api/`**, **`store/`**, **`hooks/`**, or **`types/`** roots should appear only when the first real module needs them.

---

## Section B — Cross-feature composition

Canonical policy: [cross-feature-composition.md](../../architecture/cross-feature-composition.md). Orchestrators compose via barrels/subpaths; ESLint does not ban all cross-feature imports.

**Example (agent client hub → checklists, homeauth, profile):**

```5:25:Client/packages/features/agent/components/clientHub/ClientHubScreen.tsx
import {
  CHECKLIST_TITLES,
  ChecklistProgressBar,
  type ChecklistTab,
  useChecklistProgress,
} from "packages/features/checklists";
import { useClientHubChecklistPrefetch } from "packages/features/agent/hooks";
import { useActiveWorkspace } from "packages/features/homeauth";
import { ProfileFeature, ProfileScreen } from "packages/features/profile";
// ...
import { useAgentClients } from "@/features/agent/hooks/data/useAgentClients";
import { useAgentDashboardMockData } from "@/features/agent/hooks/data/useAgentDashboardMockData";
```

Checklist prefetch for the hub uses the checklists **public barrel** inside [`useClientHubChecklistPrefetch.ts`](../../../Client/packages/features/agent/hooks/data/useClientHubChecklistPrefetch.ts) so the screen component no longer imports `packages/features/checklists/api/checklists` directly.

**Example (saved → documents):**

```6:18:Client/packages/features/saved/components/SavedFeature.tsx
import {
  useDocumentActions,
  useDocumentsDataIntegration,
  useFormsLibrary,
  useSavedPageDocumentHandlers,
  useSavedPageView,
} from "packages/features/documents";
```

**Example (compare → profile utils):**

```20:21:Client/packages/features/compare/components/CompareHomesModal/index.tsx
import { DEFAULT_REPORT_SECTIONS } from "@/features/profile/utils";
```

---

## Section C — Rubric sampling (primary entry files)

Scores: axis1 size/responsibility, axis2 props/API, axis3 state/data flow, axis4 render cost, axis5 bundle (1 = bad, 3 = good). **Total** = sum of five axes (max 15). Rows marked **fix list** if total ≤ 9 or any axis = 1.

| Package | File (approx LOC) | A1 | A2 | A3 | A4 | A5 | Total | Notes / evidence |
|---------|------------------|----|----|----|----|----|-------|------------------|
| admin | [`AdminUserSystemRolesSection.tsx`](../../../Client/packages/features/admin/components/AdminUserSystemRolesSection.tsx) (~184) | 2 | 3 | 2 | 3 | 3 | **13** | Multiple `useState` for form + mutation (`43:51:Client/packages/features/admin/components/AdminUserSystemRolesSection.tsx`); submit logic in component with `useCallback` (`53:95`)—acceptable for admin surface. |
| agent | [`MessagingScreen.native.tsx`](../../../Client/packages/features/agent/components/messaging/screen/MessagingScreen.native.tsx) (~363) | 1 | 2 | 2 | 2 | 3 | **10** | **fix list** (borderline): **A1** large screen file combining list + composer + navigation concerns. |
| checklists | [`ChecklistLayout.tsx`](../../../Client/packages/features/checklists/components/layout/ChecklistLayout.tsx) (~327) | 1 | 2 | 2 | 2 | 3 | **10** | **fix list** (borderline): **A1** 300+ LOC shell with layout + disclosure + data hooks (`1:36` imports + body). |
| compare | [`CompareHomesModal/index.tsx`](../../../Client/packages/features/compare/components/CompareHomesModal/index.tsx) (~300) | 2 | 2 | 2 | 2 | 3 | **11** | Modal owns CSV + comparison UI; props surface ~6 fields on `CompareHomesModalProps` (`27:34`). |
| agent | [`ClientHubScreen.tsx`](../../../Client/packages/features/agent/components/clientHub/ClientHubScreen.tsx) (~320) | 1 | 3 | 2 | 2 | 3 | **11** | **fix list** (borderline): **A1** 300+ LOC hub: tabs, roadmap, profile embed, documents, calendar. Checklist query prefetch in [`useClientHubChecklistPrefetch.ts`](../../../Client/packages/features/agent/hooks/data/useClientHubChecklistPrefetch.ts) (uses `getTaskChecklistForSubject` from the checklists barrel). |
| messaging | [`UnifiedMessagingSidebar.tsx`](../../../Client/packages/features/messaging/components/layout/chrome/UnifiedMessagingSidebar.tsx) (~329) | 1 | 2 | 2 | 2 | 3 | **10** | **fix list** (borderline): **A1** 300+ LOC chrome. |
| profile | [`ProfileFeature.tsx`](../../../Client/packages/features/profile/components/settings/inputs/ProfileFeature.tsx) (~303) | 1 | 2 | 2 | 2 | 3 | **10** | **fix list** (borderline): **A1** large settings shell. |
| propertyDetails | [`PropertyDetailsBody.tsx`](../../../Client/packages/features/propertyDetails/components/PropertyDetailsModal/body/PropertyDetailsBody.tsx) (~269) | 2 | 2 | 2 | 2 | 3 | **11** | Under 300 LOC; still dense section composition—watch **A1** if it grows. |
| saved | [`SavedFeature.tsx`](../../../Client/packages/features/saved/components/SavedFeature.tsx) (~366) | 1 | 2 | 2 | 2 | 3 | **10** | **fix list** (borderline): **A1** 300+ LOC; coordinates documents + homes + modals (`32:79`). |

Follow-up refactors: [SIL-167](https://linear.app/silverkey/issue/SIL-167/component-audit-split-300-loc-feature-shells-when-touched).

### SIL-167 execution policy

- **Trigger:** Product work touches a listed shell, or the file approaches ESLint `max-lines-hard` warn (**500** LOC; error **650**).
- **Scope:** One semantic extraction per PR (hook, tab chrome, or panel)—not `*.helpers.ts` / `*.types.ts` fragmentation.
- **Verify:** `cd Client && pnpm typecheck && pnpm lint` on touched paths.
- **Track:** PR description links SIL-167; note file + extraction in a Linear comment.

| Shell | Extractions (2026-06) |
|-------|------------------------|
| ChecklistLayout | `useChecklistLayoutController`, `ChecklistLayoutDisclosureSections` |
| ClientHubScreen | `useClientHubRoute`, `ClientHubHeaderCard`, `ClientHubRoadmapPanel` |
| SavedFeature | `useSavedLibraryChrome`, `useSavedDocumentsCoordinator` |
| MessagingScreen.native | `useMessagingScreenNativeController` |
| UnifiedMessagingSidebar | `UnifiedMessagingSidebarClientList`, `UnifiedMessagingSidebarInbox` |
| ProfileFeature | `useProfileFeatureShell` |

---

## Section D — Fat-package grep pass (scoped)

Commands (from repo root; `Client/packages/features/<pkg>`):

- `moment` / `lodash` default import: `rg "from ['\\\"]moment['\\\"]|from ['\\\"]lodash['\\\"]" Client/packages/features/<pkg>` → **no matches** across the nine scoped packages (excluding the English word “moment” in user-facing strings).
- Heavy chart stacks (`recharts`, `chart.js`, `@visx`): **no matches** in `propertyDetails`, `messaging`, `dashboard`, `compare`, `saved`, `admin` quick scans.

**Note:** Shared chart primitives live in [`packages/ui/components/data-viz/`](../../../Client/packages/ui/components/data-viz/) (e.g. `VerticalBarChart.tsx`, `DonutChart.tsx`). Property-specific section chrome stays under `propertyDetails/components/visualizations/`.

---

## Related links

- Feature layout rule: [`.cursor/rules/shared/package-feature-structure.mdc`](../../../.cursor/rules/shared/package-feature-structure.mdc)
- Features README: [`Client/packages/features/README.md`](../../../Client/packages/features/README.md)
