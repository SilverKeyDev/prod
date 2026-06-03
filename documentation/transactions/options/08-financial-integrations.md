> **Status:** Planned — partner placement pattern shipped for Move Concierge; no `IntegrationTask` or Plaid/loan rails.  
> **Last verified:** 2026-05-28

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
| Move Concierge (live partner) | Rev-share placements + redirect logging; checklist key `home_concierge` maps to **Move Concierge** UI (admin-driven URLs, not agent referral fees). | `Client/packages/features/partners/` (`PartnerTransactionIntegration.tsx`, `moveConciergeEmbed.ts`), `Server/app/routes/rev_share/`, template key in `Server/app/services/transactions/closing/items.py` (`integration_key`: `home_concierge`) |
| RESPA | Placement at workflow level; exposure logged. | `.cursor/rules/shared/respa-compliance.mdc` |
| Earnest / forms | Checklist PDF forms (e.g. earnest money) via forms library — not Plaid transfer automation. | `Server/app/models/documents/checklist_form.py`, `Server/app/services/documents/forms_service.py` |
| Plaid | Client env supports `plaidClientId`; no transaction `IntegrationTask` flow. | `Client/packages/config/env.test.ts` |
| `IntegrationTask` model | **Not present** in `Server/app/models/`. | — |

## Gaps

- `IntegrationTask` table + webhook/redirect completion → checklist state.
- Loan status providers, Plaid earnest-money confirmation, shared financial notification events.

## Naming

Docs and templates may still say `home_concierge`; product partner is **Move Concierge**. Prefer Move Concierge in user-facing copy; keys can stay until a coordinated rename.
