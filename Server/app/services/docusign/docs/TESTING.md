# DocuSign Integration Testing Guide

## Overview

This guide provides comprehensive testing procedures for the DocuSign integration. All testing should be done in the DocuSign Demo environment before moving to production.

## Test Environment Setup

### 1. DocuSign Demo Account

**URL**: https://demo.docusign.net

**What you need**:
- Demo account (free developer account)
- Integration key
- RSA keypair
- Client secret
- HMAC secret (for webhooks)

**Setup steps** are in the main [README.md](README.md#setup-steps).

### 2. Local Development Setup

**Prerequisites**:
```bash
# Install dependencies
cd Server
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your demo account credentials

# Start server
python run.py
```

**Required environment variables**:
```bash
# JWT (required)
DOCUSIGN_INTEGRATION_KEY=your-demo-key
DOCUSIGN_IMPERSONATED_USER_ID=your-user-guid
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# OAuth (required for agent operations)
DOCUSIGN_CLIENT_ID=your-demo-key
DOCUSIGN_CLIENT_SECRET=your-demo-secret

# Webhook (required for event processing)
DOCUSIGN_USER_CONNECT_HMAC_SECRET=your-hmac-secret

# Demo URLs (defaults to demo if not set)
DOCUSIGN_BASE_URL=https://demo.docusign.net
DOCUSIGN_ACCOUNT_ID=your-demo-account-id
```

### 3. Webhook Testing with ngrok

Webhooks require a publicly accessible URL. For local testing, use ngrok:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start ngrok tunnel
ngrok http 5000

# Output will show:
# Forwarding https://abc123.ngrok.io -> http://localhost:5000

# Configure in DocuSign Connect:
# URL: https://abc123.ngrok.io/api/v1/webhooks/docusign/connect
```

**Important**: Update Connect Configuration in DocuSign with your ngrok URL before testing webhooks.

---

## Test Scenarios

### Test 1: System Authentication (JWT)

**Purpose**: Verify JWT authentication works for system-level operations.

**Steps**:
1. Ensure JWT env vars are set
2. Make request to templates endpoint:
```bash
curl http://localhost:5000/api/v1/docusign/templates \
  -H "Authorization: Bearer your-access-token"
```

**Expected result**:
- Status 200
- JSON list of templates (may be empty)

**Troubleshooting**:
- If 401: Check JWT credentials
- If "consent_required": Visit consent URL (see README)
- If 403: Check account ID and permissions

---

### Test 2: Agent OAuth Connection

**Purpose**: Verify agents can connect their DocuSign accounts.

**Steps**:
1. Login as an agent user
2. Navigate to Settings
3. Click "Connect DocuSign" (or similar)
4. Redirected to DocuSign OAuth consent screen
5. Click "Allow Access"
6. Redirected back to app with success message

**API flow**:
```bash
# 1. Start OAuth flow
GET /api/v1/docusign/oauth/start
# Returns: {"auth_url": "https://demo.docusign.net/oauth/...", "state": "..."}

# 2. User clicks auth_url, grants access, DocuSign redirects to:
GET /api/v1/docusign/oauth/callback?code=xxx&state=yyy

# 3. Backend exchanges code for tokens, stores in DB
```

**Verify**:
- Check database: `DocusignOAuthToken` row exists for agent
- Token has `access_token`, `refresh_token`, `account_id`
- `expires_at` is in the future

**Troubleshooting**:
- Invalid state: Session/cookie issue, check CORS
- Invalid redirect URI: Must match exactly in DocuSign config
- Token expired: Refresh token should auto-refresh

---

### Test 3: Create Agreement (Draft)

**Purpose**: Create a basic agreement in draft status.

**Steps**:
```bash
curl -X POST http://localhost:5000/api/v1/docusign/agreements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "title": "Test Purchase Offer",
    "agreement_type": "offer",
    "buyer_id": "buyer-user-id",
    "property_address": "123 Test St, Test City"
  }'
```

**Expected result**:
```json
{
  "success": true,
  "agreement": {
    "id": "agreement-uuid",
    "status": "draft",
    "title": "Test Purchase Offer",
    ...
  }
}
```

**Verify**:
- Agreement exists in database
- Status is "draft"
- Agent ID matches current user
- Buyer ID matches provided value

---

### Test 4: Upload Document Revision

**Purpose**: Add PDF to agreement.

**Steps**:
```bash
curl -X POST http://localhost:5000/api/v1/docusign/agreements/{agreement_id}/revisions \
  -H "Authorization: Bearer your-token" \
  -F "file=@test-document.pdf" \
  -F "notes=Initial offer document"
