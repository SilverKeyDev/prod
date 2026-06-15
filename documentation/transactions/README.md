> **Status:** partial
> **Last verified:** 2026-06-04
> **Canonical shipped docs:** [checklists.md](../client/features/checklists.md), [checklists-integrations.md](../client/features/checklists-integrations.md), [docusign-integration.md](../client/features/docusign-integration.md), [workspace.md](../client/features/workspace.md), [partners.md](../client/features/partners.md), [rev-share-partners.md](../client/features/rev-share-partners.md), [messaging.md](../client/features/messaging.md).

## Checklist-Driven Transactions

Design and implementation reference for transactions managed through checklists, calendar, documents, and agent collaboration. Each doc includes a **Status** banner (Shipped / Partial / Planned).

**Partner checklist steps:** Use `partner_placements` + `PartnerTransactionIntegration` (admin rev-share rows per `step_id`, e.g. `closing:13`).

### Subfolders

| Folder | Contents |
|--------|----------|
| [overview/](./overview/) | Scope, domain model, user flows |
| [mechanics/](./mechanics/) | Checklist generation, location enrichment, deadlines |
| [integrations/](./integrations/) | Calendar, DocuSign/S3, partner placements, notifications |
| [collaboration/](./collaboration/) | Participants, permissions, sharing |
| [timeline/](./timeline/) | Transaction phases and deadlines |
| [options/](./options/) | Design tradeoffs and v1 recommendations |

See [overview/00-scope-and-non-goals.md](./overview/00-scope-and-non-goals.md), [10-implementation-order.md](./10-implementation-order.md), and [11-implementation-timeline.md](./11-implementation-timeline.md).
