> **Status:** Partial | **Last verified:** 2026-06-04

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [rev-share-partners.md](../../client/features/rev-share-partners.md).

## Move-in and post-closing tasks

Post-closing guidance is in **closing checklist items**, with optional **partner placements** on configured steps (e.g. *Schedule move-in concierge* at `closing:13`).

### Shipped

- `CLOSING_ITEMS`: utilities transfer, homestead filing, address change, maintenance calendar, optional HOA.
- **Partner placements:** Admin-configured rows for `step_id` `closing:13`; buyers see `PartnerTransactionIntegration` when `component_key` / `integration_key` are `partner_placements`.
- RESPA: brokerage-level placement; exposure logged—not agent referral steering.

### Gaps

- No computed `homestead_filing_deadline` or `possession_date` milestones.
- No automated maintenance calendar sync beyond user-created events.

### Code pointers

| Area | Path |
| ---- | ---- |
| Closing / move-in items | `Server/app/services/transactions/closing/items.py` |
| Checklist integration UI | `Client/packages/features/partners/components/PartnerTransactionIntegration.tsx` |
| Registry | `Client/packages/features/checklists/components/integrations/componentRegistry.ts` |
| Closing UI | `Client/packages/features/checklists/components/subheaders/ClosingMovingIn.tsx` |
