> **Status:** Planned | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [checklists-integrations.md](../../client/features/checklists-integrations.md).

## Review workflows and approvals

Explicit review queues (agent/TC approves before an item is "done") are **not built**. Checklist completion is checkbox, integration, or signature-driven only.

### Current behavior

- Items with `completion_type: "signature_based"` complete when DocuSign reports signed—not via a separate review step.
- Agents can manually toggle client checklist items; no `review_required_role` or `ReviewRecord` model.

### Planned

- `review_state` on checklist items (`pending`, `approved`, `changes_requested`).
- Reviewer queue in checklists/documents UI + notifications to required roles.

### Code pointers

| Area | Path |
| ---- | ---- |
| Signature completion | `Server/app/services/transactions/checklist_signature_completion.py` |
| Completion rules (client) | `Client/packages/features/checklists/utils/rules/checklistRules.ts` |
| Closing items w/ signature | `Server/app/services/transactions/closing/items.py` — e.g. item 2 `completion_type` |
| Agreement review UI (agent) | `Client/packages/features/documents/components/agreement/AgreementDetailModalAgentPanels.tsx` |
