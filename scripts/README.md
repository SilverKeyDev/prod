# scripts/

Implementation scripts for the SilverKey monorepo. The **Makefile** (repo root) is the single entry point for all human-facing operations — use `make help` to see available targets. The files here are implementation details, not interfaces.

For the full inventory, caller map, naming conventions, and add-a-script guide see:

> **[documentation/server/ops/scripts-guide.md](../documentation/server/ops/scripts-guide.md)**

## Subdirectory map

| Folder | Contents |
|--------|----------|
| `lib/` | Sourced shell helpers (not run directly) |
| `setup/` | First-time onboarding and refresh (`make setup`, `make refresh`) |
| `ci/` | Lint, docs, OpenAPI drift, and pre-commit hook scripts |
| `log_contracts/` | Log category YAML, Python schema, codegen, and verify |
| `run/` | Local dev-stack orchestration (`make dev`, `make dev-backend`) |
| `githooks/` | Git pre-commit and pre-push hooks |
| `deploy/` | Local prod-parity Docker Compose stack (`make prod-parity`) |
| `load/` | k6 load and smoke test scripts (manual / staging only) |
| `ops/` | Manual ops and audit helpers (not wired to CI or Makefile) |

Top-level: `print-automation-memory.sh` (Cursor automation memory seeds).
