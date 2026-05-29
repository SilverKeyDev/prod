> **Status:** Living build sequence — phases marked **Shipped**, **Partial**, or **Planned** per code on 2026-05-28.  
> **Last verified:** 2026-05-28

Practical order for checklist-driven transactions. Extend existing surfaces; avoid a parallel transactions-only app.

**Status key:** **Shipped** = in production paths · **Partial** = started, gaps listed · **Planned** = not in code yet

---

## Phase 1 — Transaction and address foundation

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 1. `Transaction` + address models | **Partial** | `Transaction` minimal; address is `TransactionAddress` per **user**, not per `transactions.id`. | `Server/app/models/transactions/transaction.py`, `transaction_address.py` |
| 2. Create deal API | **Planned** | No `POST /api/v1/transactions` that returns a deal id for all downstream scopes. | — |
| 3. In-flow address (Finding home) | **Partial** | Places autocomplete + save; `place_id` optional on server; no lat/lng. | `FindingHome.tsx`, `POST /api/v1/transactions/address` in `Server/app/routes/transactions.py` |

---

## Phase 2 — Transaction-aware checklists (MVP)

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 3. Transaction-scoped checklist API | **Shipped** | `<transaction_id>` = buyer **user id**; agent access via client list. | `Server/app/routes/transactions.py`, `unified_task_checklist_*.py` |
| 4. Client wiring | **Shipped** | `checklistSubjectUserId` / `transactionSubjectId`. | `useChecklistData.ts`, `checklists/api/checklists.ts` |
| 5. Transaction switcher | **Planned** | No multi-deal picker; one checklist scope per buyer user today. | — |

---

## Phase 3 — Location enrichment and deadlines

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 6. Location enrichment | **Planned** | No jurisdiction/flood service writing back to deal/address. | `transactions/mechanics/04-location-enrichment.md` |
| 7. Milestone / deadline engine | **Planned** | Form step deadlines only; no `.../milestones` API. | `Server/app/services/documents/forms_service.py` |
| 8. Milestones in checklist UI | **Partial** | Deadline on forms metadata; not engine-driven checklist labels everywhere. | checklist forms routes |

---

## Phase 4 — Calendar and event linking

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 9. Transaction-scoped calendar | **Planned** | Google user calendar exists; no deal filter. | `Client/packages/features/calendar/` |
| 10. Google sync for milestones | **Planned** | See `options/04-calendar-sync-strategy.md`. | calendar create hooks |

---

## Phase 5 — Documents, DocuSign, signing-driven completion

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 11. Templates + checklist forms | **Partial** | Forms library + per-step send; DocuSign stack under `Server/app/services/docusign/`. | `checklist_forms.py`, `Client/packages/features/documents/` |
| 12. Signature status wiring | **Partial** | Connect webhooks + client polling; messaging on completion. | `docusign/notifications/`, documents hooks |
| 13. Checklist completion from signatures | **Partial** | `AgreementLink` to checklist items exists; not all template items are signature-gated. | `Server/app/models/documents/agreement.py`, `checklist_documents.py` |

---

## Phase 6 — Move Concierge and integration-backed tasks

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 14. `IntegrationTask` model | **Planned** | — | — |
| 15. Move Concierge as first provider | **Shipped** (placement) | Rev-share embed + step views; not `IntegrationTask` callback. | `Client/packages/features/partners/`, `Server/app/routes/rev_share/` |

---

## Phase 7 — Collaboration and multi-party access

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 16. `TransactionParticipant` | **Planned** | — | `options/07-collaboration-and-permissions.md` |
| 17. Permissions + assignments | **Planned** | Agent/client checklist gate only today. | `transactions.py` |
| 18. Activity feed + notifications | **Planned** | — | `collaboration/07-audit-trail-and-activity-feed.md` |

---

## Phase 8 — Timeline and state variation

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 19. Timeline docs → rules | **Planned** | `transactions/timeline/*` is spec. | `mechanics/05-deadline-and-milestone-engine.md` |
| 20. Compliance / external data APIs | **Planned** | — | `integrations/10-compliance-data-and-apis.md` |

---

## Phase 9 — Hardening

| Step | Status | Notes | Code pointers |
| ---- | ------ | ----- | ------------- |
| 21. Observability | **Partial** | Structured logging; no dedicated transaction funnel metrics doc in code. | `packages/logger`, `Server/logger` |
| 22. Security / permissions review | **Partial** | Auth decorators + rev-share exposure logging. | `respa-compliance.mdc`, `step_views.py` |
| 23. E2E + feature flag | **Planned** | — | — |

---

See [11-implementation-timeline.md](./11-implementation-timeline.md) for a compact phase status table.
