# Client documentation

Docs for the SilverKey frontend: TypeScript/React (web) and React Native (mobile), monorepo structure, and lint/architecture.

## Contents

| Doc | Description |
|-----|--------------|
| [LINT_RULES_REFERENCE.md](./LINT_RULES_REFERENCE.md) | Every ESLint/SilverKey rule, grouped by location and file pattern. |
| [typescript-files.md](./typescript-files.md) | Where `.ts` (non-TSX) files live and their roles by package. |
| [shared-packages.md](./shared-packages.md) | Exhaustive reference for all shared packages under `Client/packages/`. |
| [react-vs-react-native-packages.md](./react-vs-react-native-packages.md) | React (web) vs React Native: extensions (`.web` / `.native`), APIs, enforcement. |
| [shared-ui-package.md](./shared-ui-package.md) | Option 2: shared `packages/ui` for cross-platform primitives (doc only). |
| [thin-app-architecture.md](./thin-app-architecture.md) | Thin App (Fat Packages): apps as composition layer only; what lives in apps vs packages. |
| [thin-app-implementation-strategy.md](./thin-app-implementation-strategy.md) | How to implement Thin App: strategy options (big-bang, by layer, by feature, hybrid, strangler) with detailed steps and checklists. |
| [apps-folder-contents.md](./apps-folder-contents.md) | What lives in apps/web and apps/mobile only: bootstrapper, provider tree, router, and thin pages/screens (orchestrator-only). |
| [web-mobile-parity-gotchas.md](./web-mobile-parity-gotchas.md) | Three gotchas: stale app (API/schema versioning), React version dictator, deep linking. |

## Related in repo

- **Client/ARCHITECTURE.md** — Frontend architecture and layer rules.
- **Client/MOBILE_MIGRATION_DESKTOP_FILES.md** — Canonical list of web-only and desktop-only files.
- **Client/tools/LINTING.md** — How to run lint and platform checks locally.
- **Client/packages/README.md** — Package overview and import rules.
