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

Deployment overrides persist in `deployment_logger_config` (admin UI + server startup). Codegen defaults replace removed JSON config files.

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

## Future ESLint migration

To auto-fix legacy enums to dot notation later:

1. Extend `silverkey/no-console-logger` (or add `silverkey/prefer-log-path`) with an optional fixer.
2. Transform `LOG_CATEGORIES.API` + 4th-arg subcategory → `"API.<SUB>"`.
3. Transform standalone `LOG_CATEGORIES.AUTH` → `"AUTH"`.
4. Run as a codemod behind a lint `--fix` flag; keep generated `LogPath` as the allowlist.

Do not enable the fixer until call sites are reviewed — some legacy API logs rely on the separate subcategory argument.
