# Checklist integrations (partners)

> **Status:** Partial — rev-share partner placements shipped; other financial integrations planned  
> **Last verified:** 2026-06-04  
> **Code:** `Client/packages/features/checklists/components/integrations/`, `Client/packages/features/partners/`

## Partner placements (shipped)

- **Closing step `closing:13`** — template label *Schedule move-in concierge* (generic task copy, not a hardcoded partner brand).
- **Integration keys:** `component_key` and `integration_key` are both `partner_placements` on that step (`Server/app/services/transactions/closing/items.py`).
- **UI:** `PartnerTransactionIntegration` via `componentRegistry.ts` — lists admin-configured placements for the step; outbound clicks use rev-share `/r/{link_id}`.
- Placement is **brokerage-level marketplace** configuration — not buyer-personalized steering.

### RESPA boundary

Partner surfacing is **brokerage-level marketplace placement**, not agent referral kickbacks. See [CLAUDE.md](../../../CLAUDE.md) and [`.cursor/rules/shared/respa-compliance.mdc`](../../../.cursor/rules/shared/respa-compliance.mdc). Log partner exposure events; no opaque agent compensation tied to steering.

## Removed integrations

- **Removed:** Hardcoded partner iframe embed and partner-specific prefill utilities. Use admin **partner placements** on `closing:13` (or other `step_id`s) instead of restoring embed-only code paths.

## Completeness

Checklist integration completeness utilities: `checklists/utils/integration/checklistIntegrationCompleteness.ts`.

## Related

| Doc | Topic |
|-----|-------|
| [rev-share-partners.md](./rev-share-partners.md) | Admin placement, click tracking |
| [transactions/integrations/12-financial-and-service-integrations.md](../../transactions/integrations/12-financial-and-service-integrations.md) | Financial rails (planned) |
