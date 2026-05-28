# Client documentation

Docs for the SilverKey frontend: TypeScript/React (web) and React Native (mobile), monorepo structure, and lint/architecture.

## Contents

| Doc | Description |
|-----|--------------|
| [LINTING.md](./LINTING.md) | How to run lint and platform checks locally; ESLint and SilverKey rules. |
| [accessibility-standards.md](./accessibility-standards.md) | WCAG 2.1 Level AA targets, design-system a11y contracts, RN appendix; pair with `.cursor/rules/frontend/accessibility.mdc`. |
| [responsive-ui-standards.md](./responsive-ui-standards.md) | Breakpoints, web/RN responsive rules, SilverKey path map for audits; pair with `.cursor/rules/frontend/responsive-ui.mdc`. |
| [typescript-files.md](./typescript-files.md) | Where `.ts` (non-TSX) files live and their roles by package. |
| [shared-packages.md](./shared-packages.md) | Exhaustive reference for all shared packages under `Client/packages/`. |
| [../OPENAPI_MIGRATION.md](../../OPENAPI_MIGRATION.md) | OpenAPI 3.1.0 type system: single source of truth in `openapi.yaml`, auto-generated types, migration guide. See also `.cursor/rules/shared/openapi-types.mdc`. |
| [react-vs-react-native-packages.md](./react-vs-react-native-packages.md) | React (web) vs React Native: extensions (`.web` / `.native`), APIs, enforcement. |
| [shared-ui-package.md](./shared-ui-package.md) | Option 2: shared `packages/ui` for cross-platform primitives (doc only). |
| [thin-app-architecture.md](./thin-app-architecture.md) | Thin App (Fat Packages): apps as composition layer only; what lives in apps vs packages. |
| [layered-architecture-imports.md](./layered-architecture-imports.md) | Long-form import matrix: config vs hooks vs services vs `packages/features`; supplements `.cursor/rules/frontend/frontend-architecture.mdc`. |
| [react-hooks-patterns.md](./react-hooks-patterns.md) | Loop-prevention patterns (`useEffect`, React Query, Zustand selectors); supplements `.cursor/rules/frontend/react-hooks.mdc`. |
| [react-component-audit-rubric.md](./react-component-audit-rubric.md) | Five-axis component audit (size, props, state, render cost, bundle), Cursor workflow, artifacts; supplements `.cursor/rules/frontend/component-audit-rubric.mdc`. |
| [workspace-first-architecture.md](./workspace-first-architecture.md) | Workspace vs server identity (`useActiveWorkspace`, shells, transaction party config, admin scope); buyer/agent inventories + placeholder workspaces. |
| [workspaces-placeholder-shells.md](./workspaces-placeholder-shells.md) | Contract for seller / brokerage / integration_partner shell-only UX until features ship. |
| [profile-onboarding-flow.md](./profile-onboarding-flow.md) | Declarative onboarding step registry, flow templates, and `renderOnboardingStep` wiring. |
| [rev-share-partners.md](./rev-share-partners.md) | Partner placement admin, `/r/{link_id}` click tracking, CTR/step views, Move Concierge checklist wiring. |
| [cursor-agent-memory.md](./cursor-agent-memory.md) | Agent memory: `.cursor/memory/`, Cursor Settings → Memories, Automations Memory Notes, MCP `cursor-memory`. |
| [../internal/post-major-change-checklist.md](../internal/post-major-change-checklist.md) | Checklist: after major features, update `documentation/`, `.cursor/rules`, skills, and cursor audit inventory. |
| [qa/](./qa/) | E2E QA runbooks, cross-browser matrix, error/email/payment checklists (manual; no in-repo browser automation). **Start with [qa/END_TO_END_QA_RUNBOOK.md](./qa/END_TO_END_QA_RUNBOOK.md).** Includes [qa/ACCESSIBILITY_CHECKLIST.md](./qa/ACCESSIBILITY_CHECKLIST.md) for WCAG 2.1 AA release pass. |
| [apps-folder-contents.md](./apps-folder-contents.md) | What lives in apps/web and apps/mobile only: bootstrapper, provider tree, router, and thin pages/screens (orchestrator-only). |
| [mobile-app-structure.md](./mobile-app-structure.md) | Full breakdown of the React Native mobile app: structure and purpose of each file under `Client/apps/mobile/`. |
| [web-mobile-parity-gotchas.md](./web-mobile-parity-gotchas.md) | Three gotchas: stale app (API/schema versioning), React version dictator, deep linking. |
| [google-maps-web-setup.md](./google-maps-web-setup.md) | Web Maps: Cloud Map ID (`EXPO_PUBLIC_GOOGLE_MAPS_ID`) vs server API key, local/prod setup, verification. |
| [config-files-reference.md](./config-files-reference.md) | Every tsconfig, package.json, vite.config, and tailwind.config: purpose, necessity, and whether it can be merged. |
| [tsconfig-reference.md](./tsconfig-reference.md) | TypeScript config hierarchy: root, web, mobile, packages/config; how they extend and reference each other; scripts. |
| [tailwind-config-reference.md](./tailwind-config-reference.md) | Tailwind and PostCSS: web vs mobile, shared preset (ESM vs CJS), content paths, and how they work with Vite and Metro. |
| [color-system.md](./color-system.md) | Color tokens, use cases, migration mapping; no opacity modifiers; mobile-safe. |
| [platformVariants/README.md](./platformVariants/README.md) | Package-level adaptations: web dependencies that need a different package or implementation on React Native (by package.json). |
| [mobile-parity/DISPARITY_AUDIT_REMEDIATION.md](./mobile-parity/DISPARITY_AUDIT_REMEDIATION.md) | Decisions from the Mobile vs Web Disparity Audit: location, Settings vs Profile, i18n, ClientHub, dashboard, validation. |
| [mobile-parity/mobile-parity-backlog.md](./mobile-parity/mobile-parity-backlog.md) | Backlog of remaining mobile parity gaps (onboarding, profile, search, etc.). |

## Related in repo

- **Agent quickstart (Cursor / automation):** `AGENTS.md` at the repository root.
- **Architecture and layer rules:** `.cursor/rules/frontend/frontend-architecture.mdc` and `thin-app-architecture.mdc`.
- **Workspace-first UX:** [documentation/client/workspace-first-architecture.md](./workspace-first-architecture.md) — `useActiveWorkspace` vs `useIsAgent`, shells, transaction party config.
- **Platform file conventions (web-only / desktop-only):** `.cursor/rules/frontend/platform-file-extensions.mdc`.
- **Lint and checks:** [documentation/client/LINTING.md](./LINTING.md).
- **Client/packages/README.md** — Package overview and import rules.
