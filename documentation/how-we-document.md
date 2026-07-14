# How we document

One canonical wiki under `documentation/`. No roadmap trees, no duplicate long-form guides elsewhere.

## Principles

1. **As-built only** — Document what ships in the repo. Planned work lives in [Linear](https://linear.app/silverkey/team/SIL/all).
2. **Compass, not encyclopedia** — Hub `README.md` files stay short (link tables). Depth goes in child pages.
3. **Diataxis hubs** — `getting-started/`, `architecture/`, `features/`, `guides/`, `reference/`, `runbooks/`, `policies/`, `internal/`.
4. **kebab-case filenames** — e.g. `end-to-end-qa-runbook.md`.
5. **Status banners** — Optional `Shipped` or `Partial` + last verified date. Never `Planned`.

## Doc types

| Type | Where | Length |
|------|-------|--------|
| Canonical | `documentation/**` | Long-form allowed |
| Entrypoint | `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `setup.md`, `CLAUDE.md` | Short; link here |
| Colocated | `Client/packages/*/README.md`, `Server/app/**/README.md` | Short (~40 lines) |
| Cursor | `.cursor/rules/`, `.cursor/skills/` | Constraints + links; not duplicate guides |

**Repo-root `docs/` must not exist.** Creating it fails CI.

## Adding or moving docs

1. Place under the correct hub.
2. Add a row to that hub’s `README.md`.
3. Fix inbound links from entrypoints if onboarding-critical.
4. Run `make check-docs`.

## Deprecating

Remove the file and update all links. Do not leave “superseded” roadmap stubs.

## Checks

- `./scripts/ci/check-doc-placement.sh`
- `./scripts/ci/check-doc-links.sh`
- `make check-docs`
