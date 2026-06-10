> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [checklists-integrations.md](../../client/features/checklists-integrations.md).

## Task and checklist collaboration

Checklists are the shared plan of record for buyer + agent. Progress is a single `checkedIds` set per category—not per-participant assignment or review state.

### Shipped

- **Unified task API:** Definitions from server templates + buyer `checkedIds`; categories: search, offer, escrow, financing, closing, insurance.
- **Agent collaboration:** Agents read/update a client's checklist via `transactionId` (`transactions.id`) on `/api/v1/transactions/:id/tasks`.
- **Integrations:** Partner checklist steps (`partner_placements`) complete via integration slots; signature-based items tie to DocuSign.
- **Calendar side effect:** Checking an item can spawn relative-day `CalendarEvent` rows (`sync_source="checklist"`).

### Gaps

- No `assigned_to_participant_id`, `review_state`, or multi-party conflict handling.
- No transaction activity feed on checklist updates.

### Code pointers

| Area | Path |
| ---- | ---- |
| Checklist hook | `Client/packages/features/checklists/hooks/data/useChecklistData.ts` |
| Layout / integrations | `Client/packages/features/checklists/components/layout/CloseLayout.tsx` |
| Item templates | `Server/app/services/transactions/{escrow,financing,insurance,closing}/items.py` |
| Read/write | `Server/app/services/transactions/unified_task_checklist_{read,write}.py` |
| Calendar from checkoff | `Server/app/services/transactions/calendar_from_checklist.py` |
| Partner slot | `Client/packages/features/checklists/components/slots/ChecklistIntegrationSlot.tsx` |
