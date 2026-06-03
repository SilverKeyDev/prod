# React + TypeScript component audit rubric (Cursor-driven)

This document is the **canonical rubric** for structured component reviews in SilverKey. Pair it with the Cursor rule [`.cursor/rules/frontend/component-audit-rubric.mdc`](../../../.cursor/rules/frontend/component-audit-rubric.mdc) when you want audits to follow these constraints automatically.

**Architecture context:** SilverKey uses **thin apps** and **fat packages** ([thin-app-architecture.md](../architecture/thin-app-architecture.md)). Prefer auditing **`Client/packages/**/*.tsx`** (shared UI, features, hooks-adjacent components). Treat **`Client/apps/**/*.tsx`** as thin composition; oversized or data-heavy app files often signal a **thin-app violation** (logic should move into `Client/packages/`).

---

## Scoring model

Score each **component file** (typically one primary exported component per file, or the file as a unit if several exports are tightly coupled) on **five axes**, **1–3** (1 = bad, 3 = good).

| Axis | Score 3 | Score 2 | Score 1 |
|------|---------|---------|---------|
| **1. Size & responsibility** | Under ~150 LOC, one clear job, name reflects behavior | ~150–300 LOC, two related responsibilities | 300+ LOC, multiple unrelated concerns (e.g. fetch + transform + render + form state in one file) |
| **2. Props & API surface** | ≤5 props, no `any`, no boolean prop explosions, no prop drilling past one level | 6–10 props, some drilling, mostly typed | 10+ props, `any` or vague object types, drilling 3+ levels, “kitchen sink” props (`config`, `options`, catch-alls) |
| **3. State & data flow** | State at the right level, derived values computed (not stored), no `useEffect` for pure derivations | Some redundant state, a few suspicious effects | Multiple `useState` that should be one `useReducer`, effects syncing state to state, fetching in deeply nested components |
| **4. Render cost** | No inline object/array/function props into memoized children, stable keys, no unnecessary memoization—or memoization only where it matters | Some inline allocations, occasional avoidable re-renders | Large lists without virtualization, index keys on reorderable lists, context values recreated every render, parent re-renders flooding children |
| **5. Bundle weight** | Imports only what is used, tree-shakeable, heavy deps lazy-loaded | One or two oversized deps that could be narrowed or swapped | Whole lodash/moment/date-fns namespaces, large chart libs for tiny UI, no route-level code splitting where appropriate |

### Fix list (triage)

