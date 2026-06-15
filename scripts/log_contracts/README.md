# Log contracts codegen

SilverKey log categories and config keys are generated from a single YAML source of truth.

## Workflow

1. Edit [`categories.yaml`](./categories.yaml).
2. Regenerate artifacts:

```bash
make log-contracts
```

3. Verify no drift before opening a PR:

```bash
make log-contracts-verify
```

## Generated outputs

| Artifact | Purpose |
| -------- | ------- |
| `Client/packages/logger/core/categories.generated.ts` | `LogCategory`, `LogPath`, `LOG_CATEGORIES`, mapping helpers |
| `Client/packages/logger/config/loggerContract.generated.ts` | `LOGGER_BOOLEAN_KEYS`, environment defaults |
| `Client/packages/logger/config/adminLoggerKeys.generated.ts` | Admin UI toggle key lists |
| `Server/logger/core/categories_generated.py` | `LogCategory` enum + helpers |
| `Server/logger/config/logger_contract_generated.py` | Server `LOGGER_BOOLEAN_KEYS` + defaults |
| `Server/logger/config/config_model.py` | `LoggerConfig` fields |
| `Server/logger/config/allowed_logger_config_keys_generated.py` | Admin API allowed keys |
| `Client/packages/logger/config/adminLoggerUiMeta.generated.ts` | Admin Logging UI groups and log-path labels |
| `openapi/components/schemas/shared/logger/*.yaml` | OpenAPI logger config + patch schemas for admin API |

Deployment overrides persist in `deployment_logger_config` (admin UI + server startup). Admin **client** toggles apply only to the admin’s open browser tab (personal debugging); **server** toggles apply to the API process. Codegen defaults replace removed JSON config files.

Hand-written merge logic stays in `resolveLoggerConfig.ts` and `resolve_logger_config.py`.

## Dot-notation logging

New code may use hierarchical paths:

```ts
log.info("API.POLLING", "message", data);
```

Legacy enum call sites remain valid:

```ts
log.info(LOG_CATEGORIES.API, "message", data, API_SUBCATEGORIES.POLLING);
```

On the server, dot paths affect OTLP/export labels; gating still uses the top-level category (`api` boolean on server).

```bash
make log-contracts-migrate
make log-contracts-migrate-check   # audit: exit 1 if LOG_CATEGORIES remains in log calls
```

Transforms `LOG_CATEGORIES.API` + `API_SUBCATEGORIES.POLLING` → `"API.POLLING"`, and bare categories → `"AUTH"`, etc. Review the diff before committing; dynamic API subcategory args become `` `API.${var}` ``.

Client ESLint enforces the result via `silverkey/prefer-log-path` (error).

## Lint (CI + local)

```bash
make log-contracts-lint
# or: python3 scripts/log_contracts/lint_log_paths.py
```

Checks:

1. No `LOG_CATEGORIES` / `API_SUBCATEGORIES` in `log.*` / `logger.*` call sites (same rules as `make log-contracts-migrate-check`).
2. Static dot-notation `LogPath` string literals must match `LOG_PATHS` from codegen (`categories.yaml` → `make log-contracts`).

Client ESLint also enforces (2) for TypeScript via `silverkey/valid-log-path` during `pnpm lint`.

Wired into `./scripts/ci/run-all-linters.sh` (all scopes) and `Server/scripts/lint/lint_log_contracts.py`.

## Server product logging (no legacy stack)

- Product logs: `from logger import log` then `log.info("SEARCH", "message", {"key": value})`.
- Legacy `app.utils.security.app_logging` and stdlib `logging.getLogger` in `Server/app/` are **removed** — CI enforces via `Server/scripts/lint/lint_no_stdlib_logging.py` and `scripts/ci/check-no-app-logging.sh`.
- Flask/third-party stdlib tuning lives in `Server/logger/bootstrap/` only (`configure_flask_stdlib_logging`, `get_infrastructure_logger` for library hooks).

## Future ESLint migration

To auto-fix legacy enums to dot notation later:

1. Extend `silverkey/no-console-logger` (or add `silverkey/prefer-log-path`) with an optional fixer.
2. Transform `LOG_CATEGORIES.API` + 4th-arg subcategory → `"API.<SUB>"`.
3. Transform standalone `LOG_CATEGORIES.AUTH` → `"AUTH"`.
4. Run as a codemod behind a lint `--fix` flag; keep generated `LogPath` as the allowlist.

Do not enable the fixer until call sites are reviewed — some legacy API logs rely on the separate subcategory argument.
