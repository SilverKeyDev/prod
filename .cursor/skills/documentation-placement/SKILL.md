---
name: documentation-placement
description: Place new SilverKey prose in documentation/ only; never create repo-root docs/. Run placement and link checks before claiming done. Use when adding or moving markdown guides, README indexes, or fixing broken doc links.
---

# Documentation placement (SilverKey)

## When to use

- Adding or moving long-form markdown.
- Fixing broken links to `docs/` or other ghost paths.
- User asks where documentation should live.

## Decision tree

| Content type | Location |
|--------------|----------|
| Onboarding | `documentation/getting-started/` |
| System design (client + server) | `documentation/architecture/` |
| As-built product features | `documentation/features/` |
| Task how-tos | `documentation/guides/` |
| Config / API / lint reference | `documentation/reference/` |
| Ops + QA runbooks | `documentation/runbooks/` |
| Compliance + security | `documentation/policies/` |
| Eng process / inventories | `documentation/internal/` |
| Short package orientation | `Client/packages/<pkg>/README.md` (~40 lines) |
| Server module notes | `Server/app/**/README.md` |
| DocuSign API detail | `Server/app/services/docusign/docs/` (colocated exception) |
| Engineer quickstart | `AGENTS.md` (index only) |

**Never:** repo-root `docs/`, `Client/documentation/`, roadmap/Planned design trees, long guides in random feature folders.

## Required steps for new long-form docs

1. Create file under the correct hub in `documentation/`.
2. Add a row to that hub’s `README.md`.
3. Update `documentation/README.md` if the topic is onboarding-critical.
4. Fix inbound links from entrypoints (`AGENTS.md`, `README.md`) if needed.
5. Run from repo root:

```bash
chmod +x scripts/ci/check-doc-placement.sh scripts/ci/check-doc-links.sh
./scripts/ci/check-doc-placement.sh
./scripts/ci/check-doc-links.sh
```

6. For cross-cutting architecture changes, also follow **post-major-change-sync**.

## Broken `docs/` links

Retarget to `documentation/runbooks/postgres.md` and `documentation/runbooks/redis-celery.md`. **Do not create `docs/`.**

## Brevity

Lead with 3–5 sentences and a link table. Put depth in child docs. Do not duplicate constraint tables already in `.cursor/rules/*.mdc`.
