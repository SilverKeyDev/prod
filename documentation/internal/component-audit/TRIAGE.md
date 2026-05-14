# Component audit triage (max-lines queue)

Generated from a **line-count scan** of `Client/packages/**` and `Client/apps/**` (excluding `packages/types/api.generated.ts`) plus ESLint `silverkey/max-lines-hard` bands (`warnAt` 501, `max` 651). Update this file when audits add explicit P0/P1 rows.

| Priority | Criterion | File | Approx LOC (at generation) | Remediation agent |
|----------|-----------|------|---------------------------|-------------------|
| P0 | `> 650` (ESLint error band) | _(none in scan — `api.generated.ts` excluded by policy / override)_ | — | — |
| P1 | `501–650` (warn band) | _(none in current queue — prior Playwright `e2e/fixtures/stubApi` removed with E2E suite)_ | — | — |

## Next candidates (approaching warn band)

| File | Approx LOC | Note |
|------|------------|------|
| `Client/packages/features/messaging/hooks/data/useAgentChats.ts` | ~380 | Below 501; `lint:cycles` messaging cycles **resolved** (constants/types split to `useAgentChats.constants.ts` / `useAgentChats.types.ts`). |
| `Client/packages/features/messaging/hooks/data/messaging/send/useMessaging.sendHelpers.ts` | ~413 | Below 501; safe to refactor further if needed. |