```

**Expected result**:
```json
{
  "success": true,
  "revision": {
    "id": "revision-uuid",
    "agreement_id": "agreement-uuid",
    "version_number": 1,
    "filename": "test-document.pdf",
    ...
  }
}
```

**Verify**:
- Revision exists in database
- File uploaded to S3 (check S3 bucket)
- Agreement's `current_revision_id` updated
- File size > 0

**Test PDF requirements**:
- Must be valid PDF
- Should contain anchor text "SIGN HERE" and "DATE SIGNED" (for tabs)
- Keep small (< 1MB) for fast testing

---

### Test 5: Send Agreement for Signature (Embedded)

**Purpose**: Send agreement and get signing URL.

**Steps**:
```bash
# 1. Send agreement
curl -X POST http://localhost:5000/api/v1/docusign/agreements/{agreement_id}/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "signing_method": "embedded"
  }'

# 2. Wait for Celery task to complete (check logs)

# 3. Get signing URL
curl -X POST http://localhost:5000/api/v1/docusign/agreements/{agreement_id}/signing-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "participant_id": "participant-uuid"
  }'
```

**Expected result**:
```json
{
  "success": true,
  "signing_url": "https://demo.docusign.net/Signing/..."
}
```

**Verify**:
- Agreement status changed from "draft" to "sent"
- DocuSign envelope ID stored in agreement
- Signing URL is valid (loads DocuSign signing interface)
- Participant exists in database

**Open signing URL in browser**:
- Should load DocuSign signing interface
- Should show document with signature fields
- Should have "Sign" and "Finish" buttons

---

### Test 6: Sign Document

**Purpose**: Complete the signing process.

**Steps**:
1. Open signing URL from Test 5
2. Review document
3. Click signature field (should show "Sign Here" tab)
4. Adopt signature or draw signature
5. Click "Finish"
6. Redirected to return URL

**Expected behavior**:
- Signature appears in document
- Date field auto-fills
- "Finish" button becomes available
- After finish, redirected to configured return URL
- Webhook sent to backend (within seconds)

**Verify webhook processing**:
```bash
# Check webhook events table
SELECT * FROM docusign_connect_events
WHERE envelope_id = 'envelope-uuid'
ORDER BY event_timestamp DESC;

# Should see events:
# - envelope-sent
# - envelope-delivered
# - recipient-completed
# - envelope-completed
```

**Verify agreement updated**:
- Agreement status: "completed"
- `completed_at` timestamp set
- Participant status: "completed"
- `signed_at` timestamp set

---

### Test 7: Void Agreement

**Purpose**: Cancel an in-progress agreement.

**Steps**:
```bash
curl -X POST http://localhost:5000/api/v1/docusign/agreements/{agreement_id}/void \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "reason": "Terms changed, new version needed"
  }'
```

**Expected result**:
```json
{
  "success": true,
  "message": "Agreement voided successfully"
}
```

**Verify**:
- Agreement status: "voided"
- `voided_at` timestamp set
- Envelope voided in DocuSign
- Webhook sent (envelope-voided event)

**Cannot void if**:
- Already completed
- Already voided
- Still in draft (just delete instead)

---

### Test 8: Fetch Signed Documents

**Purpose**: Download completed signed PDF.

**Webhook should automatically fetch**:
- When envelope status becomes "completed"
- Celery task `fetch_envelope_documents_task` runs
- Downloads combined PDF from DocuSign
- Uploads to S3
- Updates agreement.signed_document_path

**Manual test**:
```python
from app.services.docusign.core.client import DocusignClient

client = DocusignClient(auth_type="jwt")
result = client.get_envelope_documents(envelope_id)

# result["combined_pdf"] contains signed PDF bytes
# Save or upload to S3
```

**Verify**:
- Signed PDF in S3
- agreement.signed_document_path set
- PDF contains signatures
- PDF can be downloaded by agent/buyer

---

### Test 9: Multi-Signer Sequential Workflow

**Purpose**: Test multiple signers with routing order.

**Steps**:
```bash
# 1. Create agreement
agreement_id=$(create_agreement)

# 2. Add first signer (buyer)
curl -X POST .../agreements/{agreement_id}/participants \
  -d '{
    "user_id": "buyer-id",
    "role": "signer",
    "routing_order": 1
  }'

# 3. Add second signer (co-buyer)
curl -X POST .../agreements/{agreement_id}/participants \
  -d '{
    "user_id": "cobuyer-id",
    "role": "signer",
    "routing_order": 2
  }'

