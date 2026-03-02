---
name: ""
overview: ""
todos: []
isProject: false
---

# Linter Errors: Categorization and Fix Plans

**Last full run:** `./scripts/run-all-linters.sh all`  
**Current snapshot (this run):** Client **141 errors + 19 warnings** (ESLint only; typecheck, format:check, cycles, audit, build not re-run after lint failure). Server: not re-checked in this run.

---

## 1. Current run – summary by category

| Category | Severity | Count | Rule | Notes |
|----------|----------|-------|------|--------|
| Cross-feature / app boundaries | Error | **~69** | `silverkey/no-cross-feature-internals` | App→feature internals (7) + feature→feature (62). Use feature barrels or move shared code to packages/hooks, packages/utils, packages/ui. |
| Package module structure | Error | **~22** | `silverkey/package-module-allowed-children` | `services/` in features (search, calendar, documents, homeauth) + loose `ChecklistLayout.tsx` in checklists. Only api/, components/, hooks/, store/, types/, utils/ allowed. |
| Architecture: use hooks not config/api | Error | **~25** | `silverkey/no-restricted-imports-architecture` | Features/ui importing config/api or services directly; must use packages/hooks or feature api layer. |
| Zustand .getState() | Error | **~14** | `silverkey/no-zustand-get-state` | Use hook + selector or integration hook; no .getState() outside store. |
| Centralized logger | Error | **17** | `silverkey/no-console-logger` | `packages/services/chats.ts`: replace console.log/error with log + LOG_CATEGORIES. |
| Primitive DOM elements in UI | Error | **4** | `silverkey/no-primitive-components` | `packages/ui/components/primitives/`: Button.web, Input.web, Image.web, Video.web use &lt;button&gt;/&lt;input&gt;/&lt;img&gt;/&lt;video&gt;; rule expects wrapper from components/ui. |
| Relative parent imports | Warning | **6** | `silverkey/no-relative-parent-imports` | Button.tsx, tailwind/index, calendar api/types: use path aliases. |
| Direct platform libraries | Warning | **7** | `silverkey/no-direct-platform-libraries` | embla-carousel-react, react-virtuoso, hls.js, react-phone-number-input in features/feed, features/homeauth; use platform adapter from packages/ui. |
| Native Date | Warning | **2** | `silverkey/no-native-date` | packages/services/chats.ts, homeauth VerificationPage: use packages/utils/date. |
| Platform feature check | Warning | **2** | `silverkey/no-platform-feature-check` | homeauth OnboardingScreen.native: use useFeature('flag') instead of platform gate. |

**Total this run:** 141 errors, 19 warnings (160 problems). All from Client ESLint; no `import/no-unresolved` in this run.

---

## 2. Legacy summary (prior run – for reference)

