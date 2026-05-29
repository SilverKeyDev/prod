> **Status:** Shipped  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/services/docusign/`; `Server/app/celery/tasks/docusign.py`; `Client/packages/features/documents/`; [`documentation/client/features/docusign-integration.md`](../../client/features/docusign-integration.md)

## Documents, DocuSign, and S3

### Roles

- **DocuSign** — e-signature: envelopes, embedded signing, template sync, Connect webhooks.
- **S3** — blob storage for uploads, agreement revisions (`AgreementRevision.file_path`), and completed artifacts (`signed_document_path`, `certificate_path` on `Agreement`).

### Flows

1. **System/admin:** JWT auth for template sync and system operations.
2. **Agent:** OAuth connect (`/api/v1/docusign/oauth/*`); sends from the agent's DocuSign account.
3. **Signing:** Envelope created/sent; embedded or email signing per recipient config.
4. **Status:** Connect webhooks update agreement state; Celery fetches completed PDFs and writes to S3.

### Canonical backend guide

Environment variables, routes, auth diagrams, troubleshooting:

- [`Server/app/services/docusign/docs/README.md`](../../../Server/app/services/docusign/docs/README.md)

### Checklist linkage

Agreements are the signature source of truth. Checklist steps link via `AgreementLink` (`linked_item_id` e.g. `closing.2`); signature-based steps auto-complete when agreement status is `completed` — see [07-signing-review-and-completion.md](./07-signing-review-and-completion.md).

Checklist form send from the client: `Client/packages/features/checklists/components/steps/ChecklistStepForms.tsx` → `documentsSendForSignature.ts`.

### Provider abstraction

`Server/app/services/docusign/signature/base.py` defines `SignatureProvider`; production path uses the DocuSign service layer, not a separate generic stack.

### Form catalogs (out of scope unless configured)

Brokerage form vendors (FMLS, eXp API, etc.) are product-specific add-ons. Default v1 path is **upload → agreement revision → DocuSign → S3**.
