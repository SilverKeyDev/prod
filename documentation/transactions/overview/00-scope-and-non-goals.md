> **Status:** Partial  
> **Last verified:** 2026-06-04  
> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [workspace.md](../../client/features/workspace.md), [docusign-integration.md](../../client/features/docusign-integration.md), [rev-share-partners.md](../../client/features/rev-share-partners.md).  
> **Code pointers:** `Client/packages/features/checklists/`, `Client/packages/features/partners/`, `Client/packages/features/documents/`, `Client/packages/features/workspace/`, `Server/app/routes/transactions/`, `Server/app/services/transactions/`

## Scope and non-goals

### Problem

Buyers and agents manage a home purchase through **checklist pipelines** (search → offer → escrow → financing → closing → insurance), with progress, integrations, calendar hooks, and DocuSign-backed agreements.

### Shipped today

| Area | What exists |
| ---- | ----------- |
| **Buyer journey checklists** | Six categories; templates in `Server/app/services/transactions/*/items.py`; progress in `TransactionTask` (`user_tasks`) |
| **APIs** | `GET/PUT /api/v1/transactions/:transactionId/tasks` (`transactions.id`) + progress summary |
| **Integration steps** | Profile/onboarding steps (budget, areas, criteria, agent), `finding_home` address, partner placements (`integration_key`: `partner_placements`, e.g. `closing:13`) |
| **Signatures** | `completion_type: signature_based`; auto-complete from `AgreementLink` + DocuSign status |
| **Address** | One saved address per active deal (`TransactionAddress.transaction_id`); Google Places in `FindingHome` |
| **Calendar** | Relative events on checkoff from item `calendar` config (`calendar_from_checklist`) |
| **Documents** | DocuSign + S3; checklist form attach/send; `AgreementLink` to checklist steps |
| **Agent view** | Agents read/update client checklists via `transactionId` from client list |
| **Workspace** | Buyer / seller / agent shells (`Client/packages/features/workspace/`) — not multi-property switching |

### Vision (not shipped)

- Multiple concurrent transactions per user, each anchored on a canonical address
- Multi-deal switcher UI (backend + OpenAPI ready; pilot uses `/transactions/me` only)
- Jurisdiction rule sets, flood/homestead enrichment, deterministic deadline engine
- Multi-party roles (TC, loan officer) with assignment and review gates
- Plaid/earnest-money and lender integrations

### Non-goals (unchanged)

- Full legal automation or every state’s real-estate law codified
- Every brokerage forms provider (DocuSign + optional FMLS/eXp catalogs only)
- Commercial / rental transactions in v1
- Replacing existing checklist, calendar, or documents surfaces — extend them

### Reuse map

| Concern | Extend | Shipped doc |
| ------- | ------ | ----------- |
| Templates + progress | `Server/app/services/transactions/`, `TransactionTask` | [checklists.md](../../client/features/checklists.md) |
| Client UI | `Client/packages/features/checklists/` | [checklists-integrations.md](../../client/features/checklists-integrations.md) |
| Partners / rev-share placements | `Client/packages/features/partners/` | [rev-share-partners.md](../../client/features/rev-share-partners.md) |
| Agreements | `Server/app/models/documents/`, `Client/packages/features/documents/` | [docusign-integration.md](../../client/features/docusign-integration.md) |
| Workspace shells | `Client/packages/features/workspace/` | [workspace.md](../../client/features/workspace.md) |
| Calendar | `Client/packages/features/calendar/`, `calendar_from_checklist.py` | — |
