## Documents, DocuSign, and S3

### Roles

- **DocuSign** is the **e-signature provider**: envelopes, embedded signing, template sync, and status via the Connect webhook.
- **S3** is **blob storage** for:
  - General user uploads (e.g. secure document upload flows).
  - **Agreement revisions** — each revision stores an S3 key in `AgreementRevision.file_path` (`Server/app/models/documents/agreement_revision.py`).
  - **Completed agreements** — combined signed PDF and certificate paths on `Agreement` (`signed_document_path`, `certificate_path`) after DocuSign completion processing (`Server/app/models/documents/agreement.py`).

### Flows (high level)

1. **System / admin**: JWT-based DocuSign auth for template sync and system operations.
2. **Agent**: OAuth connect (`/api/v1/docusign/oauth/*`); sends agreements from the agent’s DocuSign account.
3. **Signing**: Envelope created/sent; recipients sign (including embedded signing where configured).
4. **Status**: Connect webhooks update agreement state; Celery tasks can fetch completed documents and upload PDFs to S3 (see `Server/app/celery/tasks/docusign.py`).

### Implementation detail

For environment variables, route list, auth diagrams, and troubleshooting, use the canonical backend guide:

- [`Server/app/services/docusign/README.md`](../../../Server/app/services/docusign/README.md)

### Checklist-driven transactions

Agreements remain the **system of record** for signature state; checklist items and milestones link to agreements via concepts described in `integrations/07-signing-review-and-completion.md` (e.g. `AgreementLink` linking `transaction_id`, `agreement_id`, and checklist/milestone targets). Completion rules stay **signature-based** or **signature plus review** as in that doc.

### Form sources (v1)

Brokerage-specific **form catalogs** may still be integrated via **FMLS** and/or **eXp API** where product configuration requires it. The documented v1 **documents and signing** path is **DocuSign** plus **S3**; other brokerage form vendors are out of scope unless added explicitly to the product map.

### Provider abstraction

`Server/app/services/signature/base.py` defines `SignatureProvider` and `NoOpSignatureProvider` when signing is not configured. Prefer the **DocuSign service layer** under `Server/app/services/docusign/` for real sends, webhooks, and storage orchestration.
