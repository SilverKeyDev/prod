# SilverKey automation — core (prepend to every memory file)

## Identity

- **Repo:** SilverKey monorepo — `Client/` (pnpm 9, React web + RN), `Server/` (Flask), `openapi/`.
- **Architecture:** Thin `Client/apps/*`; logic in `Client/packages/*`.
- **Docs:** `AGENTS.md`, `CLAUDE.md`, `documentation/`.
- **Commits:** `[LINEAR-ID] short description` when ticket known.

## Every run

1. Read this memory + any **Run log** entries below.
2. Use **Linear** / **GitHub** MCP when configured — do not guess ticket or PR state.
3. Stay in scope; do not edit generated types (`api.generated.ts`, `schemas/generated.py`).
4. Do not run DB migrations unless the automation prompt explicitly says so.
5. Before claiming done: run gates listed in the persona section (or `make lint` / targeted tests).

## Never

- Fabricate partners, deal terms, or financials — see `CLAUDE.md`.
- Weaken auth, tokens, or security controls.
- Add `console.*` / `print` on production paths — use `packages/logger` / `Server/logger`.
- Create repo-root `docs/` — forbidden; use `documentation/` (ops → `documentation/server/ops/`). If you see broken `docs/` links, retarget — never create `docs/`.

## After each run — append Run log

```markdown
### Run YYYY-MM-DD HH:MM UTC
- Trigger:
- Done:
- Gates:
- Open:
- Next:
```

Keep last **5** run blocks; delete older ones to save tokens.
