## Checklist-Driven Transactions

Design and implementation reference for transactions managed through checklists, calendar, documents, and agent collaboration. Each doc includes a **Status** banner (Shipped / Partial / Planned).

**Naming:** Legacy specs may say "HomeConcierge"; the live partner integration is **Move Concierge**.

### Subfolders

| Folder | Contents |
|--------|----------|
| [overview/](./overview/) | Scope, domain model, user flows |
| [mechanics/](./mechanics/) | Checklist generation, location enrichment, deadlines |
| [integrations/](./integrations/) | Calendar, DocuSign/S3, Move Concierge, notifications |
| [collaboration/](./collaboration/) | Participants, permissions, sharing |
| [timeline/](./timeline/) | Transaction phases and deadlines |
| [options/](./options/) | Design tradeoffs and v1 recommendations |

See [overview/00-scope-and-non-goals.md](./overview/00-scope-and-non-goals.md), [10-implementation-order.md](./10-implementation-order.md), and [11-implementation-timeline.md](./11-implementation-timeline.md).
