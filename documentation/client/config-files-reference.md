# Client config files reference

This document explains every **tsconfig**, **package.json**, **vite.config**, and **tailwind.config** in the Client monorepo: what each is for, whether it is necessary, and whether it can be merged or simplified.

---

## 1. TypeScript configs (tsconfig)

All paths below are relative to **`Client/`**.

| File | Purpose | Necessary? | Can merge? |
|------|---------|------------|------------|
| **tsconfig.base.json** | Defines shared `baseUrl`, `paths` (aliases like `@/*`, `@ui`, `logger`, `packages/*`) and `exclude`. No `compilerOptions` for target/lib — those live in the app config. | **Yes.** Single source for path aliases used by the app and by tooling. | No — other configs extend it. |
| **apps/web/tsconfig.json** | Entry point for **typecheck** and **IDE**: extends base, adds `module`/`moduleResolution`/`types`, and **project references** to the two configs in `packages/config/tsconfig/`. | **Yes.** Used by `pnpm typecheck` and editors. | No — it’s the thin orchestrator. |
| **packages/config/tsconfig/tsconfig.app.json** | **Main app + packages** config: strict options, `include` for `apps/web`, all shared packages, and `packages/config/vite-env.d.ts`. Used by **madge** (`lint:cycles`) and by Vite’s type-aware tooling. | **Yes.** Defines the real “app + packages” boundary and strict compiler options. | No — this is the heavy, canonical app config. |
| **packages/config/tsconfig/tsconfig.node.json** | **Node/Vite config** only: `include` is just `apps/web/vite.config.ts`. Used so `vite.config.ts` is type-checked with Node-friendly settings (e.g. `moduleResolution: "bundler"`). | **Yes.** Keeps `vite.config.ts` in the reference graph without pulling in React/DOM. | No — different “environment” (Node vs browser). |

**Summary**

- **In use:** Four tsconfig files: `tsconfig.base.json`, `apps/web/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`. Each has a distinct role.
- **Flow:** `apps/web/tsconfig.json` extends base and points to `tsconfig.app.json` (app + packages) and `tsconfig.node.json` (Vite config). Typecheck and cycles check use this graph.

---

## 2. package.json files

| File | Purpose | Necessary? | Can merge? |
|------|---------|------------|------------|
| **Client/package.json** | **Workspace root**: scripts for dev/build/lint/format/typecheck/cycles/audit; `pnpm` packageManager; devDependencies and dependencies used at root (ESLint, Prettier, TypeScript, React, etc.). Defines `typecheck` as `tsc -p apps/web/tsconfig.json` and `lint:cycles` with `tsconfig.app.json`. | **Yes.** Single place to run `pnpm dev:web`, `pnpm lint`, `pnpm check`, etc. | No — this is the monorepo root. |
| **Client/apps/web/package.json** | **Web app**: name `@silverkey/web`, scripts for Vite (dev/build/preview), typecheck, lint, format, tests. Dependencies for the web app only. | **Yes.** App-specific scripts and deps; root delegates via `pnpm --filter @silverkey/web`. | No — each app should have its own. |
| **Client/packages/config/eslint/eslint-plugin-silverkey/package.json** | **ESLint plugin package**: name `eslint-plugin-silverkey`, `main`, `type: "commonjs"`. Lets the plugin be installed as `file:packages/config/eslint/eslint-plugin-silverkey` from root. | **Yes.** Required for pnpm to treat it as a workspace package and resolve the file: dependency. | No — it’s a separate package. |
| **Client/packages/design-tokens/package.json** | **Design tokens package**: name `@silverkey/design-tokens`, `main`/`types`/`exports` for the package. Used by Tailwind and other consumers. | **Yes.** Required for workspace resolution and for `packages/design-tokens` to be a proper package. | No — it’s a separate package. |

**pnpm-workspace.yaml**

- **Client/pnpm-workspace.yaml** defines `packages: ["apps/*", "packages/*"]`. **Necessary** so pnpm treats `apps/web`, `packages/config/...`, `packages/design-tokens`, etc. as workspace members. Do not merge into another file.

**Summary**

- All four `package.json` files and the workspace yaml are necessary and should not be merged. Root = orchestration; apps/web = web app; the two packages need their own `package.json` for workspace and dependency resolution.

---

## 3. Vite configs

All in **`Client/apps/web/`**. Only one file exists (recommendations applied).

| File | Purpose | Necessary? | Can merge? |
|------|---------|------------|------------|
| **vite.config.ts** | **Canonical config**: root, base, plugins (React), envDir, publicDir, PostCSS, server (port, proxy, HMR), optimizeDeps, build (target, rollup manualChunks, aliases), resolve (alias, extensions, dedupe). Referenced by `package.json` (`vite --config vite.config.ts`). | **Yes.** This is the single source of truth for the Vite build. | N/A. |

---

## 4. Tailwind configs

All in **`Client/apps/web/`**. Only one file exists (recommendations applied).

| File | Purpose | Necessary? | Can merge? |
|------|---------|------------|------------|
| **tailwind.config.ts** | **Canonical config**: imports design tokens from `packages/design-tokens` (colors, spacing, breakpoints, fontFamily, fontSize), defines content paths, theme extensions (animations, keyframes, spacing, minHeight, zIndex, etc.). PostCSS/Vite run from `apps/web` so Tailwind resolves this file. | **Yes.** Single source that uses the shared design tokens. | N/A. |

---

## 5. Implementation status

| Area | Status |
|------|--------|
| **tsconfig** | Done. Four configs in use; optional root `tsconfig.json` removed. Clear split: base (paths) → app (references) → app + node configs. |
| **package.json** | No change required. Root + app + two packages; workspace yaml in place. |
| **Vite** | Done. Only `vite.config.ts` remains; duplicates removed. |
| **Tailwind** | Done. Only `tailwind.config.ts` remains; duplicate removed. |

---

## 6. Diagram: how configs connect

```
Client/
├── package.json              → pnpm scripts (typecheck, lint, lint:cycles, etc.)
├── pnpm-workspace.yaml       → apps/*, packages/*
├── tsconfig.base.json        → path aliases (@/*, @ui, logger, packages/*)
│
├── apps/web/
│   ├── package.json          → vite --config vite.config.ts, typecheck, lint
│   ├── tsconfig.json          → extends base, references → tsconfig.app + tsconfig.node
│   ├── vite.config.ts         → single Vite config
│   ├── tailwind.config.ts     → single Tailwind config
│   └── postcss.config.js      → tailwindcss(), autoprefixer() [no config path → Tailwind finds .ts in same dir]
│
└── packages/config/
    ├── tsconfig/
    │   ├── tsconfig.app.json   → full app + packages include; used by madge & tooling
    │   └── tsconfig.node.json  → only vite.config.ts (Node env)
    └── vite-env.d.ts           → included by tsconfig.app; Vite/Google types
```

---

## 7. References

- **Path aliases:** `Client/tsconfig.base.json` and `Client/apps/web/vite.config.ts` (resolve.alias) must stay in sync for builds and types.
- **Lint/typecheck:** `.cursor/rules/shared/ci-gates.mdc` — typecheck and lint:cycles are required; they depend on `apps/web/tsconfig.json` and `tsconfig.app.json`.
- **Design tokens:** `Client/packages/design-tokens/README.md` — Tailwind and others consume this; `tailwind.config.ts` imports from it.
