> **Status:** Partial  
> **Last verified:** 2026-06-04  
> **Code pointers:** `Server/app/models/transactions/`, `Server/app/models/documents/agreement_link.py`, `Server/app/services/transactions/checklist_support/`, `Client/packages/features/checklists/types/`

## Domain model

Conceptual entities vs what ships today.

### Shipped entities

| Entity | Storage | Notes |
| ------ | ------- | ----- |
| **Checklist templates** | Python dicts in `Server/app/services/transactions/*/items.py` | Categories: `search`, `offer`, `escrow`, `financing`, `closing`, `insurance` |
| **Checklist progress** | `TransactionTask` (`user_tasks`) | Keyed by `transaction_id` + `category`; `task_metadata.templateId` |
| **Transaction address** | `TransactionAddress` | One row per `transactions.id`; `place_id`, structured fields |
| **Transaction (spine)** | `Transaction` | `buyer_id`, `primary_agent_id`, `brokerage_org_id`; many rows per buyer (Option B) |
| **Active deal** | `users.active_transaction_id` | Buyer pointer; `/transactions/me` resolves active or latest |
| **Agreement** | `Agreement` + participants | DocuSign lifecycle; `property_address` text field |
| **Agreement ↔ checklist** | `AgreementLink` | `transaction_id` + `linked_item_id` like `escrow.2` |
| **Calendar events** | `CalendarEvent` | Created on checkoff when item has `calendar` config |

### Template metadata (on dict items)

| Field | Purpose |
| ----- | ------- |
| `completion_type` | `signature_based` (others mostly manual) |
| `component_key` | Renders integration UI (`set_budget`, `finding_home`, `partner_placements`, …) |
| `integration_key` | Partner step key (e.g. `partner_placements` on `closing:13`) |
| `completion_requires_submit` | Gated steps; merge rules in `checklist_rules.py` |
| `parallel_step_group` | Parallel search-phase integrations |
| `calendar` | Relative day offsets → calendar events |
| `suggested_form_ids` | Checklist form catalog hints |

### Planned (not in DB yet)

- `PropertyAddress`, `TransactionParticipant`, `ChecklistInstance` / `ChecklistItemState`
- `Milestone` table (legacy `milestones` table was dropped)
- `IntegrationTask`, `NotificationEvent`, `jurisdiction_ruleset_key`

### ID convention (important)

| API param | Meaning |
| --------- | ------- |
| `/transactions/:transaction_id/tasks` | **`transactions.id` (UUID)** — never buyer `users.id` |
| `AgreementLink.transaction_id` | **`transactions.id`** |
| `GET /transactions/me` | Active deal for buyer (`TransactionMeData`) |

### Client types

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [workspace.md](../../client/features/workspace.md).

- API: `Client/packages/features/checklists/api/checklists.ts`
- Hooks: `useChecklistData({ transactionId })`, `useResolvedTransactionId`, `useMyTransaction`
- Integration registry: `checklists/components/integrations/componentRegistry.ts`
