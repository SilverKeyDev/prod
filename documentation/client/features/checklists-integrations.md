# Checklist integrations (Move Concierge and partners)

> **Status:** Partial — Move Concierge embed shipped; other financial integrations planned  
> **Last verified:** 2026-05-28  
> **Code:** `Client/packages/features/checklists/components/integrations/`, `Client/packages/features/partners/`

## Move Concierge (shipped)

- Live partner: **Move Concierge** (revenue-share; checklist embed).
- Integration key in code: `home_concierge` (legacy name).
- Placement via brokerage rev-share marketplace — not buyer-personalized steering.

### RESPA boundary

Partner surfacing is **brokerage-level marketplace placement**, not agent referral kickbacks. See [CLAUDE.md](../../../CLAUDE.md) and [`.cursor/rules/shared/respa-compliance.mdc`](../../../.cursor/rules/shared/respa-compliance.mdc). Log partner exposure events; no opaque agent compensation tied to steering.

## Completeness

Checklist integration completeness utilities: `checklists/utils/integration/checklistIntegrationCompleteness.ts`.

## Related

| Doc | Topic |
|-----|-------|
| [rev-share-partners.md](./rev-share-partners.md) | Admin placement, click tracking |
| [transactions/integrations/12-financial-and-service-integrations.md](../../transactions/integrations/12-financial-and-service-integrations.md) | Financial rails (planned) |
