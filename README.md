SilverKey Monorepo
===================

This repository contains the SilverKey application, with a TypeScript/React frontend (under `Client/`) and a Python backend (under `Server/`), plus shared tooling and CI.

This guide covers:

- **How to set up the project (with Cursor)**
- **What to install first**
- **How to run the web app and core checks**
- **An overview of the tech stack and repo organization**

**Documentation:** Canonical docs live in **`documentation/`** — see `documentation/README.md`. **AI assistants:** start with **`AGENTS.md`** at the repo root. Client and server each have a subfolder and index; major folders (Client, Server) have a short README.

---

Getting Started (Cursor-First Workflow)
---------------------------------------

### 1. Prerequisites

- **OS**: macOS (development is validated on macOS; other platforms may work but are not the primary target).
- **Editor**: **[Cursor](https://cursor.sh)** (required – all instructions assume you are using Cursor).
- **Node.js**: v20+ (LTS recommended).
- **pnpm**: `9.x` (matches `packageManager` in `Client/package.json`).
  - Install via: `corepack enable` and then `corepack prepare pnpm@9.0.0 --activate`, or follow pnpm docs.
- **Python** & tooling:
  - A modern Python (3.10+) and standard virtualenv tooling for the backend (if you plan to run the server).
- **Git** and **Docker** (optional, for CI parity and containerized runs).

### 2. Open the repo in Cursor (first thing to do)

1. Clone the repo:

   ```bash
   git clone <your-fork-or-origin-url> silverkey
   cd silverkey
   ```

2. **Open the folder in Cursor**:
   - `cursor .` from the repo root **or** use Cursor’s “Open Folder” and select the `SilverKey` directory.
3. Let Cursor:
   - Index the workspace.
   - Use the built-in agents for navigation and refactors (the project is configured with rules and skills that these agents understand).

> **Always prefer running commands, editing, and navigation inside Cursor.** The repo ships Cursor-specific rules and skills that keep changes aligned with the architecture.

### 3. Install frontend dependencies

From the repo root:

```bash
cd Client
pnpm install
```

This installs all dependencies for the `Client` pnpm workspace, including the main web app under `apps/web/`.

### 4. (Optional) Backend setup

If you need to work on or run the backend:

- **Python environment:** Use **Python 3.10–3.13** (3.14+ is not supported by current pinned wheels). From the repo root, run `bash Server/scripts/bootstrap-venv.sh` to create `Server/.venv` and install from `Server/requirements/` (use `--force` to replace an existing `Server/.venv`, `--ci` for a slimmer CI-oriented install). If your default `python3` is too new, set e.g. `PYTHON=python3.12`. Then `source Server/.venv/bin/activate`. See `Server/README.md` for which requirements file to use.
- **Do not run or modify database migrations** unless you know what you’re doing; Alembic/Flask migration commands are managed separately.

---

Running the Web App
-------------------

All commands below are intended to be run from a **Cursor terminal**.

1. **Start the web dev server**:

   ```bash
   cd Client
   pnpm dev:web
   ```

   This runs Vite for the `@silverkey/web` app under `apps/web/`. The terminal output will show the local dev URL (typically `http://localhost:5173` or similar).

2. **Build the production bundle**:

   ```bash
   cd Client
   pnpm build:web
   ```

3. **Preview the production build locally**:

   ```bash
   cd Client
   pnpm preview:web
   ```

---

Linting, Formatting, and Checks
-------------------------------

From `Client/`:

- **Lint the client workspace**:

  ```bash
  pnpm lint
  ```

- **Run all lints**:

  ```bash
  pnpm lint:all
  ```

- **Format code with Prettier**:

  ```bash
  pnpm format
  ```

- **Check formatting only**:

  ```bash
  pnpm format:check
  ```

- **Type-check the web app**:

  ```bash
  pnpm typecheck
  ```

- **Full client check pipeline (lint → format check → typecheck → web build)**:

  ```bash
  pnpm check
  ```

These scripts are defined in `Client/package.json` and run across the pnpm workspace.

---

Tech Stack Overview
-------------------

### Frontend (Client)

- **Language**: TypeScript.
- **Framework**: React 18.
- **Router**: `react-router-dom` (SPA routing, nested routes).
- **State Management**: `zustand` (global state in `packages/store/*`, consumed via hooks).
- **Data Fetching / Caching**: `@tanstack/react-query` (hooks in `packages/hooks/data/*`).
- **Styling**:
  - Tailwind CSS (via `tailwindcss`, `postcss`, `autoprefixer`).
  - Design system + UI components in `Client/packages/ui/`.
- **UI / UX Libraries**:
  - `@headlessui/react` (accessible primitives).
  - `lucide-react` (icons).
  - `embla-carousel-react`, `react-responsive-carousel` (carousels).
  - `framer-motion` (animations).
  - `react-virtuoso` (virtualized lists).
  - `react-phone-number-input` (phone inputs).
- **Build tooling**:
  - Vite (`vite`, `@vitejs/plugin-react-swc`).
  - Vitest + Testing Library (`vitest`, `@testing-library/*`, `jsdom`, `@vitest/ui`, `@vitest/coverage-v8`).
  - Playwright (`@playwright/test`) for E2E tests.
- **Linting / Formatting**:
  - ESLint (`eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, custom `eslint-plugin-silverkey`).
  - Prettier (`prettier`, `prettier-plugin-tailwindcss`).
  - Additional helpers: `globals`, `eslint-config-prettier`, `eslint-import-resolver-typescript`, `eslint-plugin-import`, `eslint-plugin-boundaries`, `eslint-plugin-prettier`.
- **Logging**:
  - Centralized frontend logger under `Client/packages/logger/` with PII-scrubbing and category-based configuration.

### Backend (Server)

- **Language**: Python.
- **Framework & tooling** (high level):
  - Flask-style application with SQLAlchemy-style models and Alembic migrations.
  - Centralized backend logging under `Server/logger/` (mirrors the frontend logger design).
- **Important constraints**:
  - Database schema and Alembic migrations are managed very carefully; avoid editing `Server/migrations/versions/` or running migration commands casually.

---

Repository Organization
-----------------------

At a high level:

- **Root**
  - `Client/` – Frontend monorepo (web app and shared TS packages).
  - `Server/` – Backend Python app and related code.
  - `.github/` – CI workflows (e.g., `ci_web.yml`).
  - Docker and infra files (`Dockerfile`, `.dockerignore`, etc.).

### Client folder layout (`Client/`)

- **`apps/`**
  - `apps/web/` – The main React web app (`@silverkey/web`).
    - `app/` – App shell, routing, top-level providers.
    - `components/` – Shared UI components (must use the standardized design system in `components/ui/`).
    - `features/` – Feature-level React components (search, dashboard, messaging, saved homes, etc.).
- **`packages/`**
  - `hooks/` – React hooks (`.ts` files only; no JSX). Includes:
    - `hooks/data/*` – Data-fetching hooks using React Query and API clients.
    - `hooks/store/*` – Store integration hooks around Zustand slices.
    - `hooks/ui/*` – UI-specific state hooks.
  - `services/` – Business logic and infrastructure services (framework-agnostic; **no React**).
  - `config/` – Configuration and API clients (e.g., `config/api/*`, HTTP config, env).
  - `store/` – Zustand slices defining global state.
  - `schemas/` – Shared types and schemas.
  - `utils/` – Pure utility and helper functions (no React).
- **`logger/`**
  - Shared frontend logging utilities (`logger.ts`, `pii.ts`, `categories.ts`, `logger.config.json`).
- **Top-level tooling**
  - `eslint.config.js`, multiple `tsconfig*.json`, `scripts/`, etc. for linting, builds, diagrams, and dev workflows.

This layered architecture is enforced by custom ESLint rules and is documented in `.cursor/rules/frontend/frontend-architecture.mdc` and `documentation/client/` (e.g. [shared-packages.md](documentation/client/shared-packages.md), [thin-app-architecture.md](documentation/client/thin-app-architecture.md)).

---

Recommended Day‑to‑Day Flow
---------------------------

1. **Open the repo in Cursor** and let it index the workspace.
2. **Start the web dev server** from a Cursor terminal:

   ```bash
   cd Client
   pnpm dev:web
   ```

3. **Use Cursor’s inline agents** to:
   - Navigate features (`apps/web/features/*`) and shared packages (`Client/packages/*`).
   - Apply safe refactors that respect the existing architecture (the repo ships detailed rules to guide the agent).
4. **Before pushing or opening a PR**, run:

   ```bash
   cd Client
   pnpm check
   ```

   This ensures lint, formatting, typecheck, and web build all pass locally.