- Add the file to the **fix list** if **total score ≤ 9** **or** **any axis scores 1**.
- After scoring, tag each row **P0 / P1 / P2** in your triage doc (see [Audit artifacts](#audit-artifacts)).

---

## Fat-package and dependency signals (second pass)

Run this **codebase-wide**, not per file. Use **grep / ripgrep**, **read_file**, and terminal tools—not memory.

| Flag | Examples |
|------|----------|
| Date / time | `moment` anywhere (prefer `date-fns`, `dayjs`, or native `Intl`) |
| Lodash | `import _ from "lodash"` instead of `lodash/get`, `lodash-es`, or targeted imports |
| Icons | Full `@mui/icons-material` or `react-icons` imports without tree-shaking |
| Charts | Multiple charting stacks (e.g. Recharts + Chart.js + D3) in the same app |
| HTTP | Both `axios` and `fetch` wrappers without a clear boundary |
| UI kits | e.g. `react-bootstrap` + Tailwind + a third UI kit layered without a documented reason |
| Polyfills | `core-js` or heavy polyfills beyond browser targets |
| Duplicates | e.g. `classnames` and `clsx`, `uuid` and `nanoid`, overlapping utilities |

**Suggested commands** (from `Client/` unless noted):

```bash
cd Client
npx depcheck
```

**Web bundle analysis (SilverKey):** `Client/apps/web/vite.config.js` enables `rollup-plugin-visualizer` when `ANALYZE=1` (or `true`). The web app exposes a script that sets this for you:

```bash
cd Client
pnpm --filter @silverkey/web run build:analyze
```

Output path (per Vite config): **`Client/dist/bundle-stats.html`** (treemap; gzip/brotli sizes). Use it for axis 5 and fat-package triage. Broader Vite and web script layout: [config-files-reference.md](../tooling/config-files-reference.md).

Optional elsewhere: `npx source-map-explorer` on built chunks if you need line-level attribution beyond the visualizer.

### Cursor agents that overlap

For deeper passes, use the subagents listed in [`documentation/internal/cursor-audit-latest.md`](../../internal/cursor-audit-latest.md), for example:

- **Bundle / build:** `silverkey-bundle-build-optimizer`
- **Import boundaries / layering:** `silverkey-architecture-boundary-auditor`
- **Performance hotspots:** `silverkey-performance-regression-analyzer`
- **Dead / unused code:** `silverkey-dead-code-sweeper`

---

## Architecture-level smells (flag, do not “fix” in the same pass)

- **Flat folders by type** at huge scale (`/components`, `/hooks`, `/utils` each with 200+ unrelated files) instead of **feature-oriented** layout. SilverKey’s norm is **`Client/packages/features/<feature>/...`** and **`Client/packages/ui/`**—call out drift when new flat dumps appear.
- **Barrel files** (`index.ts` re-exporting whole directories) that hurt tree-shaking or dev cold start—especially barrels that re-export heavy optional modules.
- **Container/presenter** splits that only duplicate what a hook could own (legacy pattern).
- **Context as a high-frequency global store**—value changes force broad re-renders.
- **Route or layout modules** that import a large fraction of the app through one shared entry.
- **`useEffect` for event-driven work** the React docs warn against (effects that should be event handlers or framework loaders).

**Thin-app angle:** If `Client/apps/web/pages/**` or `Client/apps/mobile/**` scores poorly on axes 1–3, first check whether the work belongs in **`Client/packages/features/`** or **`Client/packages/hooks/`** per [layered-architecture-imports.md](../architecture/layered-architecture-imports.md).

---

## How to run this in Cursor (high signal)

### 1. Index and scope

- Ensure the repo is **indexed** in Cursor (e.g. **Index Codebase**, or use **@Codebase** where appropriate).
- Scope globs to real paths, for example:
  - `Client/packages/ui/**/*.tsx`
  - `Client/packages/features/**/components/**/*.tsx`
  - Optionally `Client/apps/web/pages/**/*.tsx` for thinness checks

### 2. One axis per session

Do **not** ask for all five axes at once; output becomes shallow. Example prompt template:

> Using [react-component-audit-rubric.md](react-component-audit-rubric.md), scan **&lt;glob&gt;**. For **axis 1 (Size & responsibility) only**, produce a markdown table: `file path`, `LOC`, `# of responsibilities identified`, `score 1–3`, `one-sentence justification`. **Do not fix anything.** **Do not** score other axes.

Repeat for axes 2–5 in separate sessions (or separate agent runs).

### 3. Evidence rule (anti-hallucination)

For **every score of 1**, require an exact citation:

`path/to/File.tsx:startLine-endLine`

with a **short quoted** excerpt from the file. If the model cannot cite lines after reading the file, it must **lower confidence** or omit the score-1 claim.

For **any recommended change**, quote the **original** code first; do not recommend fixes from vague memory.

### 4. Prefer tools over prose

Use **grep**, **read_file**, LOC counts, and dependency/build outputs. The failure mode is reasoning about bundle shape or imports without opening `bundle-stats.html` or `package.json`.

### 5. Deliverable is a file, not chat

**Chat is not the deliverable.** Write findings to the [audit artifact locations](#audit-artifacts) below. In chat, only confirm paths written and any blockers.

---

## Audit artifacts

### Default (tracked): `documentation/internal/component-audit/`

Use this when the team wants **PR-reviewable** or shared triage history.

- Add or update files such as `components-axis-1.md`, `components-axis-2.md`, …, `packages-fat-deps.md`.
- Maintain **`TRIAGE.md`** (or equivalent) with columns for **P0 / P1 / P2** and links back to source paths.

See [component-audit/README.md](../../internal/component-audit/README.md) for a minimal folder convention.

### Alternative (local only): repo-root `audit/`

For throwaway runs (closest to a root-level `audit/components.md` workflow), write under **`audit/`** at the repository root. That directory is **gitignored** (see root [`.gitignore`](../../.gitignore)) so generated tables do not clutter commits.

### Remediation subagents (fix pass)

After triage (**P0 / P1 / P2**), spawn **one agent per PR-sized fix** (or per small batch the user approves). Each persona assumes audit evidence already exists—do not re-audit in the same thread unless verifying.

| Rubric scope | Subagent | `.cursor/agents/` file |
|--------------|----------|-------------------------|
| Axis 1 — size & responsibility | **Axis 1 fixer** | [`silverkey-audit-axis1-size-responsibility-fixer.md`](../../../.cursor/agents/silverkey-audit-axis1-size-responsibility-fixer.md) |
| Axis 2 — props & API | **Axis 2 fixer** | [`silverkey-audit-axis2-props-api-fixer.md`](../../../.cursor/agents/silverkey-audit-axis2-props-api-fixer.md) |
| Axis 3 — state & data flow | **Axis 3 fixer** | [`silverkey-audit-axis3-state-dataflow-fixer.md`](../../../.cursor/agents/silverkey-audit-axis3-state-dataflow-fixer.md) |
| Axis 4 — render cost | **Axis 4 fixer** | [`silverkey-audit-axis4-render-cost-fixer.md`](../../../.cursor/agents/silverkey-audit-axis4-render-cost-fixer.md) |
| Axis 5 — bundle / imports | **Axis 5 fixer** | [`silverkey-audit-axis5-bundle-import-fixer.md`](../../../.cursor/agents/silverkey-audit-axis5-bundle-import-fixer.md) |
| Architecture smells (barrels, fat routes, context store) | **Architecture remediation** | [`silverkey-audit-architecture-remediation.md`](../../../.cursor/agents/silverkey-audit-architecture-remediation.md) |

**Discovery-only agents** (run before or alongside fixes): `silverkey-refactor-suggestion-engine`, `silverkey-performance-regression-analyzer`, `silverkey-bundle-build-optimizer`, `silverkey-architecture-boundary-auditor`, `silverkey-file-module-reorganizer` — see [`documentation/internal/cursor-audit-latest.md`](../../internal/cursor-audit-latest.md).

### Related docs

- Hooks and effect pitfalls: [react-hooks-patterns.md](react-hooks-patterns.md)
- Responsive audit map: [responsive-ui-standards.md](../standards/responsive-ui-standards.md)
- Lint gates including file size: [LINTING.md](../standards/LINTING.md)
