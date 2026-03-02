# Client documentation

Docs for the SilverKey frontend: TypeScript/React (web) and React Native (mobile), monorepo structure, and lint/architecture.

## Contents

| Doc | Description |
|-----|--------------|
| [LINTING.md](./LINTING.md) | How to run lint and platform checks locally; ESLint and SilverKey rules. |
| [typescript-files.md](./typescript-files.md) | Where `.ts` (non-TSX) files live and their roles by package. |
| [shared-packages.md](./shared-packages.md) | Exhaustive reference for all shared packages under `Client/packages/`. |
| [react-vs-react-native-packages.md](./react-vs-react-native-packages.md) | React (web) vs React Native: extensions (`.web` / `.native`), APIs, enforcement. |
| [shared-ui-package.md](./shared-ui-package.md) | Option 2: shared `packages/ui` for cross-platform primitives (doc only). |
| [thin-app-architecture.md](./thin-app-architecture.md) | Thin App (Fat Packages): apps as composition layer only; what lives in apps vs packages. |
| [apps-folder-contents.md](./apps-folder-contents.md) | What lives in apps/web and apps/mobile only: bootstrapper, provider tree, router, and thin pages/screens (orchestrator-only). |
| [mobile-app-structure.md](./mobile-app-structure.md) | Full breakdown of the React Native mobile app: structure and purpose of each file under `Client/apps/mobile/`. |
| [web-mobile-parity-gotchas.md](./web-mobile-parity-gotchas.md) | Three gotchas: stale app (API/schema versioning), React version dictator, deep linking. |
| [config-files-reference.md](./config-files-reference.md) | Every tsconfig, package.json, vite.config, and tailwind.config: purpose, necessity, and whether it can be merged. |
| [tsconfig-reference.md](./tsconfig-reference.md) | TypeScript config hierarchy: root, web, mobile, packages/config; how they extend and reference each other; scripts. |
| [tailwind-config-reference.md](./tailwind-config-reference.md) | Tailwind and PostCSS: web vs mobile, shared preset (ESM vs CJS), content paths, and how they work with Vite and Metro. |
| [platformVariants/README.md](./platformVariants/README.md) | Package-level adaptations: web dependencies that need a different package or implementation on React Native (by package.json). |

## Related in repo

- **Architecture and layer rules:** `.cursor/rules/frontend/frontend-architecture.mdc` and `thin-app-architecture.mdc`.
- **Platform file conventions (web-only / desktop-only):** `.cursor/rules/frontend/platform-file-extensions.mdc`.
- **Lint and checks:** [documentation/client/LINTING.md](./LINTING.md).
- **Client/packages/README.md** — Package overview and import rules.
