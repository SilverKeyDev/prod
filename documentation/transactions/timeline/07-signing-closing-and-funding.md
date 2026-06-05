> **Status:** Partial | **Last verified:** 2026-05-28

> **Shipped feature docs:** [checklists.md](../../client/features/checklists.md), [docusign-integration.md](../../client/features/docusign-integration.md).

## Signing, closing, and funding

Closing workflow is **checklist + DocuSign**: sign documents, send funds, walkthrough, confirm recording. No closing-readiness dashboard or funding/recording milestones.

### Shipped

- Closing checklist (`closing/items.py`): walkthrough, sign closing docs (`completion_type: signature_based`), send funds, receive keys.
- DocuSign embedded signing, webhooks, in-app agreement cards in messaging.
- Calendar reminders on checkoff for time-sensitive closing steps.

### Gaps

- No `closing_appointment`, `funding_complete`, or `recording_complete` milestone records.
- No aggregated "closing readiness" view across docs/funds/title.

### Code pointers

| Area | Path |
| ---- | ---- |
| Closing items | `Server/app/services/transactions/closing/items.py` |
| Embedded signing | `Client/packages/features/documents/components/docusign/EmbeddedSigning.tsx` |
| Webhook → messages | `Server/app/services/docusign/webhooks/processor.py` |
| Agreement event card | `Client/packages/features/messaging/components/cards/AgreementEventCard.tsx` |
| Closing UI | `Client/packages/features/checklists/components/subheaders/ClosingMovingIn.tsx` |
