# Documents feature package

DocuSign e-signature integration for real estate agreements. **Canonical product doc:** [documentation/features/transaction-management/docusign-integration.md](../../../../documentation/features/transaction-management/docusign-integration.md). **Server API/ops:** [Server/app/services/docusign/docs/README.md](../../../../Server/app/services/docusign/docs/README.md).

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

- [DocuSign integration doc](../../../../documentation/features/transaction-management/docusign-integration.md)
- [Transactions: documents + S3](../../../../REMOVED — see documentation/features/integrations/09-documents-docusign-and-s3.md)
