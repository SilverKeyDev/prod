# Legacy removal tracker

Living index for backward-compat code called out in the legacy migration plan. Re-audit with:

```bash
rg -i 'legacy' --glob '*.{ts,tsx,py,yaml,md}' \
  --glob '!**/api.generated.ts' --glob '!**/generated.py' --glob '!pnpm-lock.yaml'
```

## Status legend

| Status | Meaning |
| ------ | ------- |
| `done` | Removed or migrated in this pass |
| `keep` | Intentional compat (documented gate) |
| `migrate` | Scheduled; gate/metric in place |
| `remove` | Pending product/ops sign-off |

## Wave 1 — Dead code (`done`)

| Item | Location | Status |
| ---- | -------- | ------ |
| `legacyApiRequest` | ~~`Client/packages/services/http/compatibility/legacy.ts`~~ | done |
| `legacyAuth.ts` | ~~`Client/packages/utils/auth/legacyAuth.ts`~~ | done |
| Auth token stub duplicates | Consolidated to `Client/packages/services/http/authToken.ts` | done |
| Checklist column fallback | `Server/app/routes/auth/handlers/user_checklists.py` | done |

## Wave 2 — Telemetry gates (`done`)

| Item | Gate | Status |
| ---- | ---- | ------ |
| `clearLegacyAuthStorage` | ~~`legacy_auth_storage_cleared`~~ — cookie-only logout | done |
| Flat polygon transform | Removed; was `legacy_flat_polygon_property_transform` | done |
| Log enum categories | ~~`legacy_log_category_usage`~~ — dot-notation paths + codemod | done |
| OpenAPI body coercion | ~~`legacy_openapi_request_body_coercion`~~ — pass-through dict only | done |

## Wave 3 — URLs and storage (`done`)

| Item | Location | Status |
| ---- | -------- | ------ |
| `/buyer/*`, `/brokerage/*`, `/saved/*` redirects | ~~`DynamicRoutes.tsx`, `LegacyWorkspaceShellPrefixRedirect.tsx`~~ | done |
| Agent UUID-first URLs | `Client/packages/utils/agent/slug.ts` | done |
| Product tour aggregate key | Per-step only; v1/v2 aggregate read path removed | done |
| `devPreviewAllWorkspaces` | Removed; use `/admin/dev-persona` | done |

## Wave 4 — OpenAPI contract (`done` / partial)

| Item | Change | Status |
| ---- | ------ | ------ |
| `PropertyData.yaml` | Deleted (unreferenced) | done |
| `DeleteReportRequest.file_path` | Removed; server uses `s3_key` only | done |
| `ReportDocumentsListResponse.reports` alias | Removed | done |
| `Agreement.envelope_id` | Removed from spec + DTO | done |
| `AgreementRevision.revision_number` | Removed from spec + DTO | done |
| `IsochroneResponse` legacy fields | Removed `isochrone_data`, `locations` | done |
| `DeleteUserRequest.confirmation` | Removed | done |
| Viewings copy | Renamed “legacy behavior” → supported open-tour wording | done |
| User/PublicAgentProfile/ErrorResponse | Descriptions updated (fields retained where still on wire) | done |

## Tier D — API/runtime compat (`migrate` until gate clears)

Each row needs a **gate** before deleting compat code. Full migration steps: Tier D plan in internal docs (legacy migration plan).

| Item | Location | Gate | Status |
| ---- | -------- | ---- | ------ |
| `legacyDefaultSortDirection` / filters persist | `filters.slice.migrate.ts`, `searchDisplay.ts` | `filters-store` persist ≥ v7; no migrate from `<7` in support | migrate (v7 shipped) |
| `normalizeProsConsItems` string payloads | `Client/packages/utils/search/normalize/normalizeProsConsItems.ts` | Zero `legacy_pro_con_string_payload` log hits (30d prod) | migrate (`SEARCH` debug log added) |
| `propertyMatchScore` 0–100 ≥ 99.5 | `propertyMatchScore.ts` | Zero `legacy_property_match_score_scale` log hits | migrate (`SEARCH` debug log added) |
| `listing_type_match` unknown pref substring | `Server/app/services/search/helpers/listing_type_match.py` | Unknown prefs catalog empty; `legacy_listing_type_unknown_pref` only in audit | migrate (substring removed; info log) |
| `profileFormSync` mirrored `preferred_bedrooms` | `profileFormSync.ts`, `preferences_aggregation.py` | Clients + OpenAPI use min/max only; no `preferred_bedrooms` on wire | migrate (bedrooms mirror removed from aggregation) |
| `pagination` `legacy_limit_default=100` | `pagination.py`, `user_favorites.py` | Zero `legacy_favorite_homes_pagination_default` log hits | migrate (client sends `page`/`per_page`; server info log) |
| `docusign_template_id` client fallback | `DocuSignWidgetSavedTemplatesSection.tsx` | No client refs to `docusign_template_id` | done |
| `AuthSessionUser` `auth_method: unknown` | `responses.py`, OpenAPI | Zero new `auth_method_unknown_session` in prod | migrate (info log on unknown) |
| `preferences_version` NULL | `preferences_aggregation_write.py`, `users` table | Server persists version on write; NULL count 0 after backfill | migrate (read/write wired; run SQL backfill) |
| `/api/v1/tasks` vs transaction tasks | `checklists.ts`, Close subheaders | PostHog ~0 on `GET\|PUT /api/v1/tasks` | migrate (CloseLayout resolves `transactionId`; legacy API deprecated) |

**Operator backfill (`preferences_version`):** see [user-preferences.md](../server/user-preferences.md#preferences_version-backfill).

## Wave 5 — Ongoing (`keep` / `remove`)

| Item | Notes | Status |
| ---- | ----- | ------ |
| SQLAlchemy `Mapped[]` migration | `documentation/server/sqlalchemy-mapped-migration.md` | keep |
| Legacy EC2 deploy scripts | Confirm superseded by `.github/scripts/ec2-deploy.sh` | remove |
| `/api/v1/tasks` → transaction-scoped | Tier D table above; route kept until PostHog gate | migrate |
| ESLint `no-legacy-viewport-units` | Prevention rule | keep |
| `documentation/dev/cursor-legacy/` | Read-only archive | keep |
| Zustand filters persist migrations | Tier D; persist **v7** shipped — remove `legacyDefaultSortDirection` from migrate after gate | migrate |
| `stripWorkspaceShellPrefix` | Still used for path normalization (not redirects) | keep |
| `ShellCanonicalPathRedirect` | ~~`Client/apps/web/app/routes/ShellCanonicalPathRedirect.tsx`~~ — in-shell `/buyer/*` / `/brokerage/*` normalize; removed (prefixed bookmarks already 404 at router) | done |
| Client hub UUID-only URLs | ~~`resolveClientIdFromLegacyHubSegment` in `clientHubSlug.ts`~~ | done |

**PostHog gate (client hub, before removal):** Insight on `$pageview` where `$pathname` matches  
`^/dashboard/client/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`  
(single-segment full UUID). Sign-off: zero or negligible weekly hits. All in-app links already use `buildClientHubPath` (two segments).

## Audit command

Run before closing follow-up PRs:

```bash
make openapi-verify
cd Client && pnpm typecheck && pnpm test:run
cd Server && TESTING=true pytest tests/unit/logger/test_parse_log_path.py tests/unit/routes/ -q --no-cov
python Server/scripts/validate-schema-coverage.py
```
