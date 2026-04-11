## Checklist-Driven Transactions

This folder is the **single source of truth** for making SilverKey transactions fully managed through checklists, calendar, documents, and agent collaboration.

It describes:
- **Domain model and flows** for multi-transaction buyers and agents.
- **Mechanics** for checklist generation, location enrichment, and milestone/deadline calculation.
- **Integrations** with calendar, documents (DocuSign + S3), HomeConcierge, and future financial rails.
- **Collaboration** between buyers, agents, TCs, loan officers, and other roles.
- **Timeline phases** (earnest money, inspections, financing, title, closing, move-in) and how deadlines vary by jurisdiction.
- **Design options/tradeoffs** and the recommended v1 path.

### Subfolders

- `overview/` – high-level scope, domain model, and user flows.
- `mechanics/` – checklist generation, location enrichment, and deadline/milestone engine.
- `integrations/` – calendar, documents, signing (DocuSign + S3), concierge, and financial integrations. See `integrations/09-documents-docusign-and-s3.md` for documents and e-sign storage; optional brokerage form catalogs may use **FMLS** and/or **eXp API** where configured. Server implementation detail: `Server/app/services/docusign/README.md`.
- `collaboration/` – participants, roles/permissions, sharing, audit trail, notifications routing.
- `timeline/` – step-by-step phases with required data and deadlines, including state-by-state variation.
- `options/` – design tradeoff docs and recommended approaches.

See `overview/00-scope-and-non-goals.md` for the top-level problem statement, `10-implementation-order.md` for the recommended build sequence, and `11-implementation-timeline.md` for the implementation timeline.
