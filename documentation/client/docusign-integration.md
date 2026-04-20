# DocuSign E-Signature Integration

## Overview

SilverKey's DocuSign integration enables agents to send legally binding e-signature agreements to buyers, track signing progress, and manage completed documents. The system supports both embedded signing (within the app) and email-based signing workflows.

## Architecture

### High-Level Flow

```
Agent Creates Agreement → Uploads PDF → Sends for Signature → Buyer Signs → DocuSign Webhook → System Updates Status → Fetch Signed PDF
```

### Component Diagram

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  ┌──────────────────────────────┐   │
│  │   DocuSign Widget            │   │
│  │   EmbeddedSigning Component  │   │
│  │   React Query Hooks          │   │
│  │   DocuSign API Client        │   │
│  └──────────────────────────────┘   │
└────────────────┬────────────────────┘
                 │ HTTP/REST API
┌────────────────┴────────────────────┐
│        Backend (Python/Flask)       │
│  ┌──────────────────────────────┐   │
│  │  API Routes                  │   │
│  │  AgreementLifecycleService   │   │
│  │  EnvelopeBuilder             │   │
│  │  DocuSignClient              │   │
│  │  WebhookProcessor            │   │
│  └──────────────────────────────┘   │
└────────────────┬────────────────────┘
                 │ REST API + Webhook
┌────────────────┴────────────────────┐
│         DocuSign Platform           │
│  - Envelope API                     │
│  - Signing Experience               │
│  - Connect (Webhooks)               │
│  - Templates API                    │
└─────────────────────────────────────┘
```

## Complete Workflow

### 1. Agent Setup (One-Time)

**OAuth Connection**: Agents must connect their DocuSign account before sending agreements.

**Flow**:
1. Agent clicks "Connect DocuSign" in settings
2. Frontend calls `/api/v1/docusign/oauth/start`
3. Backend generates OAuth URL with state token
4. Agent redirected to DocuSign authorization page
5. Agent grants access
6. DocuSign redirects back to `/api/v1/docusign/oauth/callback`
7. Backend exchanges authorization code for access token
8. Token stored in `DocusignOAuthToken` table

**Frontend Code**:
```typescript
import { docusignApi } from 'packages/features/documents';

// Start OAuth flow
const { auth_url } = await docusignApi.startOAuth();
window.location.href = auth_url; // Redirect to DocuSign
```

**Backend API**:
- `GET /api/v1/docusign/oauth/start` - Generate OAuth URL
- `GET /api/v1/docusign/oauth/callback` - Handle OAuth callback

### 2. Create Agreement (Draft)

**Purpose**: Create a new agreement container in draft status.

**Flow**:
1. Agent fills out agreement form (title, type, buyer, property address)
2. Frontend calls `createAgreement` mutation
3. Backend creates `Agreement` record with status "draft"
4. Backend creates initial `AgreementParticipant` for buyer (routing order 1)
5. Returns agreement ID

**Frontend Code**:
```typescript
import { useDocusignActions } from 'packages/features/documents';

const { createAgreement } = useDocusignActions();

const agreement = await createAgreement({
  title: 'Purchase Offer - 123 Main St',
  agreement_type: 'offer',
  buyer_id: selectedBuyerId,
  property_address: '123 Main St, City, State',
  description: 'Initial purchase offer'
});
```

**Backend API**:
- `POST /api/v1/docusign/agreements` - Create agreement

**Database**:
- Creates `Agreement` (status: "draft")
- Creates `AgreementParticipant` (role: "signer", routing_order: 1)

### 3. Upload Document Revision

**Purpose**: Add PDF document to the agreement.

**Requirements**:
- Must be valid PDF
- Should contain anchor text for signature placement:
  - "SIGN HERE" for signature fields
  - "DATE SIGNED" for date fields

**Flow**:
1. Agent uploads PDF via file input
2. Frontend calls `createRevision` mutation with file
3. Backend uploads PDF to S3
4. Backend creates `AgreementRevision` record (version 1)
5. Backend sets agreement's `current_revision_id`

**Frontend Code**:
```typescript
const { createRevision } = useDocusignActions();

