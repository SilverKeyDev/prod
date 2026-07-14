# SilverKey architecture (index)

Monorepo map and pointers to canonical docs. **Do not duplicate** long guides here — use [`documentation/`](documentation/README.md).

## Repository layout

| Path | Role |
| ---- | ---- |
| [`Client/`](Client/) | pnpm workspace: thin `apps/*`, fat `packages/*` |
| [`Server/`](Server/) | Flask API, services, models, tests |
| [`openapi/`](openapi/) | HTTP contract → generated TS/Python types |
| [`documentation/`](documentation/) | Long-form product, architecture, compliance, ops |
| [`.cursor/rules/`](.cursor/rules/) | AI coding constraints (`.mdc`) |
| [`scripts/`](scripts/) | Setup, CI, dev runners |

## Stack (summary)

| Layer | Stack |
| ----- | ----- |
| **Client** | React (Vite web), React Native (Expo), TypeScript, Zustand, TanStack Query |
| **Server** | Flask, SQLAlchemy, PostgreSQL, Celery/Redis, Cognito/OAuth |
| **Integrations** | DocuSign, Google Calendar, Plaid, MLS/search, AWS (US-East-2) |

## Principles (where to read)

| Principle | Entry |
| --------- | ----- |
| Thin apps, fat packages | [`documentation/architecture/thin-app-architecture.md`](documentation/architecture/thin-app-architecture.md), [`Client/ARCHITECTURE.md`](Client/ARCHITECTURE.md) |
| Client import layers | [`documentation/architecture/layered-architecture-imports.md`](documentation/architecture/layered-architecture-imports.md) |
| Workspace-first routing | [`documentation/architecture/workspace-first-architecture.md`](documentation/architecture/workspace-first-architecture.md) |
| Cross-platform files | [`.cursor/rules/shared/cross-platform-component-reuse.mdc`](.cursor/rules/shared/cross-platform-component-reuse.mdc) |
| Backend routes → services | [`Server/ARCHITECTURE.md`](Server/ARCHITECTURE.md), [`.cursor/rules/backend/`](.cursor/rules/backend/) |
| Security & compliance | [`documentation/policies/security.md`](documentation/policies/security.md), [`documentation/policies/`](documentation/policies/) |
| OpenAPI contract | [`.cursor/rules/shared/openapi-workflow.mdc`](.cursor/rules/shared/openapi-workflow.mdc), [`documentation/guides/openapi-workflow.md`](documentation/guides/openapi-workflow.md) |

## Client documentation

| Topic | Doc |
| ----- | --- |
| Overview | [`Client/ARCHITECTURE.md`](Client/ARCHITECTURE.md) |
| Packages & imports | [`documentation/architecture/shared-packages.md`](documentation/architecture/shared-packages.md), [`Client/packages/README.md`](Client/packages/README.md) |
| Mobile | [`documentation/architecture/platform/mobile-app-structure.md`](documentation/architecture/platform/mobile-app-structure.md) |
| Lint & UI standards | [`documentation/reference/linting.md`](documentation/reference/linting.md) |
| QA runbooks | [`documentation/runbooks/qa/`](documentation/runbooks/qa/README.md) |

## Server documentation

| Topic | Doc |
| ----- | --- |
| Overview | [`documentation/README.md`](documentation/README.md), [`Server/README.md`](Server/README.md) |
| Ops (Postgres, Redis, scripts) | [`documentation/runbooks/`](documentation/runbooks/postgres.md) |
| Deployment | [`documentation/guides/deployment.md`](documentation/guides/deployment.md) |
| Search / home matching | READMEs under `Server/app/services/search/home_matching/` |

## Product features

- Feature guides: [`documentation/features/`](documentation/features/README.md)

## Local development

- **Setup:** [`setup.md`](setup.md) (`make setup`, `make refresh`)
- **Commands & CI gates:** [`AGENTS.md`](AGENTS.md), [`README.md`](README.md)
- **How we document:** [`documentation/how-we-document.md`](documentation/how-we-document.md)

## AI assistants

- Engineering quickstart: [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md)
- Cursor map: [`.cursor/README.md`](.cursor/README.md)
- Docs + Cursor sync: [`.cursor/skills/post-major-change-sync/SKILL.md`](.cursor/skills/post-major-change-sync/SKILL.md)
- Rules inventory: [`documentation/internal/cursor-audit-latest.md`](documentation/internal/cursor-audit-latest.md)
