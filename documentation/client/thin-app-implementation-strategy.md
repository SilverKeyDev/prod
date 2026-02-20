# Thin App (Fat Packages) — Implementation Strategy

This document lays out **strategic options** for implementing the Thin App architecture and goes into **extreme detail** for each: when to use it, steps, risks, effort, and how to validate. It assumes you have read [thin-app-architecture.md](./thin-app-architecture.md) and the target state (apps = composition + delivery only; packages = logic + UI primitives + feature components).

---

## Current State (Summary)

| Location | What lives there today |
|----------|-------------------------|
| **packages/** | config, services, hooks, store, schemas, utils, contexts, navigation, design-tokens, styles, logger. **No** shared UI package. |
| **apps/web/** | All React UI: `components/ui/` (primitives), `components/cards/`, `components/modals/`, `features/*`, `pages/`, `app/` (routes, layouts, providers). Pages are often "fat" (many hooks, local state, app-local components). |

**Gap:** UI primitives and feature-level components live in the app. To reach "thin app," reusable pieces must move to packages and pages must become composition-only.

---

## Strategy Options — Overview

| Strategy | Description | Best for | Risk | Effort (rough) |
|----------|-------------|----------|------|-----------------|
| **A. Big-bang** | Move all primitives + feature components to packages in one project; then thin all pages. | Greenfield or small app; rare. | High (everything changes at once) | High, compressed |
| **B. Incremental by layer** | First primitives (packages/ui), then layouts, then feature components, then thin pages. | Teams that want a clear, dependency-driven order. | Low–medium | Medium–high, spread out |
| **C. Incremental by feature** | One vertical slice at a time (e.g. Saved, then Dashboard, then Auth). Each slice: move to packages + thin page. | Delivering value per area; parallel work by squad. | Medium (per-feature consistency) | Medium, iterative |
| **D. Hybrid (recommended)** | Layer-first for shared primitives (packages/ui), then feature-by-feature for feature components + thin pages. | Balancing reuse, risk, and incremental delivery. | Low–medium | Medium–high, phased |
| **E. Strangler fig** | New code only in packages; existing app code stays until touched. Migrate on every touch (bug, feature, refactor). | Long-term, low-disruption, no dedicated migration sprint. | Low | Low per change; long total time |

---

## Option A: Big-Bang

### What it is

- Create `packages/ui` (and optionally `packages/features` or domain packages).
- Move **all** primitives from `apps/web/components/ui/` into `packages/ui/`.
- Move **all** feature components and layouts that are deemed shared into packages.
- Refactor **all** pages to thin composition in one go.
- Update every import and fix all tests/build in one large PR or short-lived branch.

### When to use

- App is small (e.g. &lt; 30 pages, &lt; 100 components).
- You can afford a dedicated migration window and freeze features.
- You want to reach the target state in one shot and avoid long-lived divergence.

### When not to use

- Large codebase (like SilverKey): high merge conflict risk, hard to review, rollback is painful.
- No capacity for a full freeze or dedicated team for 2–4+ weeks.

### Steps (in order)

1. **Scaffold packages**
   - Add `packages/ui` with package.json, tsconfig, exports; ensure Vite (and Metro if applicable) resolve `.web` / `.native`. See [shared-ui-package.md](./shared-ui-package.md).
   - If using feature packages: add e.g. `packages/features/saved/`, `packages/features/dashboard/` with clear public API (barrel exports).

2. **Move primitives**
   - Move every component under `apps/web/components/ui/` into `packages/ui/<Name>/` with platform entries (e.g. `index.web.tsx`, `index.native.tsx`).
   - Move shared types and styles (e.g. design-tokens, styles used only by UI) into packages as needed.

3. **Move layouts**
   - Move shared layout components (e.g. DashboardLayout, SavedPageLayout) into packages (e.g. `packages/ui/layouts/` or a dedicated package). Keep app-only wrappers (e.g. router-specific container) in apps.

4. **Move feature components**
   - Move feature modules (e.g. Saved content, Dashboard widgets, Auth forms) into packages. Each feature exports: containers, presentational components, and any feature-specific hooks that are not yet in `packages/hooks/`.

5. **Thin all pages**
   - For each page under `apps/web/pages/`: remove in-page logic and heavy composition; replace with import from packages + single composition tree (layout + feature components + hooks).

6. **Update all imports**
   - Replace every `@/components/ui/*` and `@/features/*` with `@silverkey/ui` (or the chosen package name) and package feature paths. Fix path aliases in tsconfig and Vite.

7. **Validation**
   - Full build, typecheck, lint, e2e, and manual smoke of critical flows. No partial state: either everything works or you roll back.

### Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Merge conflicts if others keep shipping | Short-lived branch, feature freeze, or do it in a dedicated sprint. |
| Hidden dependencies (e.g. DOM, app-only context) | Audit before move: list every import and side effect; fix or leave in app. |
| Rollback is all-or-nothing | Tag pre-migration; have a clear rollback plan (revert + DB/config if needed). |

### Effort (rough)

- Small app: 1–2 weeks. SilverKey-scale: 4–8+ weeks and high coordination.

---

## Option B: Incremental by Layer

### What it is

You migrate **by architectural layer**, in dependency order:

1. **Layer 1 — Primitives:** Move UI primitives (Button, Text, Input, Label, etc.) into `packages/ui`. No feature logic.
2. **Layer 2 — Layouts:** Move shared layout building blocks (e.g. PageLayout, Card, Modal shell) into packages. They may depend on primitives only.
3. **Layer 3 — Feature components:** Move domain-specific UI (e.g. SavedHomesHeader, DashboardWidget, AuthForm) into packages (e.g. `packages/features/*` or under `packages/ui/features`). They depend on primitives + layouts + hooks.
4. **Layer 4 — Thin pages:** Refactor each page to only compose from packages + hooks; no in-page logic or app-local feature components.

Each layer is done fully before the next (or in clearly scoped batches so dependencies never point app → packages for that layer).

### When to use

- You want a single, clear order of work and minimal “who does what” ambiguity.
- You prefer finishing one layer everywhere before touching the next.

### When not to use

- You need to show “one full feature thin” early; layer approach delivers “all primitives done” first, pages last.

### Steps (extreme detail)

#### Phase 1: Primitives (packages/ui)

1. **Create package**
   - `packages/ui/package.json` with name (e.g. `@silverkey/ui`), exports, peerDependencies (react, react-dom; react-native when applicable).
   - tsconfig extends root; include both `.web.tsx` and `.native.tsx`.
   - Vite: resolve `@silverkey/ui` to `packages/ui`; resolve `.web` for web. Metro: resolve `.native` for mobile.

2. **Choose first batch**
   - Start with the “leaf” primitives that nothing else in `apps/web/components/ui` depends on (e.g. Button, BodyText, Label, Title). Use dependency graph or manual list.

3. **Move one component at a time**
   - Create `packages/ui/Button/` with `index.web.tsx` (copy from app), shared `Button.types.ts` if needed. Add `index.native.tsx` (stub or real RN implementation).
   - Barrel: `packages/ui/Button/index.ts` re-exports from platform entry (or rely on bundler resolution).
   - In `apps/web`: replace `import { Button } from "@/components/ui"` with `import { Button } from "@silverkey/ui"`. Delete or deprecate the app’s Button. Run typecheck + lint.

4. **Repeat**
   - Continue until all of `apps/web/components/ui/` that are “design primitives” live in `packages/ui`. Leave app-specific or one-off components in app for now.

5. **Enforce**
   - Optional ESLint rule: in `apps/web`, disallow importing from `@/components/ui` for the moved primitives (or require `@silverkey/ui`).

#### Phase 2: Layouts

1. **Define “shared layout”**
   - Layouts that only compose primitives (and maybe hooks from packages) and have no app route or app-only API: e.g. generic `DashboardLayout`, `SavedLayout`, `ModalShell`.

2. **Create home for layouts**
   - Either under `packages/ui/layouts/` or a separate `packages/layouts`. If many and complex, a separate package keeps `packages/ui` focused on primitives.

3. **Move one layout at a time**
   - Copy layout component and its direct dependencies (that are already in packages). Replace app-local imports with package imports. Re-export from package. In app, replace usage with import from package. Remove from app.

4. **Leave app-only wrappers in app**
   - e.g. wrapper that injects router or app-specific header; that stays in `apps/web/app/layouts/` and imports from packages.

#### Phase 3: Feature components

1. **Define feature boundaries**
   - e.g. Saved (saved homes, documents, tabs), Dashboard (calendar, checklists, client list, client hub), Auth (login, signup, verification), Search (filters, list, map).

2. **For each feature**
   - Create `packages/features/<name>/` (or `packages/ui/features/<name>/` if you want a single package). Move presentational components and feature-specific hooks (or re-export from `packages/hooks`). Ensure they only depend on packages (ui, hooks, store, utils, schemas). No `@/` imports.

3. **Update app**
   - In `apps/web/features/<name>/`: replace implementation with re-exports from package or thin wrappers that only pass props/children. Eventually delete app-local feature implementation and keep only page composition.

#### Phase 4: Thin pages

1. **Per page**
   - Open page file (e.g. `SavedPage.tsx`). List: hooks used, local state, subcomponents rendered.
   - Move any remaining logic into `packages/hooks` or into the feature package. Replace in-page JSX with a single composition: e.g. `<SavedLayout><SavedContent /></SavedLayout>` where `SavedContent` comes from package and uses hooks from packages.
   - Page file should end up: imports (packages + maybe one app layout wrapper), one or two hooks, one return with composition. No inline data-fetching, no complex conditionals, no new primitives.

2. **Validation**
   - Lint, typecheck, and a “thin page” checklist (see below). Optional: line-count or “max local state” rule for page files.

### Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Layer 3 (features) is large and blocks Layer 4 | Do features in small batches (e.g. one feature at a time); don’t wait for “all features” to start thinning pages. |
| Circular dependency between layout and feature | Enforce package dependency rules (e.g. features may depend on ui/layouts, not the other way). Use lint:cycles. |

### Effort (rough)

- Primitives: 1–3 weeks. Layouts: ~1 week. Features: 2–6 weeks depending on count and size. Thin pages: 1–3 weeks. Total: roughly 2–3 months if sequential; can overlap layers with care.

---

## Option C: Incremental by Feature (Vertical Slices)

### What it is

You pick one **feature (vertical slice)** at a time and for that feature only:

1. Move its UI and feature-specific logic into packages (e.g. `packages/features/saved/`).
2. Thin the corresponding page(s) so they only compose that feature from the package.

You do **not** move all primitives first. For that slice, you might introduce only the primitives it needs into `packages/ui`, or you temporarily keep using app primitives and move primitives in a later pass.

### When to use

- You want to deliver “Saved is fully thin” or “Dashboard is fully thin” early.
- Different squads can own different features and migrate in parallel (with coordination on shared packages).

### When not to use

- You want to avoid duplicating primitive moves (each feature might touch Button, etc.). Then Hybrid (D) or Layer-first (B) is better.

### Steps (extreme detail)

1. **Pick the first feature**
   - Choose a feature with clear boundaries and fewer cross-dependencies (e.g. Saved, or Auth). Avoid the most entangled one first.

2. **Map the slice**
   - List: pages that belong to this feature, components under `apps/web/features/<name>/` and `apps/web/components/` that are only used by this feature, hooks used (already in packages vs app-local).
   - Identify primitives used by this slice (Button, Input, etc.). Decide: move those primitives to `packages/ui` as part of this slice, or leave in app and move primitives in a separate “layer” pass later.

3. **Create package structure**
   - e.g. `packages/features/saved/`: `index.ts` (barrel), `SavedLayout.tsx`, `SavedContent.tsx`, `SavedHomesHeader.tsx`, etc. Move or copy components; fix imports to use only packages (and if needed, new primitives in packages/ui).

4. **Move or add primitives (if in scope)**
   - If you decided to move primitives as part of this slice: move only the ones this feature needs into `packages/ui`, then update this feature’s imports. Otherwise skip.

5. **Thin the page(s)**
   - e.g. `SavedPage.tsx`: remove all logic and subcomponents; import `SavedLayout` and `SavedContent` (or equivalent) from `packages/features/saved`; use hooks from `packages/hooks`; return a single composition.

6. **Remove from app**
   - Delete or stub out the old `apps/web/features/saved/` and any app-only components that are now in the package. Ensure no orphan imports.

7. **Validate**
   - Typecheck, lint, e2e for that feature. Then pick the next feature and repeat.

### Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Primitives get moved multiple times (per feature) | Either move primitives once in a “layer 0” pass, or accept temporary duplication and clean up in a later “consolidate UI” pass. |
| Feature boundaries are fuzzy | Define “owned” components and hooks per feature; shared pieces go to packages/ui or packages/hooks and are imported by multiple feature packages. |

### Effort (rough)

- Per feature: 1–3 weeks depending on size. Total: 2–4 months for all features if done sequentially; less if parallelized and primitives are pre-moved.

---

## Option D: Hybrid (Recommended)

### What it is

- **Phase 1 — Layer-first (primitives):** Same as Option B Phase 1. Get `packages/ui` in place and move **all** design primitives from `apps/web/components/ui/` into it. No feature components yet. Update all app imports to use `@silverkey/ui`. This gives you a single, reusable design system and unblocks both web and future mobile.
- **Phase 2 — Feature-by-feature (features + thin pages):** Same as Option C, but without re-moving primitives (already in packages). For each feature in turn: move feature components to `packages/features/<name>/`, thin the corresponding pages, remove from app.

### Why recommend it

- **Single move for primitives:** No repeated “move Button” per feature; one place for design system and UI rules.
- **Incremental delivery:** After Phase 1, app still works and already uses shared UI; after each feature in Phase 2, you get one more “thin” vertical slice.
- **Clear order:** Primitives first avoids circular dependency and gives a stable base for feature packages.
- **Fits existing doc:** Aligns with [shared-ui-package.md](./shared-ui-package.md) (Option 2) and [thin-app-architecture.md](./thin-app-architecture.md).

### Steps (concise)

**Phase 1 — Primitives (see Option B Phase 1)**  
Create `packages/ui`, move every primitive from `apps/web/components/ui/`, add `.native.tsx` stubs if needed, update all imports, enforce no app-local primitives for moved set.

**Phase 2 — Features (see Option C)**  
For each feature (e.g. Saved, Dashboard, Auth, Search, …):

1. Create `packages/features/<name>/`.
2. Move feature components and feature-specific hooks; depend only on packages (ui, hooks, store, utils, schemas).
3. Thin the page(s) to composition only.
4. Remove implementation from app; keep only route + composition in app.

**Optional Phase 2.5 — Layouts**  
If you find repeated layout patterns, extract shared layouts to `packages/ui/layouts/` or `packages/layouts/` in between or after features.

### Effort (rough)

- Phase 1: 2–4 weeks. Phase 2: 2–4 months depending on number of features and team size. Total: ~3–5 months with moderate parallelism.

---

## Option E: Strangler Fig (Migrate on Touch)

### What it is

- **New code:** Any new UI primitive or feature component is implemented **only** in packages. New pages are thin from day one (composition from packages).
- **Existing code:** Stays in `apps/web` until someone touches it (bug fix, feature change, refactor). On touch, that file (or module) is migrated: move to packages if reusable, or thin the page if it’s a page.

No dedicated migration project; no big-bang. Progress is gradual and driven by normal product work.

### When to use

- You cannot allocate a dedicated migration team or freeze features.
- You are okay with a long period where “some pages are thin, some are fat.”
- You want to avoid merge conflicts and large PRs.

### When not to use

- You need “all pages thin” or “mobile reusing same UI” by a specific date. Strangler is unbounded in time.

### Steps (extreme detail)

1. **Document the rule**
   - Add to Cursor rules and ARCHITECTURE: “New primitives and new feature components go in packages. New pages must be thin (composition only).”

2. **Scaffold packages once**
   - Ensure `packages/ui` (and optionally `packages/features`) exist and are wired (exports, Vite, Metro, tsconfig). If no one has started Option B/D, do at least the “create package + move one primitive” so the pattern exists.

3. **On every new component**
   - If it’s a primitive (Button, Input, …): implement in `packages/ui` with `.web` and `.native` if needed. If it’s a feature component: implement in `packages/features/<name>/`. App only imports and composes.

4. **On every touch of existing app code**
   - **If touching a primitive in app:** Move that primitive to `packages/ui` (if not already there), update all imports, delete from app.
   - **If touching a feature component:** Move to `packages/features/<name>/`, update call sites, thin the page if the “touch” is on the page.
   - **If touching only a page:** Refactor that page to thin composition (pull from packages); leave nested components in app for now unless you also touch them.

5. **Track progress (optional)**
   - Dashboard or script: count of pages that are “thin” (e.g. under N lines, or no direct use of app-local feature components), count of components still in app vs in packages. Use to prioritize which area to “touch” next.

### Risks and mitigation

| Risk | Mitigation |
|------|------------|
| Progress is slow or stalls | Reserve a small % of capacity for “migrate one module per sprint” or tie migration to refactor tickets. |
| Inconsistency (some use packages, some use app) | Lint: warn when new files in app define components that look like primitives (e.g. Button). Enforce “no new primitives in app.” |

### Effort (rough)

- One-time: package scaffold + docs (1–2 days). Ongoing: every touch adds ~10–30% time to migrate that module. Total calendar time: months to a year for a large app.

---

## Validation and Checklists

### “Thin page” checklist (per page)

- [ ] Page file imports only from packages (hooks, ui, features, store, utils, schemas) and at most one app-level layout or router wrapper.
- [ ] No inline data-fetching (use hooks from packages).
- [ ] No more than a small amount of local state (e.g. one or two `useState` for UI-only state like “modal open”).
- [ ] Single composition tree in the return (layout + feature components); no 50-line JSX with mixed logic.
- [ ] Line count under a target (e.g. &lt; 80 lines for a page file); optional but useful.

### Measuring “thinness”

- **Per page:** Line count, number of `useState`/`useEffect`, number of app-local imports (`@/features`, `@/components`). Target: few local state, zero or minimal app-local feature imports.
- **Repo-wide:** Count of components under `apps/web/features/` and `apps/web/components/` that are presentational or reusable; target is to move them to packages and shrink the count over time.

### Dependency and cycle checks

- Run `pnpm lint:cycles` (or equivalent) after each move. Ensure no package imports from `apps/web` and no cycles between packages.
- Enforce: `packages/features/*` → `packages/ui`, `packages/hooks`, etc.; never `packages/ui` → `packages/features`.

---

## Recommendation Summary

| If you… | Prefer |
|--------|--------|
| Need a clear, low-risk path and can invest 3–5 months | **Option D (Hybrid):** Primitives first, then feature-by-feature + thin pages. |
| Want to show “one feature done” quickly | **Option C (By feature):** Pick one vertical slice and do primitives + feature + thin page for that slice only. |
| Have a small app or a dedicated migration window | **Option A (Big-bang)** is possible but high risk for SilverKey-scale. |
| Cannot do a dedicated migration | **Option E (Strangler fig):** New code in packages, migrate on touch; accept long tail. |
| Want a strict, layer-only order | **Option B (By layer):** Primitives → layouts → features → thin pages. |

**Practical recommendation for SilverKey:** **Option D (Hybrid).** Phase 1 aligns with the existing shared-ui-package doc and gets the design system into packages once. Phase 2 lets you deliver value per feature (e.g. Saved thin, then Dashboard thin) and parallelize work. Option E can run in parallel for areas no one is actively migrating.

---

## Related Docs

- [thin-app-architecture.md](./thin-app-architecture.md) — Target state and “what lives in apps vs packages.”
- [shared-ui-package.md](./shared-ui-package.md) — How to add `packages/ui` and move primitives (Option 2).
- [shared-packages.md](./shared-packages.md) — Package inventory and import rules.
- **Client/ARCHITECTURE.md** — Layer rules and path aliases.
- **.cursor/rules/shared/thin-app-architecture.mdc** — Cursor rule enforcing thin app.
