# Implementation timeline

> **Status:** Living document — aligned to code review 2026-05-28.  
> **Last verified:** 2026-06-04  
> **Shipped feature docs:** [checklists.md](../client/features/checklists.md), [workspace.md](../client/features/workspace.md).

| Phase | Area | Status | Code pointers |
| ----- | ---- | ------ | ------------- |
| 1 | Transaction entity + address | **Partial** | Option B contract: multi-row, `active_transaction_id`, address per deal; migration `k6f7a8b9c0d1` |
| 2 | Checklists (transaction-scoped API) | **Shipped** | `/<transactions.id>/tasks`; `useChecklistData({ transactionId })` |
| 3 | Rev-share partner placements | **Shipped** | `Client/packages/features/partners/`; `Server/app/routes/rev_share/`; checklist key `partner_placements` → `PartnerTransactionIntegration` |
| 4 | Documents / DocuSign | **Partial** | `Client/packages/features/documents/`; `Server/app/services/docusign/`; `checklist_forms.py`, `checklist_documents.py` |
| 5 | Calendar (Google user calendar) | **Partial** | `Client/packages/features/calendar/` — no transaction milestone calendar |
| 6 | Messaging / agent–client collaboration | **Partial** | `Client/packages/features/messaging/`; DocuSign→messaging in `Server/app/services/docusign/notifications/messaging.py` |
| 7 | Workspace shells | **Partial** | `Client/packages/features/workspace/` (switcher + placeholders) |
| 8 | Deadline / milestone engine | **Planned** | **After** Option B spine — `GET/PUT .../transactions/{id}/milestones`; see `05-deadline-and-milestone-engine.md` |
| 9 | Location enrichment | **Planned** | `transactions/mechanics/04-location-enrichment.md` |
| 10 | Notifications bus | **Planned** | **After** RBAC spine — events carry `transaction_id`; `options/06-notification-architecture.md` |
| 11 | Transaction RBAC / participants | **Planned** | **After** storage contract — `TransactionParticipant`; `options/07-collaboration-and-permissions.md` |
| 12 | Financial `IntegrationTask` (loans, Plaid) | **Planned** | `options/08-financial-integrations.md` |

## Shipped path (today)

Buyer or agent opens checklists → progress via `TransactionTask` + templates → optional integrations (Finding home address, admin partner placements on configured steps, profile-backed steps) → forms/DocuSign on agent paths.

## Not shipped yet

Multi-deal **UI** switcher, `ChecklistItemState` overlay per deal id, milestone engine + transaction calendar, central notifications, `TransactionParticipant` RBAC, generic `IntegrationTask` providers. Backend multi-row + OpenAPI contract shipped 2026-06-04.

Build sequence detail: [10-implementation-order.md](./10-implementation-order.md).