const handleUpload = async (file: File) => {
  const revision = await createRevision({
    agreementId: agreement.id,
    file,
    notes: 'Initial offer document'
  });
  console.log('Revision', revision.version_number, 'uploaded');
};
```

**Backend API**:
- `POST /api/v1/docusign/agreements/{id}/revisions` - Upload revision

**S3 Storage**:
- Path: `docusign/agreements/{agreement_id}/revisions/{revision_id}.pdf`
- Stored with metadata (agreement_id, version_number)

### 4. Add Additional Signers (Multi-Signer - Optional)

**Purpose**: Add multiple signers for sequential signing workflow.

**Flow**:
1. Agent clicks "Add Signer" in agreement details
2. Frontend calls `addParticipant` with user ID and routing order
3. Backend creates additional `AgreementParticipant` records
4. Each signer gets a unique routing order (1, 2, 3...)

**Frontend Code**:
```typescript
// Add co-buyer as second signer (signs after buyer)
const cobuyer = await addParticipant({
  agreement_id: agreement.id,
  user_id: cobuyerId,
  role: 'signer',
  routing_order: 2
});
```

**Backend API**:
- `POST /api/v1/docusign/agreements/{id}/participants` - Add participant

**Sequential Signing**:
- Signer with routing_order=1 receives envelope first
- Signer with routing_order=2 receives email only after signer 1 completes
- Process continues sequentially through all signers

### 5. Send Agreement for Signature

**Purpose**: Create DocuSign envelope and send to participants.

**Flow**:
1. Agent clicks "Send for Signature"
2. Frontend calls `sendAgreement` mutation
3. Backend enqueues Celery task `send_envelope_task`
4. Task runs asynchronously:
   - Fetches PDF from S3
   - Encodes PDF to base64
   - Builds recipient list with signature tabs
   - Creates DocuSign envelope via API
   - Updates agreement status to "sent"
   - Stores DocuSign envelope ID

**Frontend Code**:
```typescript
const { sendAgreement } = useDocusignActions();

await sendAgreement({
  agreementId: agreement.id,
  signingMethod: 'embedded' // or 'email'
});

// Poll for status change
const { agreement } = await refetch();
if (agreement.status === 'sent') {
  // Ready to get signing URL
}
```

**Backend API**:
- `POST /api/v1/docusign/agreements/{id}/send` - Send agreement

**Celery Task**: `send_envelope_task`
- Runs in background (typical duration: 2-5 seconds)
- Creates envelope in DocuSign
- Updates database with envelope ID
- Handles errors (stores in agreement.error_message if failed)

**DocuSign Envelope Structure** (simplified; actual tab placement is coordinate-based on page 1 — see `Server/app/services/docusign/docs/TABS.md`):
```json
{
  "emailSubject": "Purchase Offer - 123 Main St",
  "status": "sent",
  "customFields": {
    "textCustomFields": [
      { "name": "agreement_id", "value": "<uuid>", "show": "true", "required": "false" },
      { "name": "buyer_id", "value": "<user id>", "show": "true", "required": "false" },
      { "name": "agent_id", "value": "<user id>", "show": "true", "required": "false" }
    ]
  },
  "documents": [
    {
      "documentId": "1",
      "name": "offer.pdf",
      "documentBase64": "<base64 PDF>"
    }
  ],
  "recipients": {
    "signers": [
      {
        "email": "buyer@example.com",
        "name": "John Buyer",
        "recipientId": "participant-123",
        "routingOrder": "1",
        "tabs": {
          "signHereTabs": [ { "pageNumber": "1", "xPosition": "100", "yPosition": "700" } ],
          "dateSignedTabs": [ { "pageNumber": "1", "xPosition": "300", "yPosition": "700" } ],
          "textTabs": [
            {
              "tabLabel": "printed_name",
              "value": "John Buyer",
              "pageNumber": "1",
              "xPosition": "100",
              "yPosition": "740",
              "required": "true"
            }
          ]
        }
      }
    ]
  }
}
```

### 6. Get Signing URL (Embedded Signing)

**Purpose**: Retrieve temporary URL for buyer to sign within the app.

**Flow**:
1. Frontend calls `getSigningUrl` with agreement ID and participant ID
2. Backend calls DocuSign `createRecipientView` API
3. DocuSign generates temporary signing URL (expires in ~5 minutes)
4. Frontend receives URL and displays in iframe

**Frontend Code**:
```typescript
const { getSigningUrl } = useDocusignActions();

const signingUrl = await getSigningUrl({
  agreementId: agreement.id,
  participantId: participant.id
});

// Display in EmbeddedSigning component
<EmbeddedSigning
  agreementId={agreement.id}
  participantId={participant.id}
  onComplete={() => {
    refetchAgreements();
  }}
