# Client documentation

Docs for the SilverKey frontend: TypeScript/React (web) and React Native (mobile), monorepo structure, and lint/architecture.

## Folders

| Folder | What it covers |
|--------|----------------|
| [architecture/](./architecture/) | Thin apps, layers, workspaces, shared packages, TypeScript layout |
| [platform/](./platform/) | Web vs React Native, mobile structure, parity, platformVariants |
| [standards/](./standards/) | Lint, accessibility, responsive UI, color tokens |
| [tooling/](./tooling/) | tsconfig, Tailwind, config files, env gates, Cursor agent memory |
| [patterns/](./patterns/) | React hooks, component audit rubric |
| [features/](./features/) | Product integrations (DocuSign, Maps, rev-share, onboarding) |
| [qa/](./qa/) | E2E QA runbooks and release checklists — **start with [qa/END_TO_END_QA_RUNBOOK.md](./qa/END_TO_END_QA_RUNBOOK.md)** |

## Quick links

| Doc | Description |
|-----|-------------|
| [standards/LINTING.md](./standards/LINTING.md) | How to run lint and platform checks locally; ESLint and SilverKey rules. |
| [architecture/thin-app-architecture.md](./architecture/thin-app-architecture.md) | Thin App (Fat Packages): apps as composition layer only. |
| [architecture/layered-architecture-imports.md](./architecture/layered-architecture-imports.md) | Import matrix: config vs hooks vs services vs `packages/features`. |
| [architecture/cross-feature-composition.md](./architecture/cross-feature-composition.md) | Cross-feature import tiers, orchestrator hubs, audit visibility. |
| [architecture/workspace-first-architecture.md](./architecture/workspace-first-architecture.md) | Workspace vs server identity, shells, transaction party config. |
| [architecture/messaging-persona-variations.md](./architecture/messaging-persona-variations.md) | Two-stack messaging (agent–client vs workspace) and persona registry. |
| [standards/accessibility-standards.md](./standards/accessibility-standards.md) | WCAG 2.1 Level AA targets; pair with `.cursor/rules/frontend/accessibility.mdc`. |
| [standards/responsive-ui-standards.md](./standards/responsive-ui-standards.md) | Breakpoints, web/RN responsive rules; pair with `.cursor/rules/frontend/responsive-ui.mdc`. |
| [patterns/react-component-audit-rubric.md](./patterns/react-component-audit-rubric.md) | Five-axis component audit (size, props, state, render cost, bundle). |
| [search-area-resolution.md](./search-area-resolution.md) | Search never fails: location priority, geolocation fallback, filter semantics, QA. |
| [architecture/shared-packages.md](./architecture/shared-packages.md) | Exhaustive reference for all shared packages under `Client/packages/`. |
| [../internal/component-audit/feature-module-folder-and-layering-audit.md](../internal/component-audit/feature-module-folder-and-layering-audit.md) | Which feature folders need `api/` / `store/` roots |
| [../internal/component-audit/frontend-reorganization-audit.md](../internal/component-audit/frontend-reorganization-audit.md) | Frontend reorg wave checklist (code work tracking) |
| [server/openapi-workflow.md](../server/openapi-workflow.md) | OpenAPI edit → regenerate workflow |
| [../internal/post-major-change-checklist.md](../internal/post-major-change-checklist.md) | After major features: update docs, `.cursor/rules`, skills, audit inventory. |

## Related in repo

- **Agent quickstart (Cursor / automation):** `AGENTS.md` at the repository root.
- **Architecture and layer rules:** `.cursor/rules/frontend/frontend-architecture.mdc` and `thin-app-architecture.mdc`.
- **Client/packages/README.md** — Package overview and import rules.