| Category                      | Severity | Count   | Rule / Source                          | Plan                                                |
| ----------------------------- | -------- | ------- | -------------------------------------- | --------------------------------------------------- |
| Import path resolution        | Error    | **375** | `import/no-unresolved`                 | [Plan A](#plan-a-import-path-resolution-375-errors) |
| Server folder count           | Error    | 1       | `lint_folder_count.py`                 | [Plan B](#plan-b-server-folder-count)               |
| Server folder count           | Warning  | 1       | `lint_folder_count.py`                 | Plan B                                              |
| Hardcoded JSX text            | Warning  | ~700+   | `silverkey/no-hardcoded-jsx-text`      | [Plan C](#plan-c-hardcoded-jsx-text)                |
| Native Date                   | Warning  | ~180    | `silverkey/no-native-date`             | [Plan D](#plan-d-native-date)                       |
| Restricted globals (packages) | Warning  | ~200+   | `no-restricted-globals`                | [Plan E](#plan-e-restricted-globals-in-packages)    |
| Folder max items (Client)     | Warning  | ~25+    | `silverkey/folder-max-items`           | [Plan F](#plan-f-folder-max-items)                  |
| Function length / complexity  | Warning  | ~80+    | `max-lines-per-function`, `complexity` | [Plan G](#plan-g-function-length-and-complexity)    |
| Architecture & boundaries     | Error    | **105** | 3 SilverKey rules (see below)         | [Plan H](#plan-h-architecture--boundaries-105-errors) |


---

## Plan H: Architecture & boundaries (105 errors)

**Rules:**  
- `silverkey/no-cross-feature-internals` (65) – No importing another feature’s components, hooks, utils, store, types, api, or services; apps must not import feature internals (use feature barrel or shared packages).  
- `silverkey/no-restricted-imports-architecture` (25) – No direct imports of `packages/config/api` or `packages/services` from `packages/features` or `packages/ui` except from feature `api/` or `services/` (and allowed http/security). Use hooks or feature API layer instead.  
- `silverkey/package-module-allowed-children` (15) – Feature modules may only contain: `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`, index files, README. No extra roots (e.g. `services/`, loose `ChecklistLayout.tsx`).

### H.1 – silverkey/no-cross-feature-internals (65 errors)

#### H.1.A – App importing feature internals (6 errors)

| File | Line | Imported | Fix |
|------|------|----------|-----|
| `apps/mobile/app/navigation/RootNavigator.native.tsx` | 3 | homeauth/components | Import from `packages/features/homeauth` barrel |
| `apps/mobile/app/providers/AppStackIntegrations.native.tsx` | 3, 4 | documents/hooks, search/hooks | Use feature barrels or shared hooks |
| `apps/mobile/app/providers/auth/AuthProviderNative.native.tsx` | 10 | homeauth/hooks | Use `packages/features/homeauth` barrel |
| `apps/web/pages/SavedPage.tsx` | 1 | saved/components | Import from `packages/features/saved` barrel |
| `apps/web/pages/SearchPage.tsx` | 1 | search/components | Import from `packages/features/search` barrel |
| `apps/web/pages/SettingsPage.tsx` | 11 | profile/utils | Import from `packages/features/profile` barrel or move util to `packages/utils` |

#### H.1.B – Feature → feature (59 errors), by importing feature

**agent** (importing from: homeauth, messaging, documents, profile)  
- `packages/features/agent/components/AgentFeature.tsx` – homeauth/hooks, messaging/components  
- `packages/features/agent/components/modals/SelectAgreementModal.tsx` – documents/hooks  
- `packages/features/agent/components/modals/SelectDocumentModal.tsx` – documents/hooks  
- `packages/features/agent/components/modals/SettingsModal.tsx` – profile/components  

**calendar** (importing from: dashboard)  
- `packages/features/calendar/components/SchedulingModal.tsx` – dashboard/components  

**checklists** (importing from: homeauth)  
- `packages/features/checklists/ChecklistLayout.tsx` – homeauth/hooks  

**compare** (importing from: search)  
- `packages/features/compare/utils/comparisonFields/coreFields.ts` – search/types (×2)  

**dashboard** (importing from: documents)  
- `packages/features/dashboard/components/ClientHub/agreements/ClientAgreements.tsx` – documents/hooks  

**homeauth** (importing from: search, checklists)  
- `packages/features/homeauth/components/homepage/HomeFeature.tsx` – search/types  
- `packages/features/homeauth/components/pages/homepage/HomePage.tsx` – search/types  
- `packages/features/homeauth/hooks/data/useChecklistData.ts` – checklists/api  

**messaging** (importing from: agent, documents, search)  
- `packages/features/messaging/components/AgentMessaging/AgentMessagingModals.tsx` – agent/components (×5)  
- `packages/features/messaging/components/ClientMessaging/ClientMessageRow.tsx` – documents/hooks  
- `packages/features/messaging/components/ClientMessaging/ClientMessagingModals.tsx` – agent/components, search/types  
- `packages/features/messaging/components/ClientMessaging/ClientMessagingSidebar.tsx` – agent/components  
- `packages/features/messaging/components/cards/SharedAgreementCard.tsx` – documents/hooks  
- `packages/features/messaging/components/layout/UnifiedMessagesList.tsx` – documents/hooks  
- `packages/features/messaging/components/layout/UnifiedMessagingSidebar.tsx` – agent/components  
- `packages/features/messaging/hooks/data/useChats.ts` – search/types  
- `packages/features/messaging/utils/reportToChat.ts` – search/types  

**saved** (importing from: search, documents)  
- `packages/features/saved/components/...` – search/components, documents/hooks (multiple files)  
- `packages/features/saved/components/SavedPageTabsAndSearch.tsx` – documents/hooks  

**search** (importing from: homeauth, feed, compare, saved)  
- `packages/features/search/components/layout/SearchPageMapContainer.web.tsx` – homeauth/components  
- `packages/features/search/components/reels/ReelsView.web.tsx` – feed/hooks, feed/types, feed/utils  
- `packages/features/search/hooks/data/compare/usePropertyComparison.ts` – compare/utils  
- `packages/features/search/hooks/data/saved/useSavedHomesData.ts` – saved/types (×2)  

**Fix direction (H.1.B):** Move shared code to `packages/hooks`, `packages/utils`, or `packages/ui`; or expose via feature barrel only (no direct imports of another feature’s components/hooks/utils/store/types/api/services).

---

### H.2 – silverkey/no-restricted-imports-architecture (25 errors)

**What’s wrong:** Code under `packages/features` (or `packages/ui`) imports `packages/config/api` or `packages/services` directly. Only feature `api/` or `services/` (and allowed http/security) may do that; elsewhere use hooks from `packages/hooks` or the feature’s API layer.

| Feature | File | Fix |
|---------|------|-----|
| agent | `hooks/data/useAgentClients.ts`, `useAgentSearch.ts`, `useAgentTodos.ts`, `useConnectionRequests.ts`, `useEventRequests.ts` | Use shared hooks from `packages/hooks` or feature `api/` layer |
| agent | `utils/agent.ts` | Use hooks or move API usage to feature `api/` |
| calendar | `hooks/data/useCalendarPreferences.ts` | Use shared hook or feature `api/` |
| documents | `hooks/data/useDocumentActions.ts`, `hooks/ui/pdf/pdfModalDiagnosticsHelpers.ts` | Use `packages/hooks` or feature api layer |
| homeauth | `hooks/data/useAuthActions.ts`, `useAuthVerification.ts`, `useAutoSavePreferences.ts`, `usePreferencesSubmit.ts`, `useProfilePictureUpload.ts`, `useUserData.ts` | Use `packages/hooks` or feature api layer |
| search | `hooks/data/compare/usePropertyComparison.ts`, `hooks/data/isochrone/useIsochroneData.ts`, `useIsochroneFlow.ts`, `hooks/data/page/useSearchBootstrap.ts`, `hooks/data/property/usePropertyDetails.ts`, `hooks/data/results/useSearchResultsData.ts`, `hooks/data/saved/useNotInterestedHomesData.ts` | Use `packages/hooks` or feature api layer |

**Fix plan:** For each file, either (1) add/use a hook in `packages/hooks` that wraps the config/api or service call, or (2) move the call into the feature’s `api/` (or allowed `services/`) and keep hooks thin.

---

### H.3 – silverkey/package-module-allowed-children (15 errors)

**What’s wrong:** Feature modules may only have: `api/`, `components/`, `hooks/`, `store/`, `types/`, `utils/`, index files, README. No `services/` folder and no loose files at module root.

#### H.3.A – Disallowed root: `services/` (14 errors)

| Feature | Path | Fix |
|---------|------|-----|
| calendar | `packages/features/calendar/services/scheduling.ts` | Move to `api/` or `utils/` (or add rule exception if “services” is allowed) |
| documents | `packages/features/documents/services/index.ts` | Move service layer into `api/` or `utils/` |
| homeauth | `packages/features/homeauth/services/auth.ts` | Move into `api/` or `utils/` |
| search | `packages/features/search/services/googleMaps/*` (GoogleMapsService.ts, index.ts, mapInstanceManager.ts, scriptLoader.ts, singleton.ts, types.ts, utils.ts) | Move into `api/` or `utils/` (e.g. `api/googleMaps/` or `utils/googleMaps/`) |
| search | `packages/features/search/services/propertySearch.ts`, `savedHomes.ts`, `search.ts`, `searchTransform.ts` | Move into `api/` or `utils/` |

#### H.3.B – Loose file at module root (1 error)

| Feature | File | Fix |
|---------|------|-----|
| checklists | `packages/features/checklists/ChecklistLayout.tsx` | Move to `components/ChecklistLayout.tsx` (or under a subfolder of `components/`) and update imports |

**Fix plan (H.3):** (1) Rename or move `services/` into `api/` or `utils/` per feature and update imports. (2) Move `ChecklistLayout.tsx` into `checklists/components/` and update all imports.

---

## Plan A: Import path resolution (375 errors)

**Rule:** `import/no-unresolved`  
**Cause:** ESLint uses `tsconfig.app.json` for the import resolver. That config has `@/*` → `apps/web/*` but does **not** define the `@ui` alias. Vite defines `@ui` in `apps/web/vite.config.ts` (`@ui` → `components/ui`), so builds succeed but ESLint cannot resolve `@ui`, `@/components/ui`, or some relative paths when the resolver runs from repo root.

**Typical failing imports:**

- `@ui`, `@ui/button/Button`, `@ui/text/Label`, `@ui/loading/KeyTurnLoader`, `@ui/asset/MiniLogo`, etc.
- `@/components/ui`, `@/components/layout/Card`, `@/components/cards/base`, `@/features/profile/...`, `@/features/search`, `@/app/layouts/sidebar/sidebarTabs`
- Relative: `./base`, `./SearchActions`, `./Card`, `./sidebarTabs`, `./WhyNotInterestedCard`
- Asset: `/logo.png?url`

**Fix plan:**

1. **Add `@ui` to `Client/tsconfig.app.json`** so the import resolver can resolve it:
  - In `compilerOptions.paths`, add: `"@ui": ["apps/web/components/ui"]` and optionally `"@ui/*": ["apps/web/components/ui/*"]`.
2. **Ensure `@/`* covers all app paths** – `tsconfig.app.json` already has `"@/*": ["apps/web/*"]`; confirm that ESLint is using this config (it points to `tsconfig.app.json` in `eslint.config.js`).
3. **Relative path errors** (`./base`, `./SearchActions`, etc.): usually mean a missing file or wrong extension. Fix by adding the correct file/extension or re-export in an `index.ts`.
4. **Asset** `/logo.png?url`: ensure eslint-import-resolver ignores asset extensions or add an appropriate resolver for Vite asset URLs.

**Success criteria:** `pnpm run lint` reports 0 `import/no-unresolved` errors.

---

## Plan B: Server folder count

**Source:** `Server/scripts/lint_folder_count.py`  
**Errors:**

- `Server/run.py:1:1`: Folder has 17 direct children (max 15). **Error.**
- `Server/app/services/preferences_aggregation.py:1:1`: Folder has 14 direct children (recommended max 13). **Warning.**

**Fix plan:**

1. **Server root (run.py directory):** Reduce direct children from 17 to ≤15 by either:
  - Moving some modules into a new subfolder (e.g. `scripts/`, `config/`) and updating imports, or
  - Grouping related files into subfolders (e.g. all migration/run helpers under one folder).
2. **app/services:** Reduce direct children in the folder containing `preferences_aggregation.py` from 14 to ≤13 (e.g. move one service into a subfolder or group related services).

**Success criteria:** `./scripts/run-all-linters.sh server` passes with no folder-count failure.

---

## Plan C: Hardcoded JSX text

**Rule:** `silverkey/no-hardcoded-jsx-text`  
**Intent:** User-facing strings must use a translation function (e.g. `t('key')` from `useLocalization()`).

**Fix plan:**

1. **Audit:** Run `pnpm lint` and collect all files/lines with this warning (or use ESLint output with rule filter).
2. **Per file:** Replace user-visible literal strings in JSX with `t('translation_key')`. Add keys to `packages/contexts/translations` (English only).
3. **Non-user-facing:** If the rule allows exceptions (e.g. for placeholders, test-only text), add comments or use the allowed exception pattern so only real UI copy is translated.
4. **Batch:** Prioritize high-traffic or legal pages (e.g. login, signup, terms) first; then shared components; then lower-priority screens.

**Success criteria:** No (or minimal, explicitly exempted) `silverkey/no-hardcoded-jsx-text` warnings in `apps/web`.

---

## Plan D: Native Date

**Rule:** `silverkey/no-native-date`  
**Intent:** Use `packages/utils/date` (e.g. `dateNow()`, `dateParse()`) instead of `new Date()` / `Date.parse()` for cross-platform (V8 vs Hermes) consistency.

**Fix plan:**

1. **Find usages:** Grep for `new Date(`, `Date.parse(`, `Date.` in `apps/web` and `packages` (excluding `packages/utils/date` and `packages/utils/calendar` if allowed).
2. **Replace:** Use the date wrapper API from `packages/utils/date` (e.g. `dateNow()`, `dateParse()`) and remove direct `Date` usage.
3. **Allowlist:** Keep allowed paths in ESLint config for `packages/utils/date/` and `packages/utils/calendar/` so they can use native Date internally if needed.

**Success criteria:** No `silverkey/no-native-date` warnings outside allowed paths.

---

## Plan E: Restricted globals in packages

**Rule:** `no-restricted-globals` (in shared packages: `packages/`*)  
**Intent:** No `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `fetch`, `File`, `Blob` in shared code so it stays React Native–safe.

**Affected:** Mostly `packages/utils` (e.g. search, storage, feed).

**Fix plan:**

1. **Abstraction:** Introduce small platform adapters (e.g. `getWindow()`, `getDocument()`, storage interface) that are implemented in `apps/web` and injected or provided via context, and use those in shared code instead of globals.
2. **Move to app:** If usage is web-only, move the code to `apps/web` (or a web-specific package) so the global is not in shared packages.
3. **Storage:** Replace direct `localStorage`/`sessionStorage` in packages with a storage abstraction (e.g. from `packages/utils/storage` or a passed-in dependency) that apps/web implements with sessionStorage/memory.

**Success criteria:** No `no-restricted-globals` warnings in `packages/`**.

---

## Plan F: Folder max items

**Client:** `silverkey/folder-max-items` – e.g. `Client/packages/config/eslint/eslint-plugin-silverkey/rules/` has 22 direct children (max 16).  
**Server:** See Plan B.

**Fix plan (Client):**

1. **ESLint plugin rules:** Group rules into 2–3 subfolders by theme (e.g. `rules/hooks/`, `rules/architecture/`, `rules/ui/`) and update the plugin’s rule loading to scan subfolders. This reduces direct children in `rules/` to ≤16.
2. **Other Client folders:** For any other folder over the limit, apply the same pattern: create 1–2 subfolders and move files by concern; update imports and barrel exports.

**Success criteria:** No folder has more than the configured max direct children (16 Client, 15 Server root, 13 recommended for services).

---

## Plan G: Function length and complexity

**Rules:** `max-lines-per-function` (80 lines), `complexity` (20).

**Fix plan:**

1. **Extract components:** For large React components (e.g. `SignupPage`, `SavedHomes`, `ClientMessaging`), extract subcomponents or sections into separate files.
2. **Extract hooks/logic:** For long hooks (e.g. `useGoogleEvents`, `useAgentChats`, `useDocusignActions`), move logical blocks into smaller hooks or pure functions in the same or a sibling file.
3. **Reduce branching:** For high-complexity functions (e.g. `ListingCard`, `DashboardHeader`, `DemographicsSection`), use early returns, extract conditionals into named functions or lookup tables, or split by branch.
4. **Prioritize:** Tackle the worst offenders first (e.g. >200 lines or complexity >30); leave borderline cases (e.g. 81 lines) for a second pass.

**Success criteria:** No `max-lines-per-function` or `complexity` violations, or only exempted functions with a documented reason.

---

## Execution order (recommended)

1. **Plan A** (import resolution) – unblocks a clean lint run and accurate counts.
2. **Plan B** (Server folder count) – small, gets server lint passing.
3. **Plan F** (folder max items, Client) – structural; do before heavy refactors.
4. **Plan D** (native Date) – localized, low risk.
5. **Plan E** (restricted globals) – may need design for storage/DOM abstractions.
6. **Plan C** (hardcoded JSX text) – many files; can be done incrementally.
7. **Plan G** (function length/complexity) – refactors; do per-feature or per-file.
8. **Plan H** (architecture & boundaries) – fix app→feature barrel usage (H.1.A), then feature→feature shared code (H.1.B), then restricted config/api imports (H.2), then package-module structure (H.3).

After Plan A (and optionally B), re-run `./scripts/run-all-linters.sh all` to get updated counts and confirm no new regressions.