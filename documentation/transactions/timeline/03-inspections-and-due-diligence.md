> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [checklists-integrations.md](../../client/features/checklists-integrations.md).

## Inspections and due diligence

Inspection guidance is **static checklist content** under the `insurance` category (historical naming). No computed inspection-window milestones.

### Shipped

- `INSURANCE_ITEMS` templates: hire inspector, review disclosures, specialized inspections, insurance shopping.
- `InspectionsDueDiligence` subheader renders via shared `CloseLayout` + `useChecklistData`.
- Optional calendar offsets on specific items when configured in template JSON.

### Gaps

- No `inspection_window_end` or repair-request deadline from contract dates.
- No jurisdiction-specific contingency lengths.

### Code pointers

| Area | Path |
| ---- | ---- |
| Item definitions | `Server/app/services/transactions/insurance/items.py` |
| UI subheader | `Client/packages/features/checklists/components/subheaders/InspectionsDueDiligence.tsx` |
| Checklist layout | `Client/packages/features/checklists/components/layout/CloseLayout.tsx` |
| Active step logic | `Client/packages/features/checklists/utils/presentation/getActiveChecklistItemId.ts` |
