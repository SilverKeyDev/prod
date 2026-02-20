---
name: scan-fix-import-errors
description: Scans the Client codebase for import and module resolution errors, categorizes them, and applies fixes following project architecture. Use when the user asks to fix import errors, resolve module not found, fix broken imports after refactors, or run an import-error subagent.
---

# Scan and Fix Import Errors

This skill defines a subagent workflow: **scan for import errors → categorize → fix → verify**. Run it when asked to fix imports, resolve "module not found" or "has no exported member" errors, or after large refactors.

## When to Use

- User asks to "scan for import errors", "fix import errors", or "run the import subagent"
- After moving/renaming files or packages
- After seeing TypeScript/ESLint errors about missing modules or missing exports
- As part of a cleanup or parity pass

## Workflow

### Step 1: Surface errors

From repo root, run (Client is the frontend monorepo):

```bash
cd Client && pnpm typecheck
```

Then:

```bash
cd Client && pnpm lint
```

Capture full output. TypeScript and ESLint both report import/module errors.

### Step 2: Categorize each error

Map each failure to one category:

| Category | Typical message | Fix direction |
|----------|-----------------|----------------|
| **Module not found** | `Cannot find module 'X'` | Correct path or add missing file/barrel export |
| **No exported member** | `Module 'X' has no exported member 'Y'` | Fix export name or import from correct module |
| **Wrong layer** | Component importing `config/api` or `services` | Use a hook that wraps API/service instead |
| **Path resolution** | Wrong relative path or wrong package reference | Use correct relative path or workspace package path |
| **Barrel missing** | File exists but index doesn’t re-export | Add or fix re-export in `index.ts` |
| **Circular** | Circular dependency chain | Break cycle (extract shared type/util, invert dependency) |

### Step 3: Fix systematically

- **One error at a time** when they’re independent; batch only when the same fix applies to many files (e.g. one barrel export).
- **Respect project rules**:
  - `apps/web/*` must not import `config/api/*` or business `services/*` directly; use `packages/hooks/*` (e.g. `hooks/data/*`) instead.
  - Hooks use `config/api/*`, not business `services/*`.
  - Services use `config/api/*` and `services/http/*`; they must not import hooks or store.
  - Utilities live in `packages/utils/`; no standalone `.ts` logic under `apps/web/components/` or `apps/web/features/` (only `.tsx` and barrel `index.ts` re-exports).
- **Path rules**:
  - Within same package: use relative paths (`./file`, `../folder/file`).
  - Cross-package in Client monorepo: use workspace-relative paths (e.g. from `apps/web` to `packages/hooks`: `../../../packages/hooks/...` or as configured in tsconfig paths).
  - Prefer existing barrel exports (`index.ts`) when they exist; don’t bypass them with deep file paths unless necessary.
- **Finding the right export**: Use grep/search for the symbol (function, type, constant) to find the defining file, then fix the import path and export name (or add the export).

### Step 4: Verify

After edits:

```bash
cd Client && pnpm typecheck && pnpm lint
```

If new errors appear, treat them as new items in the workflow (categorize → fix). Repeat until both commands pass.

## Quick reference

- **Typecheck**: `Client`: `pnpm typecheck` (uses `apps/web/tsconfig.json`).
- **Lint**: `Client`: `pnpm lint`.
- **Architecture**: See `.cursor/rules/frontend/frontend-architecture.mdc` for import rules between apps/web, packages/hooks, packages/config, packages/services, packages/store, packages/utils.
- **Barrel exports**: When a folder has an `index.ts`, prefer `from "./folder"` or `from "package/folder"` and ensure the barrel exports the symbol you need.

## Checklist

Use this to track a run:

```
- [ ] Ran pnpm typecheck in Client and captured errors
- [ ] Ran pnpm lint in Client and captured errors
- [ ] Categorized each error (module not found / no export / wrong layer / path / barrel / circular)
- [ ] Fixed each error respecting layer and path rules
- [ ] Re-ran typecheck and lint; both pass
```
