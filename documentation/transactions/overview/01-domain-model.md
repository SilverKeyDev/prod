> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/models/transactions/`, `Server/app/models/documents/agreement_link.py`, `Server/app/services/transactions/checklist_support/`, `Client/packages/features/checklists/types/`

## Domain model

Conceptual entities vs what ships today.

### Shipped entities

| Entity | Storage | Notes |
| ------ | ------- | ----- |
| **Checklist templates** | Python dicts in `Server/app/services/transactions/*/items.py` | Categories: `search`, `offer`, `escrow`, `financing`, `closing`, `insurance` |
| **Checklist progress** | `TransactionTask` (`user_tasks`) | Keyed by `user_id` + `category`; `task_metadata.templateId` |
| **Transaction address** | `TransactionAddress` | One row per user; `place_id`, structured fields |
| **Transaction (minimal)** | `Transaction` | `buyer_id`, `primary_agent_id`, optional `skyslope_file_id` — not the progress key |
| **Agreement** | `Agreement` + participants | DocuSign lifecycle; `property_address` text field |
| **Agreement ↔ checklist** | `AgreementLink` | `transaction_id` + `linked_item_id` like `escrow.2` |
| **Calendar events** | `CalendarEvent` | Created on checkoff when item has `calendar` config |

### Template metadata (on dict items)

| Field | Purpose |
| ----- | ------- |
| `completion_type` | `signature_based` (others mostly manual) |
| `component_key` | Renders integration UI (`set_budget`, `finding_home`, `home_concierge`, …) |
| `integration_key` | Partner step id (Move Concierge → `home_concierge`) |
| `completion_requires_submit` | Gated steps; merge rules in `checklist_rules.py` |
| `parallel_step_group` | Parallel search-phase integrations |
| `calendar` | Relative day offsets → calendar events |
| `suggested_form_ids` | Checklist form catalog hints |

### Planned (not in DB yet)

- `PropertyAddress`, `TransactionParticipant`, `ChecklistInstance` / `ChecklistItemState`
- `Milestone` table (legacy `milestones` table was dropped)
- `IntegrationTask`, `NotificationEvent`, `jurisdiction_ruleset_key`

### ID convention (important)

| API param | Actual meaning today |
| --------- | -------------------- |
| `/transactions/:transaction_id/tasks` | **Buyer user id** for progress reads/writes |
| `AgreementLink.transaction_id` | Same — buyer user id in most flows |
| `Transaction.id` | Separate row when created for agent linkage; not wired through all checklist paths |

### Client types

- API: `Client/packages/features/checklists/api/checklists.ts`
- Hook: `useChecklistData` — `checklistSubjectUserId` for agent client mode
- Integration registry: `checklists/components/integrations/componentRegistry.ts`
