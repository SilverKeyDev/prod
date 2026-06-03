# Cursor rules index

Rules live as `.mdc` files with YAML frontmatter. Cursor injects them based on **`alwaysApply`** or **`globs`** (path patterns).

**Parent doc:** [.cursor/README.md](../README.md) — skills, agents, MCP, how to add rules.  
**Company context:** [CLAUDE.md](../../CLAUDE.md). **Engineering:** [AGENTS.md](../../AGENTS.md).

---

## Always-on (every conversation)

These seven rules apply in **all** sessions:

| Rule | Purpose |
| ---- | ------- |
| [shared/security.mdc](shared/security.mdc) | Auth, tokens, PII, uploads, CORS |
| [shared/thin-app-architecture.mdc](shared/thin-app-architecture.mdc) | Thin `apps/`, fat `packages/` |
| [shared/linting.mdc](shared/linting.mdc) | Blocking linters, UI primitives |
| [shared/documentation.mdc](shared/documentation.mdc) | `documentation/` vs `docs/`, where to put prose |
| [shared/silverkey-context.mdc](shared/silverkey-context.mdc) | Company, RESPA reflex, partners, MCP, voice |
| [shared/code-style.mdc](shared/code-style.mdc) | Stack, Linear commits, PRs, verification |
| [shared/env-vars-minimal.mdc](shared/env-vars-minimal.mdc) | Do not add `.env` keys unless a new integration requires it |

Keep always-on bodies short; deep detail belongs in `documentation/`.

---

## Shared (scoped)

| Rule | Activates when |
| ---- | -------------- |
| [shared/respa-compliance.mdc](shared/respa-compliance.mdc) | Partner, placement, marketplace, lender/title/insurance, concierge, checklist integrations, transaction financing/insurance/closing paths |
| [shared/pitch-and-fundraising.mdc](shared/pitch-and-fundraising.mdc) | `pitch/`, `deck/`, `investor/`, `fundraising/`, `*pitch*.md`, `*investor*.md` |
| [shared/ci-gates.mdc](shared/ci-gates.mdc) | `.github/workflows/**`, `Client/**` |
| [shared/openapi-workflow.mdc](shared/openapi-workflow.mdc) | `openapi/**`, generated types |
| [shared/openapi-types.mdc](shared/openapi-types.mdc) | OpenAPI type usage |
| [shared/openapi-schema-organization.mdc](shared/openapi-schema-organization.mdc) | OpenAPI schema layout |
| [shared/openapi-editing-patterns.mdc](shared/openapi-editing-patterns.mdc) | Editing OpenAPI sources |
| [shared/monorepo.mdc](shared/monorepo.mdc) | Repo-wide tooling |
| [shared/logging.mdc](shared/logging.mdc) | `Client/**`, `Server/**` |
| [shared/api-instrumentation.mdc](shared/api-instrumentation.mdc) | `Server/app/http/**`, `Server/app/routes/**`, endpoint scripts |
| [shared/cross-platform-component-reuse.mdc](shared/cross-platform-component-reuse.mdc) | Client TS/TSX |
| [shared/code-organization.mdc](shared/code-organization.mdc) | File/folder structure |
| [shared/package-feature-structure.mdc](shared/package-feature-structure.mdc) | Feature package layout |
| [shared/folder-decomposition.mdc](shared/folder-decomposition.mdc) | Splitting large folders |
| [shared/post-major-change-sync.mdc](shared/post-major-change-sync.mdc) | Apps, packages, openapi, `Server/app` after major changes |
| [shared/testing-tiers.mdc](shared/testing-tiers.mdc) | Test strategy |
| [shared/user-preferences-schema.mdc](shared/user-preferences-schema.mdc) | User preferences contract |
| [shared/user-type-agent-experience.mdc](shared/user-type-agent-experience.mdc) | Agent UX by user type |
| [shared/aws-resource-naming.mdc](shared/aws-resource-naming.mdc) | AWS naming/tags |
| [shared/cursor-optimization.mdc](shared/cursor-optimization.mdc) | @web, MCP tips |
| [shared/agent-memory.mdc](shared/agent-memory.mdc) | `.cursor/memory/` read/update; pairs with [cursor-agent-memory.md](../../documentation/client/tooling/cursor-agent-memory.md) |

---

## Frontend (scoped → `Client/**`)

| Rule | Focus |
| ---- | ----- |
| [frontend/frontend-architecture.mdc](frontend/frontend-architecture.mdc) | Layers, imports, hooks vs components |
| [frontend/ui-components.mdc](frontend/ui-components.mdc) | `packages/ui` primitives |
| [frontend/react-hooks.mdc](frontend/react-hooks.mdc) | Hooks patterns |
| [frontend/state-boundaries.mdc](frontend/state-boundaries.mdc) | State placement |
| [frontend/platform-file-extensions.mdc](frontend/platform-file-extensions.mdc) | `.web.tsx` vs `.tsx` |
| [frontend/responsive-ui.mdc](frontend/responsive-ui.mdc) | Responsive standards |
| [frontend/async-cancellation.mdc](frontend/async-cancellation.mdc) | Abort/cleanup |
| [frontend/assets-and-icons.mdc](frontend/assets-and-icons.mdc) | Assets |
| [frontend/component-audit-rubric.mdc](frontend/component-audit-rubric.mdc) | Five-axis component audits |

---

## Backend (scoped → `Server/**`)

| Rule | Focus |
| ---- | ----- |
| [backend/backend-architecture.mdc](backend/backend-architecture.mdc) | Flask app structure |
| [backend/backend-patterns.mdc](backend/backend-patterns.mdc) | Service patterns |
| [backend/database.mdc](backend/database.mdc) | DB / migrations policy |
| [backend/sqlalchemy-patterns.mdc](backend/sqlalchemy-patterns.mdc) | SQLAlchemy usage |

---

## Adding a rule

1. One concern per file under `shared/`, `frontend/`, or `backend/`.
2. Prefer **`alwaysApply: false`** + **`globs`** unless replacing one of the seven always-on rules (see [.cursor/README.md](../README.md)).
3. Include at least one good/bad example; link to `documentation/` for long prose.
4. Update [documentation/internal/cursor-audit-latest.md](../../documentation/internal/cursor-audit-latest.md) when the inventory changes.
