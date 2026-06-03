# Tech context

## Versions

| Tool | Version |
| ---- | ------- |
| Node | 20+ (CI lint: 22) |
| pnpm | 9.x (`Client/package.json` `packageManager`) |
| Python | 3.10–3.13 (`Server/.venv`) |

## Common commands

```bash
make setup          # first machine
make refresh        # after git pull
make dev            # web + backend
make lint           # repo linters
make test-fe        # Client Vitest
make test-be        # Server pytest
make openapi-verify # when HTTP shapes change
```

From `Client/`: `pnpm check` (full client gate), `pnpm dev:web`, `pnpm dev:mobile`.

**Automations:** Persona-specific gates in `.cursor/memory/automations/<persona>.md`; print via `./scripts/print-automation-memory.sh <persona>`.

## Do not

- Hand-edit `Client/packages/types/api.generated.ts` or `Server/app/schemas/generated.py` — change `openapi/`, then `make openapi`.
- Run Alembic migrations unless explicitly directed.
- Use `localStorage` for tokens (memory + `sessionStorage` only).
- Use raw `console.*` / `print` — use `packages/logger` / `Server/logger`.
