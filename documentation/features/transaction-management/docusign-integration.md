# DocuSign e-signature integration

SilverKey enables agents to send e-signature agreements to buyers, track signing progress, and store completed PDFs (DocuSign + S3).

> **Code pointers:** `Client/packages/features/documents/`, `Server/app/services/docusign/`  
> **Server API detail:** [Server/app/services/docusign/docs/README.md](../../../Server/app/services/docusign/docs/README.md)

## Flow

```
Agent creates agreement → PDF upload → send for signature → buyer signs → webhook → signed PDF in S3
```

## Agent setup (one-time OAuth)

1. Agent connects DocuSign in settings.
2. `GET /api/v1/docusign/oauth/start` → redirect to DocuSign.
3. Callback stores token in `DocusignOAuthToken`.

Client: `docusignApi.startOAuth()` from `packages/features/documents`.

## Core operations

| Step | Client | Server |
|------|--------|--------|
| Create draft agreement | Documents UI + hooks | Agreement lifecycle service |
| Upload PDF | Multipart to agreements API | S3 + envelope builder |
| Send for signature | Send action in UI | DocuSign envelope API |
| Embedded signing | `EmbeddedSigning` component | Signing URL endpoint |
| Status updates | React Query refetch | DocuSign Connect webhook |
| View signed PDF | `ViewSignedDocument` | Presigned S3 URL |

## Embedded signing

```typescript
import { EmbeddedSigning } from "packages/features/documents";

<EmbeddedSigning
  agreementId={agreementId}
  participantId={participantId}
  onComplete={onSigned}
/>
```

## Checklist integration

Checklist items can link to agreements (`AgreementLink`). Signature completion can auto-complete checklist steps via checklist + DocuSign wiring in this feature package.

## RESPA / compliance

Agreement flows are transaction workflow tools, not partner placement. Partner marketplace placement (rev-share partners, lenders) is separate — see [rev-share-partners.md](./rev-share-partners.md) and `CLAUDE.md` RESPA section.

## Environment

DocuSign keys and OAuth redirect URIs: `Server/.env.example`. Never log tokens or envelope PII — use `packages/logger` / `Server/logger`.

## Related docs

| Doc | Topic |
|-----|-------|
| [checklists.md](./checklists.md) | Checklist UI and tasks |
| [Server/.../docusign/docs/README.md](../../../Server/app/services/docusign/docs/README.md) | API, webhooks, tabs |
| `.cursor/rules/shared/security.mdc` | Upload and token rules |
