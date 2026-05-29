# Documents feature package

DocuSign e-signature integration for real estate agreements. **Canonical product doc:** [documentation/client/features/docusign-integration.md](../../../../documentation/client/features/docusign-integration.md). **Server API/ops:** [Server/app/services/docusign/docs/README.md](../../../../Server/app/services/docusign/docs/README.md).

## Layout

```
documents/
├── api/           # DocuSign API client
├── components/    # agreement/, docusign/, forms/
├── hooks/         # data/, store/, ui/
├── types/
└── index.ts       # Public exports
```

## Key exports

| Export | Purpose |
|--------|---------|
| `EmbeddedSigning` | DocuSign embedded signing iframe |
| `docusignApi` | OAuth, envelopes, signing URLs |
| Document store hooks | Agreement list and send-for-signature flows |

## Usage

```typescript
import { EmbeddedSigning } from "packages/features/documents";

<EmbeddedSigning
  agreementId={id}
  participantId={participantId}
  onComplete={() => refreshAgreements()}
/>
```

## Related

- [DocuSign integration doc](../../../../documentation/client/features/docusign-integration.md)
- [Transactions: documents + S3](../../../../documentation/transactions/integrations/09-documents-docusign-and-s3.md)
