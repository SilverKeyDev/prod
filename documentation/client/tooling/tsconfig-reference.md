# TypeScript config reference (tsconfig)

Reference for every **tsconfig** in the Client monorepo: roles, how they extend each other, and how they work with the IDE and scripts. All paths are relative to **`Client/`** unless noted.

---

## 1. Overview

| File | Role | Extends / references |
|------|------|----------------------|
| **tsconfig.json** | Root config used when the workspace root is `Client`. Defines “whole repo” for IDE and tooling. | `tsconfig.base.json` |
| **tsconfig.base.json** | Shared base for **web + packages**: path aliases (`@/*` → apps/web, `packages/*`, etc.), target ES2020, lib DOM. | — |
| **apps/web/tsconfig.json** | Web app entry for `pnpm typecheck` and Vite. | Root `tsconfig.base.json`; **references** `tsconfig.app.json` and `tsconfig.node.json` |
| **packages/config/tsconfig/tsconfig.app.json** | Canonical strict config for **web app + packages**. Used by ESLint type-aware lint and madge (`lint:cycles`). | Root `tsconfig.base.json` |
| **packages/config/tsconfig/tsconfig.node.json** | Build config for **vite.config.js** only (composite). | — |
| **apps/mobile/tsconfig.json** | Mobile app TypeScript. Isolated from web (different JSX, target, module resolution). | **Local** `./tsconfig.base.json` |
| **apps/mobile/tsconfig.base.json** | Expo/React Native–style base: ESNext, `react-native` JSX, `bundler` resolution. | — |
| **packages/api/tsconfig.json** | Typecheck for the API client package (`packages/api`). | Root `tsconfig.base.json` |

---

## 2. Root and web flow

- **Root `tsconfig.json`** includes only **apps/web** and **packages**. It **excludes** `apps/mobile` so the IDE does not apply web path aliases and web-only settings to mobile code when the workspace root is `Client`.
- **apps/web/tsconfig.json** extends the root base and adds Vite-specific options (`types: ["vite/client"]`, module settings). It uses **project references** to:
  - **tsconfig.app.json** — the full app + packages graph (used by madge and ESLint).
  - **tsconfig.node.json** — only `vite.config.js` and `vite.config.resolve.js` (Node environment).
- **Typecheck script:** `pnpm typecheck` runs `tsc -p apps/web/tsconfig.json`, so the default typecheck is web + packages only.

---

## 3. Mobile (isolated)

- **apps/mobile/tsconfig.json** extends **apps/mobile/tsconfig.base.json** only. It does **not** extend the root `tsconfig.base.json`.
- **apps/mobile/tsconfig.base.json** defines Expo/React Native–style options: `jsx: "react-native"`, `moduleResolution: "bundler"`, `target: "ESNext"`, `lib: ["DOM", "ESNext"]`. This keeps mobile typechecking independent of web paths and web tooling.
- **Typecheck script:** `pnpm typecheck:mobile` runs `tsc -p apps/mobile/tsconfig.json` for mobile-only typecheck from the repo root.

---

## 4. Packages config

- **packages/config/tsconfig/tsconfig.app.json** — Strict options (strict, noImplicitAny, noUncheckedIndexedAccess, etc.), `baseUrl: "../../.."`, `include` for `apps/web` and `packages`. This is the single “app + packages” config used by:
  - **madge** (`pnpm lint:cycles`) for circular dependency checks.
  - **ESLint** type-aware rules for files in that graph.
- **packages/config/tsconfig/tsconfig.node.json** — Composite config whose `include` is only `apps/web/vite.config.js` and `vite.config.resolve.js`. Keeps the Vite config in the reference graph with Node-friendly settings.

---

## 5. Diagram: how configs connect

```
Client/
├── tsconfig.json              → include: apps/web, packages; exclude: apps/mobile
├── tsconfig.base.json         → path aliases, target ES2020, lib DOM (web + packages)
│
├── apps/web/
│   └── tsconfig.json          → extends base; references → tsconfig.app + tsconfig.node
│
├── apps/mobile/
│   ├── tsconfig.json          → extends ./tsconfig.base.json; paths @/*, packages/*
│   └── tsconfig.base.json     → ESNext, react-native jsx, bundler resolution (no root base)
│
├── packages/config/tsconfig/
│   ├── tsconfig.app.json      → extends root base; full app + packages; used by madge & ESLint
│   └── tsconfig.node.json     → vite.config.js + vite.config.resolve.js only (composite)
│
└── packages/api/
    └── tsconfig.json          → extends root base; include packages/api
```

---

## 6. Scripts

| Script | Command | What it typechecks |
|--------|---------|--------------------|
| **typecheck** | `tsc -p apps/web/tsconfig.json` | Web app + packages (via references) |
| **typecheck:mobile** | `tsc -p apps/mobile/tsconfig.json` | Mobile app + included packages (e.g. packages/ui) |
| **lint:cycles** | `madge --ts-config packages/config/tsconfig/tsconfig.app.json ...` | Web + packages graph only |

---

## 7. References

- **Path aliases:** `Client/tsconfig.base.json` and `Client/apps/web/vite.config.js` (resolve.alias) must stay in sync for web builds and types.
- **CI:** `.cursor/rules/shared/ci-gates.mdc` — typecheck and lint:cycles are required; they use `apps/web/tsconfig.json` and `tsconfig.app.json`.
- **High-level config overview:** [config-files-reference.md](config-files-reference.md).