/>
```

**Backend API**:
- `POST /api/v1/docusign/agreements/{id}/signing-url` - Get signing URL

**Security**:
- URL is single-use and time-limited
- Requires `clientUserId` match between envelope and view request
- Only participant or agent can request URL

### 7. Sign Document

**Purpose**: Buyer completes signing ceremony in DocuSign interface.

**Flow**:
1. Buyer clicks signature field in iframe
2. DocuSign displays signature adoption/drawing interface
3. Buyer signs and clicks "Finish"
4. DocuSign sends postMessage to iframe parent
5. Frontend listens for `signing_complete` event
6. Frontend triggers `onComplete` callback

**Frontend Code** (inside EmbeddedSigning):
```typescript
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.origin.includes("docusign")) {
      if (event.data === "signing_complete") {
        enqueueToast({ type: "success", message: "Signed!" });
        if (onComplete) onComplete();
      }
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [onComplete]);
```

**DocuSign Events**:
- `signing_complete` - Signing finished
- `ttl_expired` - Session expired
- `cancel` - User cancelled

### 8. Webhook Processing

**Purpose**: DocuSign notifies backend of envelope status changes.

**Flow**:
1. DocuSign sends webhook POST to `/api/v1/webhooks/docusign/connect`
2. Backend verifies HMAC signature for security
3. Backend stores event in `DocusignConnectEvent` table
4. Backend enqueues Celery task `process_envelope_event_task`
5. Task processes event:
   - Updates agreement status (sent → delivered → signed → completed)
   - Updates participant statuses
   - Creates timeline events
   - Enqueues document fetch if envelope completed

**Backend API**:
- `POST /api/v1/webhooks/docusign/connect` - Webhook receiver

**Webhook Verification**:
```python
import hmac
import hashlib

def verify_webhook(payload: bytes, signature: str) -> bool:
    secret = os.getenv("DOCUSIGN_USER_CONNECT_HMAC_SECRET")
    computed_sig = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).digest()
    expected = base64.b64decode(signature)
    return hmac.compare_digest(computed_sig, expected)
```

**Event Types**:
- `envelope-sent` - Envelope sent to recipients
- `envelope-delivered` - Recipient viewed envelope
- `recipient-completed` - Recipient signed
- `envelope-completed` - All recipients signed
- `envelope-voided` - Envelope cancelled

**Status Transitions**:
```
draft → sent → delivered → signed → completed
                                  ↓
                               voided
```

### 9. Fetch Signed Documents

**Purpose**: Download final signed PDF and certificate from DocuSign.

**Flow**:
1. Webhook indicates `envelope-completed`
2. Backend enqueues Celery task `fetch_envelope_documents_task`
3. Task calls DocuSign API to get combined signed PDF
4. Task uploads signed PDF to S3
5. Task gets certificate of completion from DocuSign
6. Task uploads certificate to S3
7. Task updates agreement with S3 paths

**Celery Task**: `fetch_envelope_documents_task`
```python
from app.services.docusign.core.client import DocusignClient

def fetch_envelope_documents_task(envelope_id: str, agreement_id: str):
    client = DocusignClient(auth_type="jwt")

    # Get combined PDF (includes all documents + signatures)
    result = client.get_envelope_documents(envelope_id)
    pdf_bytes = result["combined_pdf"]

    # Upload to S3
    s3_key = f"docusign/signed/{agreement_id}/combined.pdf"
    s3_client.put_object(
        Bucket=bucket,
        Key=s3_key,
        Body=pdf_bytes,
        ContentType="application/pdf"
    )

    # Update agreement
    agreement = Agreement.query.get(agreement_id)
    agreement.signed_document_path = s3_key
    db.session.commit()
