> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/services/transactions/*/items.py`, `Server/app/services/transactions/retrieval.py`, `Server/app/services/transactions/unified_task_checklist_*.py`, `Server/app/routes/tasks.py`, `Server/app/routes/transactions.py`, `Client/packages/features/checklists/hooks/data/useChecklistData.ts`

## Checklist generation

How templates become API responses and UI today.

### Pipeline (shipped)

```
Template dicts (*_ITEMS)
  → get_checklist_definition(category)
  → normalize_checklist_items_for_api (camelCase extras)
  → merge checkedIds from TransactionTask rows
  → signature + integration enrichment on GET/PUT
  → JSON { items, checkedIds, title?, deadline?, … }
```

Categories and order: `checklist_constants.py` — `search` → `offer` → `escrow` → `financing` → `closing` → `insurance`.

### Template sources

| Category | File |
| -------- | ---- |
| search | `search/items.py` — integrations + buyer-broker signature step |
| offer | `offer/items.py` — `finding_home`, comps, purchase agreement |
| escrow | `escrow/items.py` |
| financing | `financing/items.py` |
| closing | `closing/items.py` — Move Concierge step (`home_concierge`) |
| insurance | `insurance/items.py` |

### Progress storage (shipped, user-scoped)

- **Not** per-transaction instances — `TransactionTask` rows keyed by `user_id` + `category`
- PUT replaces all checked template ids for that user/category (`replace_checked_ids_for_user`)
- Merge / gating: `checklist_rules.merge_task_checklist_checked_ids` (mirrored client-side in `checklistRules.ts`)

### Template metadata (partial)

| Metadata | Status |
| -------- | ------ |
| `completion_type`, `component_key`, `integration_key` | Shipped on many items |
| `completion_requires_submit`, `parallel_step_group`, `allow_unordered_check` | Shipped (search/offer) |
| `calendar`, `suggested_form_ids`, dispatch automation flags | Shipped |
| `jurisdiction_ruleset_key`, conditional inclusion by state | **Planned** |
| `signature_plus_review`, role assignments | **Planned** |

### Integration-backed steps (shipped)

| `component_key` | UI / completion |
| --------------- | --------------- |
| `set_budget`, `choose_areas`, `define_criteria` | Profile/onboarding forms |
| `partner_agent` | Connected agent via messaging |
| `finding_home` | `TransactionAddress` + Places autocomplete |
| `review_comparables` | Comps section |
| `home_concierge` | Move Concierge via `PartnerTransactionIntegration` + admin placements |

Client registry: `checklists/components/integrations/componentRegistry.ts`. Auto-complete: `useAutoCompleteChecklistIntegrations.ts`.

### APIs

| Route | Scope |
| ----- | ----- |
| `GET/PUT /api/v1/tasks?type=` | Authenticated user |
| `GET/PUT /api/v1/transactions/:buyerUserId/tasks?type=` | Self or agent’s client |
| Progress summary | `/tasks/progress-summary`, `/transactions/:id/tasks/progress-summary` |

Client: `useChecklistData({ checklistSubjectUserId })` for agent mode.

### Planned evolution

- Materialize per-deal checklist state when multi-transaction model lands
- Filter/transform items by jurisdiction and contract facts
- Richer PUT payload (`itemStates` vs flat `checkedIds`)

See `documentation/transactions/options/03-checklist-modeling.md` for storage options.
