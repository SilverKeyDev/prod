> **Status:** Partial  
> **Last verified:** 2026-06-04  
> **Code pointers:** `Client/packages/features/partners/` (rev-share placements); `Client/packages/features/checklists/components/integrations/componentRegistry.ts` (`partner_placements`); [`documentation/client/features/rev-share-partners.md`](../../client/features/rev-share-partners.md)

## Financial and service integrations

**Checklist keys:** Partner steps use `component_key` / `integration_key` `partner_placements` (e.g. closing item 13 — *Schedule move-in concierge*).

### Shipped today — partner placements

- **Brokerage marketplace placement:** Admin configures partner rows per checklist `step_id` (e.g. `closing:13`). Buyer sees placements on matching steps via `PartnerTransactionIntegration` and `ChecklistIntegrationSlot`.
- **Outbound tracking:** Partner CTAs use rev-share `/r/{link_id}` with step-view logging (`POST /api/v1/rev-share/step-views`).
- **RESPA:** Placement is brokerage-configured workflow surfacing; exposure logged via step views and click analytics — not agent referral fees. See `.cursor/rules/shared/respa-compliance.mdc`.

Detail: [`documentation/client/features/rev-share-partners.md`](../../client/features/rev-share-partners.md).

### Not built yet

- **`IntegrationTask` model** — no persisted provider task lifecycle or webhook-driven checklist auto-complete.
- **Partner completion webhooks** — partner clicks/views do not flip checklist state server-side; buyers/agents mark steps manually or via separate rules.
- **Loan / earnest money rails** — Plaid, lender APIs, and payment flows remain planned (see `documentation/transactions/options/08-financial-integrations.md`).

### Target model (future)

`IntegrationTask` with `provider_key` (e.g. `loan_provider_x`, `plaid_earnest`), status transitions from webhooks/polling, and checklist items with `completion_type: integration_based`. Reuse existing HTTP + secrets patterns under `Server/app/services/`; emit notifications through the pipeline in [08-notifications.md](./08-notifications.md).
