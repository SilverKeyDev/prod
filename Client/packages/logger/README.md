# Client logger package

Shared client logging lives in this package. Product code imports only the public API from
`packages/logger`; implementation files stay organized by concern so web and native logging
behavior can evolve without changing call sites.

## Public API

```typescript
import { log, LOG_CATEGORIES } from "packages/logger";

log.info(LOG_CATEGORIES.API, "Profile loaded", { userId });
log.error(LOG_CATEGORIES.ERRORS, "Profile load failed", error);
```

`log.debug`, `log.info`, `log.warn`, `log.error`, and `log.security` all pass structured data
through the PII scrubber before console output or PostHog export. `ERRORS` and `SECURITY` stay
enabled even when development logging is otherwise quiet.

## Layout

| Path | Role |
| ---- | ---- |
| `index.ts` | Public exports for application code |
| `logger.ts` | Logger facade, config reload/update helpers, console/PostHog fan-out |
| `core/` | Categories, config types, level/category checks, message formatting, PII scrubbing |
| `config/` | Bundled JSON config plus environment and override resolution |
| `sinks/` | Optional external sinks such as PostHog web/native adapters |

## Configuration

- Bundled defaults live in `config/logger.config.json`.
- Environment resolution lives in `config/resolveLoggerConfig.ts` and `config/loggerEnv.ts`.
- Production forces categories on and can export to PostHog when configured.
- Development defaults to quiet logging except `errors` and `security`; opt in with admin
  frontend logger controls or `EXPO_PUBLIC_LOGGER_VERBOSE` / `EXPO_PUBLIC_LOGGER_CATEGORIES`.

## Adding or changing categories

Keep category behavior consistent in one change:

1. Add the constant and config mapping in `core/categories.ts`.
2. Add the config field/type/default in `core/loggerTypes.ts` and `config/resolveLoggerConfig.ts`.
3. Add the bundled default in `config/logger.config.json`.
4. If server/admin toggles should support the category, update the matching server config and
   admin allowed-key list.

## Constraints

- Do not import from `core/`, `config/`, or `sinks/` in feature code; use `packages/logger`.
- Do not log raw PII or secrets. The scrubber is a safety net, not permission to pass sensitive
  payloads.
- Do not use raw `console.*` outside the logger implementation.
