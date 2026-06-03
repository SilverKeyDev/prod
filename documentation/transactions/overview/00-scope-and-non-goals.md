> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Client/packages/features/checklists/`, `Client/packages/features/partners/`, `Client/packages/features/documents/`, `Client/packages/features/workspace/`, `Server/app/routes/tasks.py`, `Server/app/routes/transactions.py`, `Server/app/services/transactions/`

## Scope and non-goals

### Problem

Buyers and agents manage a home purchase through **checklist pipelines** (search → offer → escrow → financing → closing → insurance), with progress, integrations, calendar hooks, and DocuSign-backed agreements.

### Shipped today

| Area | What exists |
| ---- | ----------- |
| **Buyer journey checklists** | Six categories; templates in `Server/app/services/transactions/*/items.py`; progress in `TransactionTask` (`user_tasks`) |
| **APIs** | `GET/PUT /api/v1/tasks` (self) and `/api/v1/transactions/:buyerUserId/tasks` (buyer or agent client) |
| **Integration steps** | Profile/onboarding steps (budget, areas, criteria, agent), `finding_home` address, Move Concierge via partner placements (`integration_key`: `home_concierge`) |
| **Signatures** | `completion_type: signature_based`; auto-complete from `AgreementLink` + DocuSign status |
| **Address** | One saved address per user (`TransactionAddress`); Google Places in `FindingHome` |
| **Calendar** | Relative events on checkoff from item `calendar` config (`calendar_from_checklist`) |
| **Documents** | DocuSign + S3; checklist form attach/send; `AgreementLink` to checklist steps |
| **Agent view** | Agents read/update client checklists via `checklistSubjectUserId` |
| **Workspace** | Buyer / seller / agent shells (`Client/packages/features/workspace/`) — not multi-property switching |

### Vision (not shipped)

- Multiple concurrent transactions per user, each anchored on a canonical address
- Full `Transaction` entity driving all progress (today `transaction_id` is often the **buyer user id**)
- Jurisdiction rule sets, flood/homestead enrichment, deterministic deadline engine
- Multi-party roles (TC, loan officer) with assignment and review gates
- Plaid/earnest-money and lender integrations

### Non-goals (unchanged)

- Full legal automation or every state’s real-estate law codified
- Every brokerage forms provider (DocuSign + optional FMLS/eXp catalogs only)
- Commercial / rental transactions in v1
- Replacing existing checklist, calendar, or documents surfaces — extend them

### Reuse map

| Concern | Extend |
| ------- | ------ |
| Templates + progress | `Server/app/services/transactions/`, `TransactionTask` |
| Client UI | `Client/packages/features/checklists/` |
| Partners / Move Concierge | `Client/packages/features/partners/` |
| Agreements | `Server/app/models/documents/`, `Client/packages/features/documents/` |
| Calendar | `Client/packages/features/calendar/`, `calendar_from_checklist.py` |
