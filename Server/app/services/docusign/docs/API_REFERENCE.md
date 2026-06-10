# DocuSign Service API Reference

## Overview

This document provides a comprehensive reference for the Python service layer API. For REST API endpoints, see the main [README.md](README.md#api-endpoints).

## Architecture

The DocuSign service is organized into modules:

```
docusign/
├── core/           # Authentication and API client
├── agreements/     # Agreement lifecycle management
├── envelopes/      # Envelope construction and signing
├── templates/      # Template synchronization
├── webhooks/       # Webhook processing
└── utils/          # Shared utilities
```

## Core Services

### DocusignClient

**Location**: `core/client.py`

Low-level API client for DocuSign operations.

```python
class DocusignClient:
    def __init__(self, auth_type: str = "jwt", user_id: str | None = None)
```

**Parameters**:
- `auth_type`: Authentication method ("jwt" or "oauth")
- `user_id`: Required for OAuth, ignored for JWT

**Methods**:

#### Envelope Operations

```python
def create_envelope(
    self,
    envelope_definition: EnvelopeDefinition
) -> dict[str, Any]
```
Creates an envelope in DocuSign.

**Parameters**:
- `envelope_definition`: DocuSign SDK EnvelopeDefinition object

**Returns**:
```python
{
    "envelopeId": "envelope-uuid",
    "status": "sent",
    "statusDateTime": "2024-01-15T10:30:00Z"
}
```

**Raises**:
- `DocusignAPIError`: If API call fails
- `DocusignAuthError`: If authentication fails

---

```python
def get_envelope(self, envelope_id: str) -> dict[str, Any]
```
Gets envelope status and details.

**Returns**:
```python
{
    "envelopeId": "envelope-uuid",
    "status": "completed",
    "statusDateTime": "2024-01-15T10:30:00Z",
    "sentDateTime": "2024-01-15T10:00:00Z",
    "completedDateTime": "2024-01-15T11:00:00Z",
    "voidedDateTime": None
}
```

---

```python
def void_envelope(self, envelope_id: str, reason: str) -> dict[str, Any]
```
Voids an envelope.

**Parameters**:
- `envelope_id`: Envelope ID
- `reason`: Reason for voiding

**Returns**:
```python
{
    "envelopeId": "envelope-uuid",
    "status": "voided"
}
```

---

```python
def create_recipient_view(
    self,
    envelope_id: str,
    recipient: dict[str, Any],
    return_url: str
) -> str
```
Creates embedded signing URL for a recipient.

**Parameters**:
- `envelope_id`: Envelope ID
- `recipient`: Recipient data (email, name, recipientId, clientUserId)
- `return_url`: URL to redirect after signing

**Returns**: Signing URL (string)

**Example**:
```python
client = DocusignClient(auth_type="jwt")
signing_url = client.create_recipient_view(
    envelope_id="envelope-123",
    recipient={
        "recipientId": "participant-456",
        "email": "buyer@example.com",
        "name": "John Buyer",
        "clientUserId": "participant-456"
    },
    return_url="https://app.com/signing-complete"
)
```

---

```python
def get_sender_view(
    self,
    envelope_id: str,
    return_url: str
) -> str
```
Creates sender view URL for managing an envelope.

**Returns**: Sender view URL (string)

---

```python
def get_envelope_documents(
    self,
    envelope_id: str
) -> dict[str, Any]
```
Gets the combined signed document PDF.

**Returns**:
```python
{
    "combined_pdf": b"<pdf bytes>",
    "envelope_id": "envelope-uuid"
}
```

---

```python
def get_envelope_certificate(
    self,
    envelope_id: str
) -> dict[str, Any]
```
Gets the certificate of completion.

**Returns**:
```python
{
    "pdf": b"<certificate pdf bytes>",
    "envelope_id": "envelope-uuid"
}
```

#### Template Operations

```python
def list_templates(self) -> list[dict[str, Any]]
```
Lists all templates in the DocuSign account.

**Returns**: List of template objects

```python
def get_template(self, template_id: str) -> dict[str, Any]
```
Gets a specific template by ID.

**Returns**: Template object

---

### DocusignJWTAuth

**Location**: `core/auth_jwt.py`

JWT authentication for system-level operations.

```python
def get_jwt_auth() -> DocusignJWTAuth
```
Singleton factory for JWT auth instance.

**Usage**:
```python
from app.services.docusign.core.auth_jwt import get_jwt_auth

jwt_auth = get_jwt_auth()
api_client = jwt_auth.get_api_client()
account_id = jwt_auth.get_account_id()
```

**Methods**:

```python
def get_api_client(self) -> ApiClient
```
Returns configured DocuSign SDK ApiClient.

```python
def get_account_id(self) -> str
```
Returns the DocuSign account ID.

---

### DocusignOAuthService

**Location**: `core/auth_oauth.py`

OAuth authentication for per-agent operations.

```python
@staticmethod
def build_auth_url(user_id: str) -> tuple[str, str]
```
Builds OAuth authorization URL and state.

**Parameters**:
- `user_id`: Agent user ID

**Returns**:
- `auth_url`: URL to redirect agent to
- `state`: CSRF protection state token

**Example**:
```python
from app.services.docusign.core.auth_oauth import DocusignOAuthService

auth_url, state = DocusignOAuthService.build_auth_url(agent_id)
# Redirect agent to auth_url
# Store state in session for verification
```

---

```python
@staticmethod
def handle_oauth_callback(
    code: str,
    state: str
) -> tuple[bool, str | None, str | None]
```
Handles OAuth callback after authorization.

**Parameters**:
- `code`: Authorization code from DocuSign
- `state`: State token for CSRF verification

**Returns**:
- `success`: True if successful
- `user_id`: User ID if successful, None otherwise
- `error`: Error message if failed, None otherwise

---

```python
@staticmethod
def get_api_client(user_id: str) -> ApiClient | None
```
Gets API client for a connected agent.

**Returns**: ApiClient if agent is connected, None otherwise

---

```python
@staticmethod
def is_user_connected(user_id: str) -> bool
```
Checks if an agent is connected to DocuSign.

**Returns**: True if connected, False otherwise

---

## Agreement Lifecycle Service

**Location**: `agreements/lifecycle.py`

High-level service for agreement operations.

### AgreementLifecycleService

All methods are static.

```python
@staticmethod
def create_agreement(
    agent_id: str,
    buyer_id: str,
    title: str,
    agreement_type: str,
    **kwargs
) -> Agreement
```
Creates a new agreement in draft status.

**Parameters**:
- `agent_id`: Agent user ID (creator)
- `buyer_id`: Buyer user ID
- `title`: Agreement title
- `agreement_type`: Type ("offer", "buyer_representation", etc.)
- `**kwargs`: Optional fields (description, property_address)

**Returns**: Agreement model instance

**Example**:
```python
from app.services.docusign import AgreementLifecycleService

agreement = AgreementLifecycleService.create_agreement(
    agent_id="agent-123",
    buyer_id="buyer-456",
    title="Purchase Offer - 123 Main St",
    agreement_type="offer",
    property_address="123 Main St, City, State",
    description="Initial offer for property"
)
```

---

```python
@staticmethod
def get_agreement(agreement_id: str) -> Agreement
```
Gets an agreement by ID.

**Raises**: `AgreementNotFoundError` if not found

---

```python
@staticmethod
def send_for_signature(
    agreement_id: str,
    signing_method: str,
    actor_id: str,
    participant_user_id: str | None = None
) -> str
```
Enqueues task to send agreement for signature.

**Parameters**:
- `agreement_id`: Agreement ID
- `signing_method`: "embedded" or "email"
- `actor_id`: User initiating send (agent)
- `participant_user_id`: Optional specific signer (defaults to buyer_id)

**Returns**: Celery task ID

**Raises**:
- `AgreementStateError`: If agreement not in draft status or no revision

**Example**:
```python
task_id = AgreementLifecycleService.send_for_signature(
    agreement_id="agreement-123",
    signing_method="embedded",
    actor_id="agent-123"
)
# Task runs in background via Celery
```

---

```python
@staticmethod
def void_agreement(
    agreement_id: str,
    reason: str,
    actor_id: str
) -> None
```
Voids an agreement.

**Parameters**:
- `agreement_id`: Agreement ID
- `reason`: Reason for voiding
- `actor_id`: User voiding (agent)

**Raises**: `AgreementStateError` if cannot void (completed, already voided)

---

```python
@staticmethod
def get_signing_url(
    agreement_id: str,
    participant_id: str
) -> str
```
Gets embedded signing URL for a participant.

**Parameters**:
- `agreement_id`: Agreement ID
- `participant_id`: Participant ID (from AgreementParticipant table)

**Returns**: Signing URL

**Raises**:
- `AgreementStateError`: If not sent or invalid status
- `ParticipantNotFoundError`: If participant not found

**Example**:
```python
signing_url = AgreementLifecycleService.get_signing_url(
    agreement_id="agreement-123",
    participant_id="participant-456"
)
# Display URL in iframe or redirect
```

---

```python
@staticmethod
def get_sender_view_url(agreement_id: str) -> str
```
Gets sender view URL for agent to manage envelope.

**Returns**: Sender view URL

---

```python
@staticmethod
def add_participant(
    agreement_id: str,
    user_id: str,
    role: str = "signer",
    routing_order: int | None = None,
    actor_id: str | None = None
) -> AgreementParticipant
```
Adds a participant to an agreement (NEW - multi-signer support).

**Parameters**:
- `agreement_id`: Agreement ID
- `user_id`: User ID of participant
- `role`: "signer", "carbon_copy", etc.
- `routing_order`: Signing order (1, 2, 3...). Auto-assigned if None.
- `actor_id`: User adding participant (for validation)

**Returns**: Created AgreementParticipant

**Raises**:
- `AgreementStateError`: If not in draft or user not found

**Example**:
```python
# Add buyer as first signer
buyer_participant = AgreementLifecycleService.add_participant(
    agreement_id="agreement-123",
    user_id="buyer-456",
    role="signer",
    routing_order=1
)

# Add co-buyer as second signer (signs after buyer)
cobuyer_participant = AgreementLifecycleService.add_participant(
    agreement_id="agreement-123",
    user_id="cobuyer-789",
    role="signer",
    routing_order=2
)
```

---

```python
@staticmethod
def remove_participant(
    agreement_id: str,
    participant_id: str
) -> None
```
Removes a participant from an agreement (NEW).

**Raises**: `AgreementStateError` if not in draft

---

```python
@staticmethod
def update_participant_routing_order(
    agreement_id: str,
    participant_id: str,
    new_routing_order: int
) -> AgreementParticipant
```
Updates participant signing order (NEW).

**Returns**: Updated AgreementParticipant

---

## Revision Service

**Location**: `agreements/revisions.py`

Manages agreement document revisions.

### RevisionService

```python
@staticmethod
def create_revision(
    agreement_id: str,
    file_content: bytes,
    filename: str,
    mime_type: str,
    created_by: str,
    notes: str | None = None
) -> AgreementRevision
```
Creates a new revision for an agreement.

**Parameters**:
- `agreement_id`: Agreement ID
- `file_content`: PDF file bytes
- `filename`: Original filename
- `mime_type`: MIME type (usually "application/pdf")
- `created_by`: User ID creating revision
- `notes`: Optional notes about revision

**Returns**: AgreementRevision model

**Notes**:
- Uploads file to S3
- Auto-increments version number
- Sets as current revision

**Example**:
```python
from app.services.docusign import RevisionService

with open("offer.pdf", "rb") as f:
    file_bytes = f.read()

revision = RevisionService.create_revision(
    agreement_id="agreement-123",
    file_content=file_bytes,
    filename="offer.pdf",
    mime_type="application/pdf",
    created_by="agent-123",
    notes="Updated terms per buyer request"
)
```

---

## Envelope Builder

**Location**: `envelopes/builder.py`

Constructs DocuSign envelopes from agreements.

### EnvelopeBuilder

```python
class EnvelopeBuilder:
    def __init__(
        self,
        agreement: Agreement,
        signing_method: str = "embedded"
    )
```

**Parameters**:
- `agreement`: Agreement model instance
- `signing_method`: "embedded" or "email"

```python
def build(self) -> EnvelopeDefinition
```
Builds complete envelope definition.

**Returns**: DocuSign SDK EnvelopeDefinition

**Process**:
1. Validates agreement (has revision, has participants)
2. Fetches PDF from S3
3. Encodes to base64
4. Builds recipient list with tabs
5. Creates envelope definition

**Example**:
```python
from app.services.docusign.envelopes.builder import EnvelopeBuilder

agreement = db.session.get(Agreement, "agreement-123")
builder = EnvelopeBuilder(agreement, signing_method="embedded")
envelope_definition = builder.build()

# Send via client
from app.services.docusign.core.client import DocusignClient
client = DocusignClient(auth_type="jwt")
result = client.create_envelope(envelope_definition)
```

---

## Signing Service

**Location**: `envelopes/signing.py`

Generates signing URLs.

### SigningService

```python
@staticmethod
def get_signing_url(
    agreement: Agreement,
    participant: AgreementParticipant
) -> str
```
Gets embedded signing URL for participant.

**Parameters**:
- `agreement`: Agreement model
- `participant`: AgreementParticipant model

**Returns**: Signing URL

**Raises**: `AgreementStateError` if envelope not sent

---

```python
@staticmethod
def get_sender_view_url(agreement: Agreement) -> str
```
Gets sender view URL for agent.

---

## Template Sync Service

**Location**: `templates/sync.py`

Syncs templates from DocuSign.

### TemplateSyncService

```python
@staticmethod
def sync_all_templates() -> int
```
Syncs all templates from DocuSign to database.

**Returns**: Count of synced templates

**Process**:
1. Fetches templates via JWT client
2. Creates/updates DocusignTemplate models
3. Sets synced_at timestamp

**Example**:
```python
from app.services.docusign.templates.sync import TemplateSyncService

count = TemplateSyncService.sync_all_templates()
print(f"Synced {count} templates")
```

---

## Webhook Processor

**Location**: `webhooks/processor.py`

Processes DocuSign webhook events.

### WebhookProcessor

```python
@staticmethod
def process_envelope_event(event_id: str) -> None
```
Processes a stored webhook event.

**Parameters**:
- `event_id`: DocusignConnectEvent ID

**Process**:
1. Loads event from database
2. Parses JSON payload
3. Finds agreement by envelope ID
4. Updates agreement status
5. Updates participant statuses
6. Creates timeline event
7. Enqueues document fetch if completed

**Called by**: Celery task after webhook received

---

### Webhook Verification

**Location**: `webhooks/verification.py`

```python
def verify_webhook(
    payload: bytes,
    signature: str | None,
    auth_header: str | None = None
) -> tuple[bool, str]
```
Verifies webhook authenticity.

**Parameters**:
- `payload`: Raw request body bytes
- `signature`: X-DocuSign-Signature-1 header
- `auth_header`: Authorization header (for OAuth Connect, optional)

**Returns**:
- `is_valid`: True if verified
- `error_message`: Error if invalid

**Verification methods**:
1. HMAC-SHA256 (required)
2. OAuth token (optional, if enabled)

---

## Utilities

### Recipients

**Location**: `utils/recipients.py`

```python
def build_tabs_for_recipient(
    participant: AgreementParticipant,
    document_id: str = "1"
) -> dict[str, Any]
```
Builds signature tabs using anchor-based positioning (NEW).

**Returns**:
```python
{
    "signHereTabs": [...],
    "dateSignedTabs": [...]
}
```

---

```python
def build_recipient_from_participant(
    participant: AgreementParticipant
) -> dict[str, Any]
```
Builds DocuSign recipient object with tabs.

**Returns**:
```python
{
    "email": "buyer@example.com",
    "name": "John Buyer",
    "recipientId": "participant-id",
    "routingOrder": "1",
    "tabs": {
        "signHereTabs": [...],
        "dateSignedTabs": [...]
    }
}
```

---

```python
def validate_participants(
    participants: list[AgreementParticipant]
) -> tuple[bool, str]
```
Validates participant list for envelope creation.

**Checks**:
- At least one participant
- At least one signer
- No duplicate emails in same routing order

**Returns**:
- `is_valid`: True if valid
- `error_message`: Error if invalid

---

### Permissions

**Location**: `utils/permissions.py`

```python
def can_access_agreement(user: User, agreement: Agreement) -> bool
```
Checks if user can access agreement.

**Returns**: True if agent who created it or buyer on the agreement

---

```python
def can_get_signing_url(
    user: User,
    agreement: Agreement,
    participant: AgreementParticipant
) -> bool
```
Checks if user can get signing URL for participant.

**Returns**: True if user is the participant or the agent

---

```python
def is_agent(user: User) -> bool
```
Checks if user is an agent.

---

### Idempotency

**Location**: `utils/idempotency.py`

```python
def is_duplicate_event(
    envelope_id: str,
    event_type: str,
    event_timestamp: str
) -> bool
```
Checks if webhook event is duplicate.

**Returns**: True if duplicate exists

---

## Error Classes

**Location**: `errors.py`

```python
class DocusignError(Exception):
    """Base exception for DocuSign errors"""
    pass

class DocusignAuthError(DocusignError):
    """Authentication/authorization errors"""
    pass

class DocusignAPIError(DocusignError):
    """API call errors"""
    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        response_body: str | None = None
    )

class AgreementStateError(DocusignError):
    """Agreement in invalid state for operation"""
    pass

class AgreementNotFoundError(DocusignError):
    """Agreement not found"""
    pass

class ParticipantNotFoundError(DocusignError):
    """Participant not found"""
    pass
```

**Usage**:
```python
from app.services.docusign.errors import (
    AgreementStateError,
    DocusignAPIError
)

try:
    AgreementLifecycleService.send_for_signature(...)
except AgreementStateError as e:
    # Handle invalid state
    log.error("Cannot send agreement", error=str(e))
except DocusignAPIError as e:
    # Handle API error
    log.error("DocuSign API failed", status=e.status_code)
```

---

## Best Practices

### Error Handling

Always catch specific exceptions:
```python
from app.services.docusign.errors import (
    AgreementStateError,
    DocusignAPIError,
    DocusignAuthError
)

try:
    result = AgreementLifecycleService.send_for_signature(...)
except AgreementStateError as e:
    # Invalid state - user error
    return {"error": str(e)}, 400
except DocusignAuthError as e:
    # Auth issue - agent needs to reconnect
    return {"error": "DocuSign connection expired"}, 401
except DocusignAPIError as e:
    # API error - may be transient
    log.error("DocuSign API error", status=e.status_code)
    return {"error": "DocuSign service unavailable"}, 503
```

### Logging

Use structured logging:
```python
from logger import LOG_CATEGORIES, get_logger

logger = get_logger()

logger.info(
    LOG_CATEGORIES["DOCUSIGN"],
    "Agreement created successfully",
    {
        "agreement_id": agreement.id,
        "agent_id": agent_id,
        "type": agreement_type
    }
)
```

### Transaction Safety

Wrap database operations in transactions:
```python
from app import db

try:
    agreement = AgreementLifecycleService.create_agreement(...)
    participant = AgreementLifecycleService.add_participant(...)
    db.session.commit()
except Exception as e:
    db.session.rollback()
    raise
```

### Celery Tasks

Long-running operations use Celery:
```python
# Don't block request
task_id = AgreementLifecycleService.send_for_signature(...)

# Task runs in background
# Webhook will update status when complete
```

---

## Migration Guide

### From Single Signer to Multi-Signer

**Old code**:
```python
# Single signer (automatic)
AgreementLifecycleService.send_for_signature(
    agreement_id=agreement_id,
    signing_method="embedded",
    actor_id=agent_id
)
```

**New code**:
```python
# Multiple signers (manual setup)
AgreementLifecycleService.add_participant(
    agreement_id=agreement_id,
    user_id=buyer_id,
    role="signer",
    routing_order=1
)

AgreementLifecycleService.add_participant(
    agreement_id=agreement_id,
    user_id=cobuyer_id,
    role="signer",
    routing_order=2  # Signs after buyer
)

# Then send
AgreementLifecycleService.send_for_signature(
    agreement_id=agreement_id,
    signing_method="embedded",
    actor_id=agent_id
)
```

---

## Testing

See [TESTING.md](TESTING.md) for testing guide.

---

## Support

For service-level issues:
1. Check this API reference
2. Review [README.md](README.md)
3. Check logs with DOCUSIGN category
4. Review DocuSign API logs in developer account
