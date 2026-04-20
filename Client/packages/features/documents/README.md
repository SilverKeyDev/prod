# Documents Feature

## Overview

The Documents feature provides DocuSign e-signature integration for real estate agreements in the SilverKey platform. It enables agents to create, send, track, and manage legally binding digital agreements with buyers.

## Architecture

```
documents/
├── api/              # DocuSign API client
├── components/       # UI: agreement/, docusign/, forms/
├── hooks/
│   ├── data/        # React Query hooks for server state
│   ├── store/       # Zustand store integration hooks
│   └── ui/          # UI state management hooks
├── types/           # TypeScript type definitions
├── utils/           # Helper functions and utilities
└── index.ts         # Public API exports
```

## Components

### EmbeddedSigning

Displays the DocuSign embedded signing iframe for document signing.

**Location**: `components/docusign/EmbeddedSigning.tsx`

**Props**:

```typescript
{
  agreementId: string;        // Agreement ID to sign
  participantId: string;      // Participant ID (who is signing)
  onComplete?: () => void;    // Callback after signing completes
  height?: string;            // Iframe height (default: "600px")
}
```

**Usage**:

```typescript
import { EmbeddedSigning } from "packages/features/documents";

<EmbeddedSigning
  agreementId="agreement-123"
  participantId="participant-456"
  onComplete={() => {
    // Refresh agreement list or redirect
    console.log("Signing complete!");
  }}
  height="700px"
/>
```

**Features**:

- Fetches signing URL automatically
- Displays DocuSign signing interface in iframe
- Listens for completion events via postMessage
- Shows loading state while fetching URL
- Error handling with user-friendly messages

### DocuSignWidget

Dashboard widget showing pending signatures and recent agreements.

**Location**: `components/docusign/DocuSignWidget.tsx`

**Props**: None (standalone widget)

**Usage**:

```typescript
import { DocuSignWidget } from "packages/features/documents";

// In dashboard
<DocuSignWidget />
```

**Features**:

- Summary stats (pending, completed, voided)
- Pending signatures with urgency indicators
- Recent agreements list
- Click to view agreement details
- Create new agreement button
- Navigate to full agreements list

### Additional Components (in git staging)

Check `git status` for other staged components:

- Agreement detail modals
- Agreement status badges
- Create agreement modal
- Document cards

## Hooks

### Data Hooks (React Query)

#### useDocusignAgreements

Fetches and manages the list of agreements for the current user.

**Location**: `hooks/data/useDocusignAgreements.ts`

**Returns**:

```typescript
{
  agreements: Agreement[];           // List of agreements
  isLoading: boolean;                // Loading state
  error: string | null;              // Error message if failed
  refetchAgreements: () => Promise;  // Manual refetch function
}
```

**Usage**:

```typescript
import { useDocusignAgreements } from "packages/features/documents";

function MyComponent() {
  const { agreements, isLoading, error } = useDocusignAgreements();

  if (isLoading) return <Loader />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {agreements.map(agreement => (
        <AgreementCard key={agreement.id} agreement={agreement} />
      ))}
    </div>
  );
}
```

**Notes**:

- Automatically gated on authentication
- Uses React Query caching
- Auto-refetches on focus/reconnect

#### useDocusignAgreement

Fetches a single agreement by ID.

**Location**: `hooks/data/useDocusignAgreement.ts`

**Signature**:

```typescript
useDocusignAgreement(agreementId: string | null): {
  agreement: Agreement | null;
  isLoading: boolean;
  error: string | null;
  refetchAgreement: () => Promise;
}
```

**Usage**:

```typescript
const { agreement, isLoading } = useDocusignAgreement(agreementId);
```

#### useDocusignActions

Provides mutation operations for agreements (create, send, void, etc.).

**Location**: `hooks/data/useDocusignActions.ts`

**Returns**:

