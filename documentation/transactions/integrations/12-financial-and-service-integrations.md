> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Client/packages/features/partners/` (Move Concierge embed + rev-share); `Client/packages/features/checklists/components/integrations/componentRegistry.ts` (`home_concierge`); [`documentation/client/features/rev-share-partners.md`](../../client/features/rev-share-partners.md)

## Financial and service integrations

**Naming:** Legacy specs say "HomeConcierge"; the live partner is **Move Concierge** (slug `move-concierge`, checklist component key `home_concierge`).

### Shipped today — Move Concierge

- **Brokerage marketplace placement:** Admin configures partner rows per checklist `step_id` (e.g. `closing:13`). Buyer sees placements on matching steps via `PartnerTransactionIntegration` and `ChecklistIntegrationSlot`.
- **Embed + redirect:** Move Concierge iframe URL built with buyer prefill (`useMoveConciergeEmbedUrl`, `packages/features/partners/utils/moveConciergeEmbed.ts`); other partners use rev-share `/r/{link_id}` click tracking.
- **RESPA:** Placement is brokerage-configured workflow surfacing; exposure logged via step views and click analytics — not agent referral fees. See `.cursor/rules/shared/respa-compliance.mdc`.

Detail: [`documentation/client/features/rev-share-partners.md`](../../client/features/rev-share-partners.md).

### Not built yet

- **`IntegrationTask` model** — no persisted provider task lifecycle or webhook-driven checklist auto-complete.
- **Partner completion webhooks** — Move Concierge completion does not flip checklist state server-side; buyers/agents mark steps manually or via separate rules.
- **Loan / earnest money rails** — Plaid, lender APIs, and payment flows remain planned (see `documentation/transactions/options/08-financial-integrations.md`).

### Target model (future)

`IntegrationTask` with `provider_key` (`move_concierge`, `loan_provider_x`, `plaid_earnest`), status transitions from webhooks/polling, and checklist items with `completion_type: integration_based`. Reuse existing HTTP + secrets patterns under `Server/app/services/`; emit notifications through the pipeline in [08-notifications.md](./08-notifications.md).
