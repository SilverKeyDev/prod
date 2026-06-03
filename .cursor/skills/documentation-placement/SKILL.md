---
name: documentation-placement
description: Place new SilverKey prose in documentation/ only; never create repo-root docs/. Run placement and link checks before claiming done. Use when adding or moving markdown guides, README indexes, or fixing broken doc links.
---

# Documentation placement (SilverKey)

## When to use

- Adding or moving long-form markdown.
- Fixing broken links to `docs/`, `OPENAPI_MIGRATION.md`, or other ghost paths.
- User asks where documentation should live.

## Decision tree

| Content type | Location |
|--------------|----------|
| Client architecture, standards, features, QA | `documentation/client/<area>/` |
| Server API, Flask, ops (Postgres, Redis, Celery) | `documentation/server/` or `documentation/server/ops/` |
| Cross-cutting product (transactions, compliance) | `documentation/<topic>/` |
| Short package orientation | `Client/packages/<pkg>/README.md` (~40 lines, link to canonical doc) |
| Server module notes | `Server/app/**/README.md` |
| DocuSign API detail | `Server/app/services/docusign/docs/` (colocated exception) |
| Engineer quickstart | `AGENTS.md` (index only) |
| Company context | `CLAUDE.md` |

**Never:** repo-root `docs/`, `Client/documentation/`, long guides in random feature folders.

## Required steps for new long-form docs

1. Create file under `documentation/client/` or `documentation/server/`.
2. Add a row to that folder's `README.md`.
3. Add or update parent index (`documentation/client/README.md` or `documentation/server/README.md`) if needed.
4. Fix inbound links from entrypoints (`AGENTS.md`, `README.md`) if the topic is onboarding-critical.
5. Run from repo root:

```bash
chmod +x scripts/ci/check-doc-placement.sh scripts/ci/check-doc-links.sh
./scripts/ci/check-doc-placement.sh
./scripts/ci/check-doc-links.sh
```

6. For cross-cutting architecture changes, also follow **post-major-change-sync** skill.

## Broken `docs/` links

If you find links to `docs/postgres`, `docs/redis`, or `docs/README.md`:

- Retarget to `documentation/server/ops/postgres.md` and `documentation/server/ops/redis-celery.md`.
- **Do not create `docs/`** to fix the link.

## Brevity

Lead with 3–5 sentences and a link table. Put depth in child docs. Do not duplicate constraint tables already in `.cursor/rules/*.mdc`.
