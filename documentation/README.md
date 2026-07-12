# SilverKey documentation

Canonical engineering wiki. Compass indexes only — depth lives in hub pages. Planned work stays in [Linear](https://linear.app/silverkey/team/SIL/all), not in this tree.

## Hubs

| Hub | Purpose |
|-----|---------|
| [getting-started/](./getting-started/) | Onboarding: setup, agent quickstart, first PR |
| [architecture/](./architecture/) | System design (client + server) |
| [features/](./features/) | As-built product docs |
| [guides/](./guides/) | Task how-tos |
| [reference/](./reference/) | Config and contracts (Vite, tsconfig, API, lint) |
| [runbooks/](./runbooks/) | Ops and QA |
| [policies/](./policies/) | Compliance and security |
| [internal/](./internal/) | Engineering process and inventories |

## Quick links

| Topic | Location |
|-------|----------|
| How we document | [how-we-document.md](./how-we-document.md) |
| Local machine setup | [setup.md](../setup.md) (repo root) |
| Agent quickstart | [AGENTS.md](../AGENTS.md) (repo root) |
| Admin in-app Wiki | [features/admin/admin-wiki.md](./features/admin/admin-wiki.md) |
| After major changes | [internal/post-major-change-checklist.md](./internal/post-major-change-checklist.md) |

## In-app Wiki

Platform admins can browse this tree at `/admin/wiki`. Vite builds a virtual module from `documentation/**/*.md` — see [reference/vite-configuration.md](./reference/vite-configuration.md).
