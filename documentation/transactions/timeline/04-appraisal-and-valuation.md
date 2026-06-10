> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [checklists-integrations.md](../../client/features/checklists-integrations.md).

## Appraisal and valuation

Appraisal steps appear as **financing checklist copy** (order appraisal, review report). No appraisal-specific milestones or lender status sync.

### Shipped

- Financing templates include appraisal-related tasks and explanations in `financing/items.py`.
- `FinancingInsurance` subheader for buyer/agent checklist UX.

### Gaps

- No `appraisal_ordered` / `appraisal_completed` / `appraisal_contingency_end` milestone types.
- No lender or AMC integration for status updates.

### Code pointers

| Area | Path |
| ---- | ---- |
| Financing items | `Server/app/services/transactions/financing/items.py` |
| UI subheader | `Client/packages/features/checklists/components/subheaders/FinancingInsurance.tsx` |
| Task category enum (inspection/closing/deadline) | `Client/packages/types/api.generated.ts` — `TransactionTask` category docs |
