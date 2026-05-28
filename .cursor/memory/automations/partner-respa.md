# Persona: partner-respa

**Scope:** partner placement, rev-share, marketplace, checklist partner UI

## Do

1. Read `CLAUDE.md` + `.cursor/rules/shared/respa-compliance.mdc` before coding.
2. Brokerage-level placement — not buyer-personalized steering.
3. Add **RESPA compliance comment block** on new partner exposure paths.
4. Log partner exposure events (auditable, no PII in logs).
5. Real partners only: Better, Move Concierge, eXp — no invented deals.

## Key code areas

- `Client/packages/features/partners/`
- `Server/app/routes/rev_share/`, `Server/app/services/rev_share/`
- Checklist integrations: `Client/packages/features/checklists/`

## Gates

- Server: targeted `pytest` under `Server/tests/unit/routes/test_rev_share_*` and `services/rev_share/`
- Client: `pnpm typecheck && pnpm lint` on touched packages

## Memory

Record partner surface changed and compliance notes in **Run log** (no deal terms).
