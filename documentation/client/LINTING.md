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
  - Configured via `packages/config/eslint/eslint.config.js`.
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

  - Runs `eslint .` using `packages/config/eslint/eslint.config.js`.
  - This is the main command to check for code-quality and architectural issues.

- **Run all lint checks**

  ```bash
  pnpm lint:all
  ```

  - Convenience script that runs `pnpm lint`.

- **Format code with Prettier (fix in place)**

  ```bash
  pnpm format
  ```

  - Runs `prettier . --config packages/config/prettier/prettier.config.js --write`.
  - Applies the project’s formatting rules to all supported files in the client workspace.

- **Check formatting only (no writes)**

  ```bash
  pnpm format:check
  ```

  - Runs `prettier . --config packages/config/prettier/prettier.config.js --check`.
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

