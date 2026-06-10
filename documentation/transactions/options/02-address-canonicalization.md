> **Status:** Partial — Places autocomplete + `place_id` storage; strict server gate and lat/lng not complete.  
> **Last verified:** 2026-05-28

## Problem

Collect a property address when starting checklist-driven work: canonical geo data for jurisdiction, risk, and timeline rules; handle provider outages and edge addresses.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| v1 default | **Option A** — require a provider-backed selection (`place_id`, structured fields); design fallbacks for pin/map when Places fails. |
| Lenient free-text + background geocode (**Option B**) | Rejected for v1 — weak jurisdiction data. |
| External brokerage record as primary source (**Option C**) | Future cross-check only, not primary capture. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| API | GET/POST `/api/v1/transactions/address` per authenticated user. | `Server/app/routes/transactions.py`, `Server/app/models/transactions/transaction_address.py` |
| Storage | `TransactionAddress`: `address`, structured fields, `place_id` (no `lat`/`lng` columns). | `transaction_address.py` |
| Client — Finding home step | Google Places autocomplete; prefers `selectedAddress` payload with `place_id`; **can** POST `{ address: trimmed }` without selection. | `Client/packages/features/checklists/components/integrations/findingHome/FindingHome.tsx`, `findingHomeAddressChanges.ts` |
| Shared autocomplete | Reused in calendar create flow. | `Client/packages/features/calendar/components/view/CreateEventModal.tsx`, `packages/ui/components/form/AddressInput/` |
| Maps loader | `useGoogleMapsStore` / Places scripts. | `packages/store`, checklist `FindingHome` |

## Gaps

- Server does not require `place_id` on POST.
- No lat/lng persistence on `TransactionAddress`; no jurisdiction enrichment service.
- Address not linked to `transactions.id` (still per `user_id`).

## Rejected / deferred

> **Shipped feature docs:** [search.md](../../client/features/search.md).

- **Option B** — may return as explicit fallback flow, not default.
- **Option C** — Dotloop/Skyslope address sync is out of scope until brokerage integrations land (`Transaction.skyslope_file_id` is a hook only).