# 4. Send agreement
# 5. First signer signs
# 6. Verify second signer receives email AFTER first signer completes
# 7. Second signer signs
# 8. Verify agreement completes only after both sign
```

**Expected behavior**:
- Buyer gets signing URL immediately after send
- Co-buyer does NOT receive email until buyer signs
- After buyer signs, co-buyer receives email
- After co-buyer signs, envelope completes

**Verify**:
- Two participants in database
- Routing orders: 1 and 2
- Participant statuses update sequentially
- DocuSign enforces routing order

---

### Test 10: Webhook Verification

**Purpose**: Ensure webhooks are verified for security.

**Steps**:
1. Send test webhook with invalid HMAC:
```bash
curl -X POST http://localhost:5000/api/v1/webhooks/docusign/connect \
  -H "Content-Type: application/json" \
  -H "X-DocuSign-Signature-1: invalid-signature" \
  -d '{"envelopeStatus": {"status": "completed"}}'
```

**Expected result**:
- Status 401 or 403
- Error: "Invalid signature"
- Event NOT processed

**Valid webhook test**:
```python
# Generate valid HMAC
import hmac
import hashlib

payload = b'{"envelopeStatus": {"status": "completed"}}'
secret = b'your-hmac-secret'
signature = hmac.new(secret, payload, hashlib.sha256).digest()
signature_b64 = base64.b64encode(signature).decode()

# Send with correct signature
```

**Verify**:
- Valid HMAC: Status 200, event stored
- Invalid HMAC: Status 401/403, event rejected
- Security log entry for failed verification

---

### Connect endpoint reachability (DocuSign "405 Method Not Allowed")

Symptoms: DocuSign Connect logs show `405 Method Not Allowed` for the webhook URL.

**Quick check** (use the same public host your API uses—not necessarily the marketing site if the API is on another hostname):

```bash
curl -i -X POST "https://YOUR_API_HOST/api/v1/webhooks/docusign/connect" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Interpret responses** (a healthy route hits the Flask/Gunicorn app):

| HTTP | Meaning |
|------|---------|
| **400** `Invalid payload` | Route accepts **POST**; body lacks `envelopeId` and event fields (expected for `{}`). |
| **401** `Webhook verification failed` | Route accepts **POST**; HMAC/signature invalid or missing (expected without a real Connect signature). |
| **404** | Path not served on this host—wrong host, typo, or API not mounted here. |
| **405** | POST not allowed at this URL—often wrong edge target (static CDN, wrong ALB rule), or Connect pointed at a host that does not proxy `/api/v1/*` to Flask. |

If you see **400** or **401** from Gunicorn, routing is correct; set DocuSign Connect to **`POST https://YOUR_API_HOST/api/v1/webhooks/docusign/connect`** (same host).

**After a real delivery, confirm processing**:

1. Database: `SELECT * FROM docusign_connect_events ORDER BY created_at DESC LIMIT 20;`
2. Celery: worker running; `docusign.process_webhook` tasks succeeding (no stuck failures).
3. Logs: `Webhook event stored`, `Webhook processing task enqueued`.

---

## Integration Testing

### Full End-to-End Flow

**Test the complete workflow**:

1. **Agent connects DocuSign** (OAuth)
2. **Agent creates agreement** (draft)
3. **Agent uploads PDF** (with anchor text)
4. **Agent adds buyer as signer** (routing order 1)
5. **Agent sends for signature** (embedded)
6. **Buyer receives signing URL**
7. **Buyer signs document**
8. **Webhook updates status** (completed)
9. **System fetches signed PDF** (from DocuSign)
10. **Agent downloads signed document**

**Success criteria**:
- All steps complete without errors
- Database reflects correct states at each step
- PDFs contain signatures
- Webhooks process correctly
- Logs show no errors

---

## Error Testing

### Test Error Scenarios

#### 1. Consent Not Granted (JWT)

**Reproduce**:
- New integration key without consent
- Make API call

**Expected**:
- Error contains consent URL
- Log entry with error details

#### 2. Agent Not Connected (OAuth)

**Reproduce**:
- Agent without OAuth token
- Try to send agreement

**Expected**:
- Error: "Agent not connected to DocuSign"
- Redirect to OAuth flow

#### 3. Invalid PDF

**Reproduce**:
- Upload non-PDF file as revision

**Expected**:
- Error: "Invalid file type"
- No revision created

#### 4. Send Without Revision

**Reproduce**:
- Create agreement
- Send without uploading PDF

**Expected**:
- Error: "Agreement has no current revision"
- Status remains "draft"

#### 5. Missing Anchor Text

**Reproduce**:
- Upload PDF without "SIGN HERE" anchor
- Send agreement

