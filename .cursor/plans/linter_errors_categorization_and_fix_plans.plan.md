---
name: ""
overview: ""
todos: []
isProject: false
---

# Linter Errors: Categorization and Fix Plans

**Generated:** From full `./scripts/run-all-linters.sh all` run.  
**Totals:** Client 375 errors + 1725 warnings; Server 1 error + 1 warning (folder count).

---

## 1. Summary by category


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

**Client:** `silverkey/folder-max-items` – e.g. `Client/tools/eslint-plugin-silverkey/rules/` has 22 direct children (max 16).  
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

After Plan A (and optionally B), re-run `./scripts/run-all-linters.sh all` to get updated counts and confirm no new regressions.