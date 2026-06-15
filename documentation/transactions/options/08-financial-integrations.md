> **Status:** Planned — partner placement pattern shipped via `partner_placements`; no `IntegrationTask` or Plaid/loan rails.  
> **Last verified:** 2026-06-04

## Problem

Loans, earnest money, and partner services should complete checklist steps via provider-backed tasks without hard-coding each vendor in routes.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| Pattern | **Option A** — generic integration task keyed by `provider_key` + small provider services. |
| Hard-coded per provider (**Option B**) | Prototype-only. |
| Manual-only steps (**Option C**) | Placeholder until integrations exist. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| Partner placements | Rev-share placements + redirect logging; closing item 13 (`partner_placements`) renders `PartnerTransactionIntegration` (admin-driven URLs, not agent referral fees). | `Client/packages/features/partners/`, `Server/app/routes/rev_share/`, `Server/app/services/transactions/closing/items.py` |
| RESPA | Placement at workflow level; exposure logged. | `.cursor/rules/shared/respa-compliance.mdc` |
| Earnest / forms | Checklist PDF forms (e.g. earnest money) via forms library — not Plaid transfer automation. | `Server/app/models/documents/checklist_form.py`, `Server/app/services/documents/forms_service.py` |
| Plaid | Client env supports `plaidClientId`; no transaction `IntegrationTask` flow. | `Client/packages/config/env.test.ts` |
| `IntegrationTask` model | **Not present** in `Server/app/models/`. | — |

## Gaps

- `IntegrationTask` table + webhook/redirect completion → checklist state.
- Loan status providers, Plaid earnest-money confirmation, shared financial notification events.

## Naming

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [rev-share-partners.md](../../client/features/rev-share-partners.md).

Closing step 13 keeps generic copy *Schedule move-in concierge*; integration keys are `partner_placements` (no hardcoded partner slug in templates).
