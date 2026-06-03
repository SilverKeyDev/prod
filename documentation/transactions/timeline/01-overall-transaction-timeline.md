> **Status:** Partial | **Last verified:** 2026-05-28

## Overall transaction timeline

Residential purchase phases map to **checklist categories**, not a computed milestone timeline. Buyers progress through search → offer → escrow → financing → closing → insurance/due diligence tabs.

### Phase → checklist mapping

| Phase | Checklist category | Server templates |
| ----- | ------------------ | ---------------- |
| Search / pre-contract | `search` | `Server/app/services/transactions/search/items.py` |
| Offer | `offer` | `offer/items.py` |
| Contract / escrow setup | `escrow` | `escrow/items.py` |
| Due diligence / inspections | `insurance` | `insurance/items.py` |
| Financing | `financing` | `financing/items.py` |
| Closing / move-in | `closing` | `closing/items.py` |

### Shipped vs gaps

- **Shipped:** Category definitions, progressive checklist UI, pipeline stage inference for agents (`TASK_CATEGORIES`, `PIPELINE_ORDER`).
- **Gaps:** Phase progress overview, deadline engine milestones, jurisdiction-driven dates (see `09-state-variation-model.md`).

### Code pointers

| Area | Path |
| ---- | ---- |
| Category constants | `Server/app/services/transactions/checklist_support/checklist_constants.py` |
| Progress summary | `Server/app/services/transactions/unified_task_checklist_progress_summary.py` |
| Buyer roadmap UI | `Client/packages/features/checklists/components/roadmap/BuyerRoadmapChecklistList.tsx` |
| Subheaders by phase | `Client/packages/features/checklists/components/subheaders/` |