```

**S3 Storage**:
- Signed PDF: `docusign/signed/{agreement_id}/combined.pdf`
- Certificate: `docusign/signed/{agreement_id}/certificate.pdf`

### 10. Download Signed Document

**Purpose**: Agent or buyer downloads completed signed PDF.

**Flow**:
1. User clicks "Download" in agreement details
2. Frontend calls `/api/v1/docusign/agreements/{id}/download`
3. Backend generates pre-signed S3 URL
4. Frontend redirects to S3 URL for download

**Frontend Code**:
```typescript
const handleDownload = async (agreementId: string) => {
  const response = await fetch(
    `/api/v1/docusign/agreements/${agreementId}/download`
  );
  const { download_url } = await response.json();
  window.location.href = download_url;
};
```

**Backend API**:
- `GET /api/v1/docusign/agreements/{id}/download` - Get download URL

## Error Handling

### Common Errors

#### 1. Agreement Not in Draft Status

**Error**: "Cannot send agreement with status: sent"

**Cause**: Trying to send an agreement that's already sent

**Solution**: Check agreement status before sending

#### 2. No Current Revision

**Error**: "Agreement has no current revision"

**Cause**: Trying to send without uploading PDF

**Solution**: Upload revision before sending

#### 3. DocuSign Connection Expired

**Error**: "Agent not connected to DocuSign"

**Cause**: OAuth token expired or revoked

**Solution**: Agent must reconnect via OAuth flow

#### 4. Webhook Verification Failed

**Error**: "Invalid signature"

**Cause**: Incorrect HMAC secret or payload modification

**Solution**: Verify HMAC secret in env vars matches DocuSign

#### 5. Signing URL Expired

**Error**: "Session expired"

**Cause**: Signing URL not used within 5 minutes

**Solution**: Request new signing URL

## Frontend Components

### DocuSignWidget

**Purpose**: Dashboard widget showing pending signatures and recent agreements.

**Location**: `packages/features/documents/components/DocuSignWidget.tsx`

**Usage**:
```typescript
import { DocuSignWidget } from 'packages/features/documents';

function Dashboard() {
  return (
    <div className="dashboard">
      <DocuSignWidget />
    </div>
  );
}
```

### EmbeddedSigning

**Purpose**: Embedded signing interface component.

**Location**: `packages/features/documents/components/EmbeddedSigning.tsx`

**Usage**:
```typescript
import { EmbeddedSigning } from 'packages/features/documents';

