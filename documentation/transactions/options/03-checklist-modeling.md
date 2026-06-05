> **Status:** Shipped (templates + per-user progress); transaction-scoped `ChecklistItemState` not added.  
> **Last verified:** 2026-06-04

## Problem

Keep rich template copy in one place, track per-deal progress/assignments/reviews, and evolve off `user_tasks` without duplicating content per row.

## Settled decisions

| Decision | Choice |
| -------- | ------ |
| Storage pattern | **Option A** — templates in code/data; thin per-deal state overlay (not full materialized rows per item). |
| Materialized copy per deal (**Option B**) | Deferred — higher migration cost. |
| Hybrid (**Option C**) | Only if per-instance notes/deadlines force it later. |
| Brokerage vendor checklists (e.g. Dotloop) | Agent-scoped attachments with `external_integration_key`; not global templates. |

## Code today

| Area | What exists | Pointers |
| ---- | ----------- | -------- |
| Templates | Category item arrays (escrow, financing, closing, insurance). | `Server/app/services/transactions/escrow/items.py`, `financing/items.py`, `closing/items.py`, `insurance/items.py` |
| Read/write API | `GET/PUT /api/v1/transactions/<transactions.id>/tasks` (+ progress summary). | `Server/app/routes/transactions/__init__.py` |
| Progress | `TransactionTask`: `transaction_id`, `category`, `status`, `task_metadata` (includes `templateId`). | `Server/app/models/transactions/transaction_task.py` |
| Client | `useChecklistData`, rules merge, integration submit completion. | `Client/packages/features/checklists/hooks/data/useChecklistData.ts`, `utils/rules/checklistRules.ts`, `utils/integration/checklistIntegrationComplete.ts` |
| Forms on steps | Per-step forms list/send/download. | `Server/app/routes/checklist_forms.py`, `Client/packages/features/documents/api/checklistForms.ts` |
| Partner steps | Rev-share placements on `partner_placements` integration key (e.g. `closing:13`). | `Server/app/services/rev_share/`, `Client/packages/features/partners/components/PartnerTransactionIntegration.tsx` |

## Gaps vs target model

- No `ChecklistItemState` overlay keyed by `(transaction_id, category, template_id)` — progress uses `TransactionTask.transaction_id` today.
- `ChecklistItemState` name in older docs = planned; do not assume the table exists.

## DocuSign note

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [checklists-integrations.md](../../client/features/checklists-integrations.md).

SilverKey agreements are **DocuSign + S3**, not a generic brokerage-form mirror. See `documentation/transactions/integrations/09-documents-docusign-and-s3.md`.
