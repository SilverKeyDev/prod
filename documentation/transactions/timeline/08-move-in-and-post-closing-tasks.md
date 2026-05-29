> **Status:** Partial | **Last verified:** 2026-05-28

## Move-in and post-closing tasks

Post-closing guidance is in **closing checklist items** plus a live **Move Concierge** partner embed on configured checklist steps.

### Shipped

- `CLOSING_ITEMS`: utilities transfer, homestead filing, address change, maintenance calendar, optional HOA.
- **Move Concierge:** Admin-configured checklist integration; embed URL + prefill via `moveConciergeEmbed.ts`; `PartnerTransactionIntegration` (registry key `home_concierge` → shared partner component).
- RESPA: brokerage-level placement; exposure logged—not agent referral steering.

### Gaps

- No computed `homestead_filing_deadline` or `possession_date` milestones.
- No automated maintenance calendar sync beyond user-created events.

### Code pointers

| Area | Path |
| ---- | ---- |
| Closing / move-in items | `Server/app/services/transactions/closing/items.py` |
| Move Concierge embed | `Client/packages/features/partners/utils/moveConciergeEmbed.ts` |
| Embed hook | `Client/packages/features/partners/hooks/useMoveConciergeEmbedUrl.ts` |
| Checklist integration UI | `Client/packages/features/partners/components/PartnerTransactionIntegration.tsx` |
| Registry | `Client/packages/features/checklists/components/integrations/componentRegistry.ts` |
| Closing UI | `Client/packages/features/checklists/components/subheaders/ClosingMovingIn.tsx` |
