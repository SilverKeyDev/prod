> **Status:** Partial  
> **Last verified:** 2026-05-28  
> **Code pointers:** `Server/app/services/transactions/checklist_signature_completion.py`; `Server/app/models/documents/agreement_link.py`; `Client/packages/features/documents/`; `Client/packages/features/checklists/hooks/useChecklistStepSigningFooter.tsx`

## Signing, review, and checklist completion

### Shipped today

- **Agreements + DocuSign:** Models in `Server/app/models/documents/agreement.py`; service layer under `Server/app/services/docusign/`; Connect webhooks update status; completed PDFs land in S3 (see [09-documents-docusign-and-s3.md](./09-documents-docusign-and-s3.md)).
- **`AgreementLink`:** Links `transaction_id`, `agreement_id`, and checklist step (`linked_item_type=checklist_item`, `linked_item_id` like `offer.3`). Created from checklist form send and document routes (`Server/app/routes/checklist_documents.py`, `Server/app/services/documents/forms_service.py`).
- **Signature-based checklist completion:** Items with `completion_type: signature_based` auto-check when a linked agreement reaches `status=completed` (`checklist_signature_completion.py`). Manual toggles for those steps are stripped when unsigned.
- **Client signing UX:** Send for signature, embedded signing (`EmbeddedSigning`), checklist step signing footer, agenda signing to-dos. Integration hook: `useDocumentsDataIntegration` + `useChecklistStepSigningFooter`.
- **In-app notifications (narrow):** DocuSign lifecycle posts deduped messages into agent–buyer chat (`Server/app/services/docusign/notifications/messaging.py`).

Client detail: [`documentation/client/features/docusign-integration.md`](../../client/features/docusign-integration.md).

### Partial / not built

- **`signature_plus_review`:** Present in OpenAPI/checklist item metadata; no server review-state engine or dedicated review UI yet.
- **Integration-completed signals:** No `IntegrationTask` model; partner placement steps do not auto-complete the checklist from partner webhooks — see [12-financial-and-service-integrations.md](./12-financial-and-service-integrations.md).
- **Transaction-scoped signing UX:** Flows work per buyer/agreement; not every surface passes explicit transaction context end-to-end.

### Invariants (target)

- `signature_based` steps: completion driven by agreement status, not manual checkbox (enforced server-side on merge).
- Future `signature_plus_review`: requires terminal agreement status **and** role-based review approval.
