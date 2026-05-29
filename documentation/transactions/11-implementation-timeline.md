# Implementation timeline

> **Status:** Living document — aligned to code review 2026-05-28.  
> **Last verified:** 2026-05-28

| Phase | Area | Status | Code pointers |
| ----- | ---- | ------ | ------------- |
| 1 | Transaction entity + address | **Partial** | `Server/app/models/transactions/transaction.py`, `transaction_address.py`; `POST/GET .../transactions/address`; `FindingHome.tsx` — deal id not driving checklists yet |
| 2 | Checklists (transaction-scoped API) | **Shipped** | `Server/app/routes/transactions.py` (`/<buyer_user_id>/tasks`); `Client/packages/features/checklists/` (`useChecklistData`, `CloseLayout`, roadmap) |
| 3 | Move Concierge (rev-share placement) | **Shipped** | `Client/packages/features/partners/`; `Server/app/routes/rev_share/`; checklist key `home_concierge` → `PartnerTransactionIntegration` |
| 4 | Documents / DocuSign | **Partial** | `Client/packages/features/documents/`; `Server/app/services/docusign/`; `checklist_forms.py`, `checklist_documents.py` |
| 5 | Calendar (Google user calendar) | **Partial** | `Client/packages/features/calendar/` — no transaction milestone calendar |
| 6 | Messaging / agent–client collaboration | **Partial** | `Client/packages/features/messaging/`; DocuSign→messaging in `Server/app/services/docusign/notifications/messaging.py` |
| 7 | Workspace shells | **Partial** | `Client/packages/features/workspace/` (switcher + placeholders) |
| 8 | Deadline / milestone engine | **Planned** | `transactions/mechanics/05-deadline-and-milestone-engine.md`; form `calculate_deadline` only |
| 9 | Location enrichment | **Planned** | `transactions/mechanics/04-location-enrichment.md` |
| 10 | Notifications bus | **Planned** | `options/06-notification-architecture.md` |
| 11 | Transaction RBAC / participants | **Planned** | `options/07-collaboration-and-permissions.md` |
| 12 | Financial `IntegrationTask` (loans, Plaid) | **Planned** | `options/08-financial-integrations.md` |

## Shipped path (today)

Buyer or agent opens checklists → progress via `TransactionTask` + templates → optional integrations (Finding home address, partner placements including **Move Concierge**, profile-backed steps) → forms/DocuSign on agent paths.

## Not shipped yet

Multi-deal `Transaction` rows with switcher, `ChecklistItemState` per deal id, milestone engine + transaction calendar, central notifications, `TransactionParticipant` RBAC, generic `IntegrationTask` providers.

Build sequence detail: [10-implementation-order.md](./10-implementation-order.md).
