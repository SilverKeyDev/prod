---
name: run-all-linters
description: Runs the repo's unified linter script (fix phase then linters) and reports output. Use when the user asks for linter errors, lint status, run linters, check lint, fix lint, or to see what's failing in the build.
---

# Run All Linters

When the user asks for **linter errors**, **lint status**, **run linters**, **check lint**, or similar, run the repo's single entry point and report the results.

## Command

From repo root:

```bash
./scripts/run-all-linters.sh all
```

Use scope `client` or `server` only when the user specifies (e.g. "client linter errors" → `./scripts/run-all-linters.sh client`).

## What the script does

1. **Fix phase (runs first)**
   - **Client:** `pnpm format` (Prettier), then `pnpm lint:fix` (ESLint --fix). Client fix is non-fatal so linters still run if fix exits 1.
   - **Server:** `ruff check . --fix`, then `ruff format .`

2. **Linter phase (runs after fixes)**
   - **Client:** `Client/scripts/run-client-linters.sh` → optional executable `Client/scripts/lint.d/*.sh` (sorted), then `pnpm check` (typecheck, eslint+stylelint, format:check, cycles, audit, build:web).
   - **Server:** each `Server/scripts/lint_*.py`, then each executable `Server/scripts/lint_*.sh` (includes `lint_10_ruff.sh`, `lint_20_pyright.sh` and any future `lint_*.sh`).

The script may install Client deps (`pnpm install` in Client) if `node_modules/.bin` is missing. It uses a Server venv if present (`.venv` or `venv` in Server).

## Why some runtime errors (e.g. "X is not defined") are not reported

- **Typecheck:** The Client `typecheck` script runs `tsc -p apps/web/tsconfig.json`. That config has `"files": []` and only project references. With plain `tsc -p` (no `--build`), TypeScript typechecks only that project, which has zero files, so it always passes and does **not** typecheck app source. Undefined variables and other TS errors in app code are therefore not reported.
- **ESLint:** In TypeScript projects, `no-undef` is typically off for TS files (typescript-eslint recommended); ESLint defers "variable not defined" to TypeScript. So if typecheck doesn’t run over app source, neither tool catches it.
- **To make typecheck actually check app code:** Use a config that includes source (e.g. `tsc -p tsconfig.app.json`) or run `tsc --build apps/web/tsconfig.json` so referenced projects are typechecked. The repo currently has many existing TS errors under that check; fixing the typecheck gate will require addressing those first.

## After running

- Summarize which steps ran and whether they passed or failed.
- If something failed, quote or summarize the failure (e.g. ESLint error count, first few errors, or the failing step).
- If the user asked to fix linter errors, propose or apply fixes for the reported issues; re-run the script to verify when appropriate.
