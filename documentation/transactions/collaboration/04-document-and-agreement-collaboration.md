> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [docusign-integration.md](../../client/features/docusign-integration.md), [messaging.md](../../client/features/messaging.md).

## Document and agreement collaboration

Documents and DocuSign agreements are shared between **buyer and agent** via the documents library, checklist forms, and messaging attachments—not a multi-party transaction document ACL.

### Shipped

- **Library:** List/upload agreements and reports; agent DocuSign widget and embedded signing.
- **Checklist forms:** Agent sends PDF forms via DocuSign, messaging, or both (`checklist_forms.send_form`).
- **Messaging shares:** Agents send `shared_document_id` / checklist-form attachments in chat; buyers receive cards in thread.
- **Signature completion:** Webhook-driven checklist auto-complete for signature-based items.

### Gaps

- No transaction-scoped document library for TC/lender/escrow roles.
- No checklist↔document link visualization across milestones.

### Code pointers

| Area | Path |
| ---- | ---- |
| Documents feature | `Client/packages/features/documents/` |
| Send for signature | `Client/packages/features/documents/hooks/store/signature/documentsSendForSignature.ts` |
| Checklist form send | `Server/app/routes/checklist_forms.py` — `send_form` |
| Shared doc in chat | `Client/packages/features/messaging/components/cards/SharedDocumentCard.tsx` |
| Send message w/ attachment | `Server/app/routes/agent/handlers/chats.py` — `send_message` |
| Agreement models | `Server/app/models/documents/` |
| DocuSign webhook → checklist | `Server/app/services/docusign/webhooks/processor.py` |
