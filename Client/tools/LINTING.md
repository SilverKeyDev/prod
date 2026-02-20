## Frontend linting and type-checking

This document describes the main linting, formatting, and type-checking tools for the **Client** workspace and how to run them.

All commands below assume you are running them from the `Client/` directory:

```bash
cd Client
```

If you prefer to stay at the repo root, prefix commands with `cd Client &&`.

---

## Tooling overview

- **ESLint**
  - Configured via `Client/eslint.config.js`.
  - Uses the custom `eslint-plugin-silverkey` along with TypeScript and React-focused rules.
  - Enforces project-specific architecture, hooks, and style rules.

- **Prettier**
  - Used for automatic code formatting across the client codebase.
  - Integrated with lint-staged so it runs on changed files before each commit.

- **TypeScript**
  - Type-checking is configured for the web app via `Client/apps/web/tsconfig.json`.
  - Helps catch type errors and invalid API usage before build/deploy.

- **Git hooks**
  - `husky` and `lint-staged` are configured (see `Client/package.json`) to run lint/format checks on staged files before committing.

---

## Commands

From the `Client/` directory, you can use the following `pnpm` scripts:

- **Run ESLint on the entire client workspace**

  ```bash
  pnpm lint
  ```

  - Runs `eslint .` using `eslint.config.js`.
  - This is the main command to check for code-quality and architectural issues.

- **Check ESLint rule parity**

  ```bash
  pnpm lint:parity
  ```

  - Runs `node tools/check-parity.mjs`.
  - Ensures the custom `eslint-plugin-silverkey` rules stay in sync with the repo’s expectations.

- **Check platform-only imports (`.web.*` / `.native.*`)**

  ```bash
  pnpm lint:platform-imports
  ```

  - Runs `node tools/check-platform-imports.mjs`.
  - Scans `apps/web` and `apps/mobile` (if present). Warns when a file is imported only by `*.web.*` or only by `*.native.*` files but does not have the matching platform extension; such files should be renamed to `.web.ts`/`.web.tsx` or `.native.ts`/`.native.tsx`.
  - Fails if the same logical component has both `.mobile.*` and `.native.*` (mixed convention); use `.native.*` for React Native only. See `ARCHITECTURE.md` in the Client root (Platform file conventions).
  - **ESLint** also enforces `silverkey/platform-allowed-imports`: `.web.*` files must not import React Native-only packages; `.native.*` files must not import web-only packages. Shared packages are allowed on both. Run as part of `pnpm lint`.

- **Run all lint checks**

  ```bash
  pnpm lint:all
  ```

  - Convenience script that runs:
    - `pnpm lint`
    - `pnpm lint:parity`

- **Format code with Prettier (fix in place)**

  ```bash
  pnpm format
  ```

  - Runs `prettier . --write`.
  - Applies the project’s formatting rules to all supported files in the client workspace.

- **Check formatting only (no writes)**

  ```bash
  pnpm format:check
  ```

  - Runs `prettier . --check`.
  - Fails if any files are not formatted according to the configured style.

- **Run TypeScript type-checking for the web app**

  ```bash
  pnpm typecheck
  ```

  - Runs `tsc -p apps/web/tsconfig.json`.
  - Performs a full type-check without emitting compiled output.

- **Run full check (lint + format + typecheck + Vite build)**

  ```bash
  pnpm check
  ```

  - Runs `pnpm lint && pnpm format:check && pnpm typecheck && pnpm build:web`.
  - Same as the CI lint workflow; catches Vite resolution/transform errors (e.g. bad imports) that ESLint/TypeScript may miss.

---

## Recommended workflows

- **Before pushing a branch**
  - `pnpm check` (recommended: runs lint, format check, typecheck, and Vite build), or
  - `pnpm lint:all`, `pnpm format:check`, `pnpm typecheck`, and optionally `pnpm build:web`

- **When you’ve modified a lot of files**
  - `pnpm format` to normalize formatting.
  - Then `pnpm lint` to catch any style or architecture violations.

- **Spot-checking only formatting on CI or locally**
  - `pnpm format:check`

Because of husky + lint-staged, basic lint/format checks will also run automatically on staged files when you commit, but it’s still a good idea to run the full commands above for larger changes.

