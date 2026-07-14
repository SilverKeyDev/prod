# Component audit artifacts (tracked)

Evidence from [React + TS component audits](../../architecture/patterns/react-component-audit-rubric.md):

| Artifact | Purpose |
| -------- | ------- |
| [feature-module-folder-and-layering-audit.md](./feature-module-folder-and-layering-audit.md) | Feature folder skeleton + rubric sampling |
| [frontend-reorganization-audit.md](./frontend-reorganization-audit.md) | Layer bleed, thin-app, cross-feature utils — **wave checklist** (human or default agent; no fleet subagents) |

Optional local `components-axis-*.md` under repo-root `audit/` (gitignored).

**Remediation:** file a Linear issue when a rubric pass finds work worth doing; use the **Remediation subagents** table in the rubric (`silverkey-audit-axis*`, `silverkey-architecture-boundary-auditor`, `silverkey-file-module-reorganizer`). Run `pnpm typecheck` and `pnpm lint` from `Client/` after code changes.

**Docs vs code reorg:** Phase 5 (2026-06-04) refreshed prose; [frontend-reorganization-audit.md](./frontend-reorganization-audit.md) wave rows track **pending code reorg** work (not tied to removed fleet agents).
