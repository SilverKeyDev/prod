> **Status:** Planned | **Last verified:** 2026-05-28

> **Shipped feature docs:** [partners.md](../../client/features/partners.md), [rev-share-partners.md](../../client/features/rev-share-partners.md).

## Compliance data and timeline APIs

Compliance-critical deadlines are **not tagged** on milestones or checklist items. Product copy and external resource links carry regulatory context today.

### Current behavior

- Checklist items link to CFPB, USA.gov, and similar resources in `resource.href` fields.
- DocuSign and RESPA partner placement follow separate integration/compliance docs.
- Server `milestones` table was dropped in migration `a02ed1527a24`; no replacement milestone API.

### Planned

- `is_compliance_critical` and `compliance_reference` on computed deadlines.
- Notification priority for disclosure and reporting windows.
- Vendor/legal content feeding `JurisdictionRuleSet` (see `09-state-variation-model.md`).

### Code pointers

| Area | Path |
| ---- | ---- |
| Resource links in items | `Server/app/services/transactions/closing/items.py`, `escrow/items.py` |
| Broader compliance doc | `documentation/transactions/integrations/10-compliance-data-and-apis.md` |
| RESPA partner rules | `.cursor/rules/shared/respa-compliance.mdc` |
| Notifications (messaging only today) | `documentation/transactions/collaboration/08-notification-preferences-and-routing.md` |