function SigningPage() {
  return (
    <EmbeddedSigning
      agreementId="agreement-123"
      participantId="participant-456"
      onComplete={() => navigate('/agreements')}
    />
  );
}
```

## Backend Services

### AgreementLifecycleService

**Purpose**: High-level agreement operations.

**Location**: `Server/app/services/docusign/agreements/lifecycle.py`

**Key Methods**:
- `create_agreement()` - Create draft agreement
- `get_agreement()` - Retrieve agreement
- `send_for_signature()` - Send to DocuSign
- `void_agreement()` - Cancel agreement
- `get_signing_url()` - Get embedded signing URL
- `add_participant()` - Add signer to agreement
- `remove_participant()` - Remove signer from agreement
- `update_participant_routing_order()` - Change signing order

### DocusignClient

**Purpose**: Low-level DocuSign API wrapper.

**Location**: `Server/app/services/docusign/core/client.py`

**Key Methods**:
- `create_envelope()` - Create envelope
- `get_envelope()` - Get envelope status
- `void_envelope()` - Void envelope
- `create_recipient_view()` - Get signing URL
- `get_envelope_documents()` - Download signed PDF
- `get_envelope_certificate()` - Download certificate

### EnvelopeBuilder

**Purpose**: Constructs DocuSign envelopes from agreements.

**Location**: `Server/app/services/docusign/envelopes/builder.py`

**Process**:
1. Validates agreement (has revision, has participants)
2. Fetches PDF from S3
3. Encodes to base64
4. Builds recipient list with tabs (signers get a default **printed name** `textTab`; see `utils/recipients.py`)
5. Attaches **envelope custom fields** (`agreement_id`, `buyer_id`, `agent_id`) for DocuSign search/metadata (`_build_custom_fields()`)
6. Returns EnvelopeDefinition object

### WebhookProcessor

**Purpose**: Processes DocuSign webhook events.

**Location**: `Server/app/services/docusign/webhooks/processor.py`

**Process**:
1. Loads event from database
2. Parses JSON payload
3. Finds agreement by envelope ID
4. Updates agreement status
5. Updates participant statuses
6. Creates timeline event
7. Enqueues document fetch if completed

## Database Schema

### Agreement Table

```sql
CREATE TABLE agreements (
  id VARCHAR PRIMARY KEY,
  status VARCHAR NOT NULL,  -- draft, sent, delivered, signed, completed, voided, declined
  title VARCHAR NOT NULL,
  description TEXT,
  agent_id VARCHAR NOT NULL REFERENCES users(id),
  buyer_id VARCHAR NOT NULL REFERENCES users(id),
  current_revision_id VARCHAR REFERENCES agreement_revisions(id),
  docusign_envelope_id VARCHAR,
  docusign_status VARCHAR,
  property_address VARCHAR,
  agreement_type VARCHAR,  -- offer, buyer_representation, etc.
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  sent_at TIMESTAMP,
  completed_at TIMESTAMP,
  voided_at TIMESTAMP,
  signed_document_path VARCHAR,
  certificate_path VARCHAR
);
```

### AgreementParticipant Table

```sql
CREATE TABLE agreement_participants (
  id VARCHAR PRIMARY KEY,
  agreement_id VARCHAR NOT NULL REFERENCES agreements(id),
  user_id VARCHAR REFERENCES users(id),
  email VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,  -- signer, carbon_copy, agent
  routing_order INTEGER NOT NULL,
  status VARCHAR,  -- pending, sent, delivered, signed, completed, declined
  recipient_status VARCHAR,
  signed_at TIMESTAMP,
  declined_reason VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### AgreementRevision Table

```sql
CREATE TABLE agreement_revisions (
  id VARCHAR PRIMARY KEY,
  agreement_id VARCHAR NOT NULL REFERENCES agreements(id),
  version_number INTEGER NOT NULL,
  filename VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  file_size INTEGER NOT NULL,
  notes TEXT,
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP
);
```

### DocusignConnectEvent Table

```sql
CREATE TABLE docusign_connect_events (
  id VARCHAR PRIMARY KEY,
  envelope_id VARCHAR NOT NULL,
  event_type VARCHAR NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP
);
```

## Configuration

### Environment Variables

#### Backend (Required)

```bash
# JWT Authentication (for system-level operations)
DOCUSIGN_INTEGRATION_KEY=your-integration-key
DOCUSIGN_IMPERSONATED_USER_ID=your-user-guid
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# OAuth (for agent operations)
DOCUSIGN_CLIENT_ID=your-integration-key
DOCUSIGN_CLIENT_SECRET=your-client-secret

# Webhook (for event processing)
DOCUSIGN_USER_CONNECT_HMAC_SECRET=your-hmac-secret

# URLs (optional, defaults to demo)
DOCUSIGN_BASE_URL=https://demo.docusign.net
DOCUSIGN_ACCOUNT_ID=your-account-id
```

### DocuSign Connect Configuration

**Setup** in DocuSign admin:
1. Go to Settings → Connect → Add Configuration
2. Name: "SilverKey Production"
3. URL: `https://your-domain.com/api/v1/webhooks/docusign/connect`
4. Enable HMAC (recommended)
5. Select events: envelope-sent, envelope-delivered, recipient-completed, envelope-completed, envelope-voided
6. Enable for all users

## Testing

### Test in DocuSign Demo

1. Create demo account at https://demo.docusign.net
2. Configure integration key and OAuth
3. Use ngrok for local webhook testing
4. Create test PDF with anchor text
5. Run complete flow from creation to signing

See `Server/app/services/docusign/TESTING.md` for detailed test scenarios.

## Monitoring

### Key Metrics

- **Agreement creation rate**: Agreements created per day
- **Send success rate**: % of agreements successfully sent to DocuSign
- **Signing completion rate**: % of sent agreements that get signed
- **Average time to sign**: Time from sent to completed
- **Webhook delivery success**: % of webhooks processed without errors

### Logging

All DocuSign operations use structured logging with category `DOCUSIGN`:

```python
from logger import log, LOG_CATEGORIES

log.info(
    LOG_CATEGORIES["DOCUSIGN"],
    "Agreement sent successfully",
    {
        "agreement_id": agreement.id,
        "envelope_id": envelope_id,
        "participant_count": len(participants)
    }
)
```

### Alerting

Set up alerts for:
- Agreement send failures (> 5% failure rate)
- Webhook processing errors (> 1% error rate)
- OAuth token expiration (check token refresh failures)
- Celery task failures (check dead letter queue)

## References

- **Backend Service README**: `Server/app/services/docusign/README.md`
- **Backend API Reference**: `Server/app/services/docusign/API_REFERENCE.md`
- **Testing Guide**: `Server/app/services/docusign/TESTING.md`
- **Tab Configuration**: `Server/app/services/docusign/TABS.md`
- **Frontend README**: `Client/packages/features/documents/README.md`
- **DocuSign API Docs**: https://developers.docusign.com/docs/esign-rest-api/