```typescript
{
  // Mutations
  createAgreement: (data: CreateAgreementRequest) => Promise<Agreement>;
  createRevision: (params: { agreementId; file; notes? }) =>
    Promise<AgreementRevision>;
  sendAgreement: (params: {
    agreementId;
    signing_method?;
    participant_user_id?;
  }) => Promise<SendAgreementResponse>;
  voidAgreement: (params: { agreementId; reason? }) =>
    Promise<VoidAgreementResponse>;
  getSigningUrl: (params: { agreementId; participantId }) => Promise<string>;
  syncTemplates: () => Promise<SyncTemplatesResponse>;

  // Loading states
  isCreatingAgreement: boolean;
  isCreatingRevision: boolean;
  isSendingAgreement: boolean;
  isVoidingAgreement: boolean;
  isGettingSigningUrl: boolean;
  isSyncingTemplates: boolean;
}
```

**Usage**:

```typescript
import { useDocusignActions } from "packages/features/documents";

function CreateAgreementForm() {
  const { createAgreement, isCreatingAgreement } = useDocusignActions();

  const handleSubmit = async (formData) => {
    try {
      const agreement = await createAgreement({
        title: formData.title,
        agreement_type: formData.type,
        buyer_id: formData.buyerId,
        property_address: formData.address,
      });
      console.log("Agreement created:", agreement.id);
    } catch (error) {
      console.error("Failed to create agreement:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isCreatingAgreement}>Create</button>
    </form>
  );
}
```

**Notes**:

- All mutations automatically invalidate relevant queries
- Optimistic updates where applicable
- Comprehensive error handling

#### useDocusignTemplates

Fetches available DocuSign templates (agent-only).

**Location**: `hooks/data/useDocusignTemplates.ts`

**Returns**:

```typescript
{
  templates: DocusignTemplate[];
  isLoading: boolean;
  error: string | null;
  refetchTemplates: () => Promise;
}
```

**Usage**:

```typescript
const { templates, isLoading } = useDocusignTemplates();
```

**Notes**:

- Agent-only hook (won't fetch for buyers)
- Automatically gated on agent status
- Use syncTemplates() to refresh from DocuSign

### UI Hooks

#### useSavedHomesDocuSign

Platform-specific hook for SavedPage DocuSign integration.

**Locations**:

- `hooks/ui/useSavedHomesDocuSign.ts` (web)
- `hooks/ui/useSavedHomesDocuSign.native.ts` (mobile)
- `hooks/ui/useSavedHomesDocuSignCore.ts` (shared logic)

**Returns**:

```typescript
{
  isCreateAgreementModalOpen: boolean;
  setIsCreateAgreementModalOpen: (open: boolean) => void;
  selectedAgreementId: string | null;
  setSelectedAgreementId: (id: string | null) => void;
  handleAgreementClick: (agreementId: string) => void;
  handleAgreementSend: (agreementId: string) => Promise<void>;
  handleAgreementVoid: (agreementId: string) => Promise<void>;
  handleCreateAgreementSuccess: (agreementId: string) => void;
}
```

**Usage**:

```typescript
import { useSavedHomesDocuSign } from "packages/features/documents";

function SavedPage() {
  const {
    selectedAgreementId,
    handleAgreementClick,
    handleAgreementSend,
    handleAgreementVoid,
  } = useSavedHomesDocuSign();

  return (
    <div>
      {agreements.map(agreement => (
        <AgreementCard
          key={agreement.id}
          agreement={agreement}
          onClick={() => handleAgreementClick(agreement.id)}
          onSend={() => handleAgreementSend(agreement.id)}
          onVoid={() => handleAgreementVoid(agreement.id)}
        />
      ))}
    </div>
  );
}
```

## Types

### Core Types

```typescript
// Agreement
type Agreement = {
  id: string;
  status: AgreementStatus;
  title: string;
  description?: string;
  agent_id: string;
  buyer_id: string;
  current_revision_id?: string;
  docusign_envelope_id?: string;
  docusign_status?: string;
  property_address?: string;
  agreement_type: AgreementType;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  completed_at?: string;
  voided_at?: string;
  signed_document_path?: string;
  certificate_path?: string;
  participants?: AgreementParticipant[];
  events?: AgreementEvent[];
  current_revision?: AgreementRevision;
};

// Status types
type AgreementStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "voided"
  | "declined";

type AgreementType =
  | "buyer_representation"
  | "offer"
  | "inspection_addendum"
  | "financing_contingency"
  | "closing_disclosure"
  | "other";

// Participant
type AgreementParticipant = {
  id: string;
  agreement_id: string;
  user_id: string;
  email: string;
  name: string;
  role: ParticipantRole;
  routing_order: number;
  status?: ParticipantStatus;
  recipient_status?: string;
  signed_at?: string;
  declined_reason?: string;
};

type ParticipantRole =
  | "agent"
  | "buyer"
  | "seller"
  | "signer"
  | "carbon_copy"
  | "other";

type ParticipantStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "declined";

// Revision
type AgreementRevision = {
  id: string;
  agreement_id: string;
  version_number: number;
  filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  notes?: string;
  created_by: string;
  created_at: string;
};
```

## Utilities

### docusignHelpers.ts

Helper functions for DocuSign UI components.

**Functions**:

- `getAgreementTypeLabel(type)` - Human-readable agreement type
- `getStatusColor(status)` - Tailwind color classes for status badge
- `getStatusLabel(status)` - Human-readable status
- `getStatusTooltip(status)` - Status description
- `canUserSign(agreement, userId)` - Check if user can sign
- `canUserSend(agreement, userId, isAgent)` - Check if user can send
- `canUserVoid(agreement, userId, isAgent)` - Check if user can void
- `canUserCreateRevision(agreement, userId, isAgent)` - Check if user can create revisions
- `formatParticipantRole(role)` - Format role for display
- `calculateSigningProgress(participants)` - Calculate % signed
- `getParticipantStatusColor(status)` - Color for participant status
- `formatAgreementDate(dateString)` - Format date (MMM DD, YYYY)
- `formatAgreementDateTime(dateString)` - Format date with time
- `daysSinceSent(sentAt)` - Calculate days since sent
- `getUrgencyLevel(daysWaiting)` - Urgency level (low/medium/high)
- `getUrgencyColor(urgency)` - Color for urgency indicator

**Usage**:

```typescript
import {
  getStatusLabel,
  canUserSign,
  formatAgreementDate,
} from "packages/features/documents/utils/docusignHelpers";

const statusLabel = getStatusLabel(agreement.status); // "Sent"
const canSign = canUserSign(agreement, currentUserId); // true/false
const formattedDate = formatAgreementDate(agreement.sent_at); // "Jan 15, 2024"
```

## API Client

### docusignApi

Low-level API client for DocuSign endpoints.

**Location**: `api/docusign.ts`

**Methods**:

- `createAgreement(data)` - Create new agreement
- `getAgreement(agreementId)` - Get agreement by ID
- `listAgreements()` - List all agreements
- `createRevision(agreementId, file, notes?)` - Upload PDF revision
- `sendAgreement(agreementId, data?)` - Send for signature
- `voidAgreement(agreementId, data?)` - Void agreement
- `getSigningUrl(agreementId, data)` - Get embedded signing URL
- `getSenderViewUrl(agreementId)` - Get sender view URL (agent management)
- `listTemplates()` - List available templates
- `syncTemplates()` - Sync templates from DocuSign
- `startOAuth()` - Start OAuth connection flow

**Usage**:

```typescript
import { docusignApi } from "packages/features/documents/api/docusign";

// Direct API usage (prefer hooks instead)
const response = await docusignApi.createAgreement({
  title: "Purchase Agreement",
  agreement_type: "offer",
  buyer_id: "buyer-123",
});
```

**Note**: Prefer using hooks (`useDocusignActions`) over direct API calls for automatic cache invalidation and loading states.

## Usage Examples

### Complete Agreement Creation Flow

```typescript
import {
  useDocusignActions,
  useDocusignAgreements,
  EmbeddedSigning,
} from "packages/features/documents";

function AgreementWorkflow() {
  const { createAgreement, createRevision, sendAgreement } = useDocusignActions();
  const { refetchAgreements } = useDocusignAgreements();
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showSigning, setShowSigning] = useState(false);

  // Step 1: Create agreement
  const handleCreate = async () => {
    const agreement = await createAgreement({
      title: "Purchase Offer - 123 Main St",
      agreement_type: "offer",
      buyer_id: selectedBuyerId,
      property_address: "123 Main St, City, State",
    });
    setAgreementId(agreement.id);
  };

  // Step 2: Upload PDF
  const handleUploadPDF = async (file: File) => {
    if (!agreementId) return;
    await createRevision({
      agreementId,
      file,
      notes: "Initial offer document",
    });
  };

  // Step 3: Send for signature
  const handleSend = async () => {
    if (!agreementId) return;
    const response = await sendAgreement({
      agreementId,
      signingMethod: "embedded", // or "email"
    });
    // Get participant ID from agreement
    setParticipantId(response.participant_id);
    setShowSigning(true);
  };

  // Step 4: Sign document
  if (showSigning && agreementId && participantId) {
    return (
      <EmbeddedSigning
        agreementId={agreementId}
        participantId={participantId}
        onComplete={async () => {
          await refetchAgreements();
          setShowSigning(false);
          // Show success message
        }}
      />
    );
  }

  return (
    <div>
      <button onClick={handleCreate}>Create Agreement</button>
      {agreementId && <FileUpload onUpload={handleUploadPDF} />}
      {agreementId && <button onClick={handleSend}>Send for Signature</button>}
    </div>
  );
}
```

### Viewing and Managing Agreements

```typescript
import { useDocusignAgreements } from "packages/features/documents";
import { getStatusLabel, getStatusColor } from "packages/features/documents/utils/docusignHelpers";

function AgreementsList() {
  const { agreements, isLoading } = useDocusignAgreements();

  if (isLoading) return <Loader />;

  return (
    <div>
      {agreements.map(agreement => (
        <div key={agreement.id} className="agreement-card">
          <h3>{agreement.title}</h3>
          <span className={getStatusColor(agreement.status)}>
            {getStatusLabel(agreement.status)}
          </span>
          <p>{agreement.property_address}</p>
          <p>Created: {formatAgreementDate(agreement.created_at)}</p>
        </div>
      ))}
    </div>
  );
}
```

## Integration with SavedPage

The documents feature integrates with SavedPage via `useSavedHomesDocuSign`:

```typescript
// In SavedPage
import { useSavedHomesDocuSign } from "packages/features/documents";

function SavedPage() {
  const docusign = useSavedHomesDocuSign();

  return (
    <div>
      <button onClick={() => docusign.setIsCreateAgreementModalOpen(true)}>
        Create Agreement
      </button>

      {/* Agreement list with actions */}
      {agreements.map(agreement => (
        <AgreementCard
          key={agreement.id}
          agreement={agreement}
          onSend={() => docusign.handleAgreementSend(agreement.id)}
          onVoid={() => docusign.handleAgreementVoid(agreement.id)}
        />
      ))}
    </div>
  );
}
```

## Backend Integration

For backend API documentation, see:

- **Service API**: `Server/app/services/docusign/README.md`
- **API Reference**: `Server/app/services/docusign/API_REFERENCE.md` (if exists)
- **Testing**: `Server/app/services/docusign/TESTING.md` (if exists)

## References

- **Backend DocuSign Service**: [`Server/app/services/docusign/README.md`](../../../../Server/app/services/docusign/README.md)
- **DocuSign API Docs**: https://developers.docusign.com/docs/esign-rest-api/
- **Tab Configuration**: [`Server/app/services/docusign/TABS.md`](../../../../Server/app/services/docusign/TABS.md)
- **Architecture**: `documentation/client/docusign-integration.md` (if exists)

## Support

For issues or questions:

1. Check this README
2. Review backend service documentation
3. Check DocuSign API logs
4. Contact team lead