**Expected**:
- Envelope sent (DocuSign won't fail)
- No signature tabs appear (DocuSign issue, not ours)
- Need to use coordinate-based fallback

**Solution**:
- Ensure PDF generation includes anchor text
- Or configure coordinate-based tabs

#### 6. Webhook Delivery Failure

**Reproduce**:
- Stop server while signing

**Expected**:
- DocuSign retries webhook (exponential backoff)
- When server restarts, event processes
- Check DocuSign Connect logs for retry attempts

---

## Performance Testing

### Load Testing Scenarios

#### 1. Concurrent Agreement Creation

**Test**: 10 agents creating agreements simultaneously

```python
import concurrent.futures

def create_agreement(agent_id):
    # Make API call
    pass

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(create_agreement, f"agent-{i}") for i in range(10)]
    results = [f.result() for f in futures]
```

**Success criteria**:
- All agreements created
- No database deadlocks
- Response times < 2 seconds

#### 2. Webhook Processing Throughput

**Test**: 100 webhooks in quick succession

**Expected**:
- All events stored
- All processed without errors
- No duplicate processing
- Processing time < 5 seconds per event

---

## Test Data

### Sample Test Accounts

**Agent**:
```json
{
  "user_id": "test-agent-123",
  "email": "agent@example.com",
  "name": "Test Agent",
  "user_type": "agent"
}
```

**Buyer**:
```json
{
  "user_id": "test-buyer-456",
  "email": "buyer@example.com",
  "name": "Test Buyer",
  "user_type": "buyer"
}
```

### Sample Test PDF

**Create test PDF with anchor text**:

```python
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

def create_test_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)

    # Title
    c.drawString(100, 750, "TEST PURCHASE OFFER")
    c.drawString(100, 730, "Property: 123 Test St, Test City, ST 12345")

    # Agreement text
    c.drawString(100, 700, "This is a test purchase agreement.")
    c.drawString(100, 680, "Terms and conditions...")

    # Signature area
    c.drawString(100, 200, "Buyer Signature: ____________________")
    c.drawString(100, 180, "SIGN HERE")  # Anchor for signature tab

    c.drawString(100, 150, "Date: ____________________")
    c.drawString(100, 130, "DATE SIGNED")  # Anchor for date tab

    c.save()

create_test_pdf("test-offer.pdf")
```

---

## Troubleshooting

### Common Issues

#### Webhooks Not Received

**Symptoms**: Agreement status not updating after signing

**Checks**:
1. Is ngrok running? (for local testing)
2. Is Connect Configuration active in DocuSign?
3. Is HMAC secret correct?
4. Check DocuSign Connect logs (Settings → Connect → Logs)

**DocuSign Connect Logs show**:
- Delivery attempts
- Response codes
- Retry schedule

#### Tabs Not Appearing

**Symptoms**: No signature fields in document

**Causes**:
1. PDF doesn't have anchor text
2. Anchor string misspelled
3. Tabs not configured in EnvelopeBuilder

**Debug**:
- Check PDF source for "SIGN HERE" text
- Verify `build_tabs_for_recipient()` is called
- Test with coordinate-based tabs as fallback

#### Token Expired

**Symptoms**: 401 errors after agent connected

**Cause**: Access token expired (1 hour lifetime)

**Expected behavior**:
- Refresh token automatically refreshes access token
- Transparent to user

**If refresh fails**:
- Agent needs to reconnect via OAuth
- Delete old token from database

---

## Continuous Integration

### Automated Tests

**Unit tests**:
```bash
pytest app/services/docusign/tests/
```

**Integration tests** (require DocuSign Demo):
```bash
pytest app/services/docusign/tests/integration/ --docusign
```

**Mock DocuSign responses** for CI:
```python
# tests/conftest.py
@pytest.fixture
def mock_docusign_client():
    with patch('app.services.docusign.core.client.DocusignClient') as mock:
        mock.create_envelope.return_value = {
            "envelopeId": "test-envelope-id",
            "status": "sent"
        }
        yield mock
```

---

## Production Readiness Checklist

Before deploying to production:

- [ ] All test scenarios pass in Demo
- [ ] OAuth flow tested end-to-end
- [ ] Webhook delivery confirmed
- [ ] Signed documents successfully fetched
- [ ] Multi-signer workflow tested
- [ ] Error scenarios handled gracefully
- [ ] Production credentials configured
- [ ] Production webhook URL configured in DocuSign
- [ ] Consent granted for production JWT
- [ ] Monitoring and alerting set up
- [ ] Backup/rollback plan in place

---

## Support

For testing issues:
1. Check this guide
2. Review [README.md](README.md)
3. Check DocuSign Connect logs
4. Review application logs (DOCUSIGN category)
5. Contact DocuSign support for API-specific issues
