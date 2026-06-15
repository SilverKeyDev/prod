> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/models/transactions/transaction_address.py`, `Server/app/routes/transactions.py`, `Client/packages/features/checklists/components/integrations/findingHome/`, `Client/packages/ui/components/form/AddressInput/`, `Client/packages/features/profile/components/sections/LocationSection.tsx`

## Location enrichment

Canonical address capture ships; downstream enrichment service does not.

### Shipped: address capture

| Piece | Detail |
| ----- | ------ |
| **Model** | `TransactionAddress` — one saved address per **user** (not per deal) |
| **API** | `GET/POST /api/v1/transactions/address` |
| **UX** | Offer checklist **Decide on a home** (`FindingHome.tsx`); Google Places via `GooglePlacesAutocompleteField` |
| **Fields** | `address`, `street`, `city`, `state`, `postal_code`, `country`, `place_id` |
| **Completion** | Checklist auto-complete when address saved (`checklistIntegrationCompleteness`, `useAutoCompleteChecklistIntegrations`) |

Profile search locations (commute areas) are separate: `user_important_locations` via profile/onboarding — not transaction enrichment.

### Shipped: light downstream use

| Consumer | Uses address? |
| -------- | ------------- |
| Checklist `finding_home` step | Yes — saved address |
| Partner placement redirect URL interpolation | Optional — when partner template includes transaction/address placeholders |
| Series metadata (`get_series_metadata`) | **No** — `state`/`county`/`deadline` placeholders return null |
| Jurisdiction checklist filtering | **No** |
| Deadline rules engine | **No** |

### Planned: enrichment layer

Given `place_id` + structured fields (+ lat/lng when added):

1. Resolve county / municipality
2. Set `jurisdiction_ruleset_key` (e.g. `us_ga`, `us_generic`)
3. Optional risk tags (flood, coastal, homestead) for checklist + deadline engines

| Gap | Target |
| --- | ------ |
| Backend service | e.g. `Server/app/services/location/enrichment.py` |
| Persistence | Fields on future `PropertyAddress` / `Transaction`, or cache table |
| Lifecycle | Sync on address save vs async job; fallback ruleset on failure |
| Multi-transaction | Address per deal, not single user row |

### Reuse (don’t duplicate)

> **Shipped feature docs:** [search.md](../../client/features/search.md).

- Places autocomplete: `FindingHome`, calendar event location patterns, profile location inputs
- Address normalization server-side: `Server/app/utils/address_format.py`
