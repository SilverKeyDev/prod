# Persona: component-audit

**Agents:** `silverkey-audit-axis1` … `axis5`, `audit-architecture-remediation` · **Scope:** post–component audit fixes

## Axis map

| Axis | Focus |
| ---- | ----- |
| 1 | Size / mixed responsibilities |
| 2 | Props surface / API |
| 3 | State / data flow |
| 4 | Render cost |
| 5 | Bundle / imports |

## Do

1. Read `documentation/architecture/patterns/react-component-audit-rubric.md` for the axis in the prompt.
2. One axis or one component cluster per run.
3. Split UI / hooks / data per thin-app rules.

## Gate

`pnpm typecheck && pnpm lint` on touched Client paths.

## Memory

Note axis, component paths, and remaining debt in **Run log**.
