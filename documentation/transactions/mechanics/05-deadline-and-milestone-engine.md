> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/services/transactions/calendar_from_checklist.py`, `Server/app/services/documents/forms_service.py`, `Server/app/services/transactions/retrieval.py`, `Client/packages/utils/calendar/createEvent/buyerChecklistMilestones.ts`, `Client/packages/features/calendar/`

## Deadline and milestone engine

Relative checklist scheduling ships; contract-based milestone engine does not.

### Shipped: relative scheduling

| Mechanism | Trigger | Output |
| --------- | ------- | ------ |
| **Checkoff calendar** | User checks an item with `calendar.hasDates: false` | `CalendarEvent` at checkoff + N days (`calendar_from_checklist.py`) |
| **Form deadlines** | Agent opens checklist forms with transaction start date | `FormsService.calculate_deadline` from item `calendar.days` |
| **Agent todos** | Checklist dispatch automation on checkoff | Agent todo with optional due date |

Item example (closing): `"calendar": {"hasDates": False, "days": 3, "eventSchedule": [3]}`.

Events stored locally (`sync_source="checklist"`); Google Calendar sync is separate connection flow.

### Shipped: checklist metadata placeholders

`get_series_metadata()` returns null `deadline`, `date_finished`, `state`, `county` for all categories — API shape exists; values not computed.

Client calendar kind options reference stable checklist item ids (`buyerChecklistMilestones.ts`) for buyer-broker and purchase-agreement gates — not a full milestone list.

### Planned: rules engine

Inputs (future):

- `contract_acceptance_date`, closing date, cash vs financed, occupancy
- `jurisdiction_ruleset_key` from location enrichment

Outputs (future):

- `Milestone` rows: inspection end, earnest money due, financing contingency, title objection, closing
- `source`: `rule_engine` | `manual_override` | `integration`
- APIs: `GET/PUT /api/v1/transactions/:id/milestones`
- Drive checklist “Due by X”, notifications, synced calendar

Legacy `milestones` table was removed; no replacement table yet.

### Invariants (target)

Same transaction inputs + ruleset version → same computed dates unless manually overridden; overrides audited.

### Build path

1. Codify jurisdiction rule sets (business days vs calendar days)
2. Persist milestones + link to checklist items / calendar
3. Surface through existing checklist metadata and calendar UIs — no parallel calendar module
