# Cursor Automations — memory seeds

**Live automations** are configured in Cursor (**Agents → Automations** or [cursor.com/automations](https://cursor.com/automations)). They are **not** stored in git. Memory-tool files live on Cursor’s servers per automation.

This folder holds **optimized paste seeds**: copy into **Tools → Memories → Manage** (Memory Notes) so each automation starts with the right constraints.

## How to sync

1. Open the automation in Cursor → **Save** it.
2. **Tools** → enable **Memories** → **Manage**.
3. Create or select a memory file (name it like the seed file below, e.g. `engineer-default`).
4. Paste **`_core.md`** at the top, then the persona file (or use a single combined paste).
5. **Save**. After each run, append a short **Run log** block (template in `_core.md`).

## Suggested mapping

Match your automation’s purpose to a seed. Rename the Memory Notes file to match the **Memory file** column.

| Memory file (in Cursor) | Seed in repo | When to use |
| ----------------------- | ------------ | ----------- |
| `core` | `_core.md` | Prepend to **every** automation |
| `engineer-default` | `engineer-default.md` | General implementation, features, bugs |
| `react-lint` | `react-lint.md` | Client ESLint / hooks / UI rules |
| `lint-structure` | `lint-structure.md` | Repo-wide lint/format without behavior changes |
| `ci-pr-babysit` | `ci-pr-babysit.md` | PR green + comments + merge conflicts |
| `architecture-boundary` | `architecture-boundary.md` | Import graph, layers, cycles |
| `audit-architecture` | `audit-architecture.md` | Thin-app / barrel / context smells |
| `component-audit` | `component-audit.md` | Post–five-axis audit remediation |
| `security-scan` | `security-scan.md` | Secrets, unsafe patterns |
| `openapi-contract` | `openapi-contract.md` | OpenAPI + generated types |
| `partner-respa` | `partner-respa.md` | Rev-share, placement, partners admin |
| `dead-code` | `dead-code.md` | Unused files/exports sweep |
| `bundle-optimizer` | `bundle-optimizer.md` | Web bundle / imports |
| `perf-regression` | `perf-regression.md` | Render cost, loops |
| `error-surfaces` | `error-surfaces.md` | Missing fallbacks, fragile UX |
| `test-coverage` | `test-coverage.md` | High-value test gaps |
| `refactor-suggest` | `refactor-suggest.md` | Oversized modules (read-only plan) |
| `doc-readability` | `doc-readability.md` | Docs/naming pass |
| `file-reorganizer` | `file-reorganizer.md` | Folder splits + import updates |

Repo personas: `.cursor/agents/<name>.md` (longer form than these seeds).

## Audit your automations

In Cursor, list each automation and note:

- **Trigger** (schedule, webhook, manual)
- **Repo attached** (SilverKey vs none)
- **Tools enabled** (Memories must be on)
- **Memory file** linked (row in table above)

Update this README if you add a new automation class.
