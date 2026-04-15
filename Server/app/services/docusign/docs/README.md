# DocuSign Integration

This directory contains the DocuSign e-signature integration for SilverKey. The integration supports creating, sending, and managing real estate agreements with e-signature capabilities.

## Architecture Overview

The DocuSign integration uses a **hybrid authentication model** with three components:

```
┌─────────────────────────────────────────────────────────────┐
│                   DocuSign Integration                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. JWT Authentication (System User)                         │
│     └─> Template sync, system operations                    │
│                                                              │
│  2. OAuth Authentication (Per-Agent)                         │
│     └─> Agent-specific operations (send agreements, etc.)   │
│                                                              │
│  3. Webhook Listener (Connect API)                           │
│     └─> Real-time event updates (signed, voided, etc.)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 1. JWT Authentication (System User)

**Purpose**: System-level operations that don't require a specific user context.

**Use Cases**:
- Syncing templates from DocuSign
- Creating agreement drafts
- Administrative operations

**Authentication Flow**:
```
Backend Service
    └─> Requests JWT token from DocuSign
        └─> Uses Integration Key + RSA Private Key
            └─> Impersonates system user (DOCUSIGN_IMPERSONATED_USER_ID)
                └─> Gets 1-hour access token
```

**Implementation**: `core/auth_jwt.py` - `DocusignJWTAuth`

### 2. OAuth Authentication (Per-Agent)

**Purpose**: Agent-specific operations that require individual user authorization.

**Use Cases**:
- Sending agreements for signature (from agent's DocuSign account)
- Generating embedded signing URLs
- Voiding envelopes

**Authentication Flow**:
```
Agent clicks "Connect DocuSign"
    └─> /api/v1/docusign/oauth/start
        └─> Redirected to DocuSign OAuth consent screen
            └─> Agent authorizes app
                └─> /api/v1/docusign/oauth/callback
                    └─> Exchange code for access + refresh tokens
                        └─> Store tokens in database (DocusignOAuthToken table)
```

**Token Management**:
- Access tokens expire after 1 hour
- Refresh tokens automatically refresh expired access tokens
- Tokens stored per-agent in `DocusignOAuthToken` table
- Each agent maintains their own DocuSign connection

**Implementation**: `core/auth_oauth.py` - `DocusignOAuthService`

### 3. Webhook Listener (Connect API)

**Purpose**: Receive real-time event notifications from DocuSign.

**Events Received**:
- `envelope-sent` - Envelope sent for signature
- `envelope-delivered` - Envelope delivered to recipient
- `envelope-completed` - All signatures completed
- `envelope-declined` - Recipient declined to sign
- `envelope-voided` - Envelope was voided
- `recipient-completed` - Individual recipient completed signing

**Flow**:
```
DocuSign Event Occurs (e.g., document signed)
    └─> DocuSign sends POST to webhook URL
        └─> /api/v1/webhooks/docusign/connect
            └─> Verify HMAC signature
                └─> Store event in DocusignConnectEvent table
                    └─> Enqueue Celery task for processing
                        └─> Update Agreement status in database
```

**Security**: All webhook requests are verified using HMAC-SHA256 signature. Optional OAuth token verification available for enhanced security.

**Implementation**:
- Verification: `webhooks/verification.py` - `verify_webhook()`, `verify_hmac()`, `verify_oauth_token()`
- Processing: `webhooks/processor.py` - `WebhookProcessor`

**Supported Verification Methods**:
- **HMAC** (default): Verifies signature in `X-DocuSign-Signature-1` header
- **OAuth for Connect** (optional): Verifies token in `Authorization` header
  - Requires your own OAuth 2.0 server (Azure AD, Okta, Auth0, etc.)
  - See `../../DOCUSIGN_OAUTH_CONNECT.md` for setup guide

## Configuration

### Required Environment Variables

#### 1. JWT Authentication (System)

```bash
# Integration Key (from DocuSign Developer Account)
DOCUSIGN_INTEGRATION_KEY=your-integration-key

# Impersonated User ID (system user GUID)
# Default: d3fa0f3e-253a-44df-8b0e-ae74dad062d4 (can override)
DOCUSIGN_IMPERSONATED_USER_ID=d3fa0f3e-253a-44df-8b0e-ae74dad062d4

# Private key PEM for JWT (inline env only; pick one name)
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...your key...\n-----END RSA PRIVATE KEY-----"
# Alias for the same private PEM (e.g. secrets-manager JSON)
# DOCUSIGN_RSA_SECRET="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# Optional: public PEM (registered in DocuSign; not used to sign JWTs but often stored alongside private)
# DOCUSIGN_RSA_PUBLIC="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
# DOCUSIGN_RSA_ID="<keypair-id-from-apps-and-keys>"  # JWT ``kid`` when multiple RSA keys are registered
```

#### 2. OAuth Authentication (Per-Agent)

```bash
# Client ID (usually same as integration key)
DOCUSIGN_CLIENT_ID=your-integration-key

# Client Secret (from DocuSign Developer Account)
DOCUSIGN_CLIENT_SECRET=your-client-secret
```

#### 3. Webhook Configuration

```bash
# HMAC Secrets for webhook verification (from DocuSign Connect Configuration)
# Account-level Connect
DOCUSIGN_USER_CONNECT_HMAC_SECRET=your-hmac-secret

# Organization-level Connect (optional, for org-level webhooks)
DOCUSIGN_ORG_CONNECT_HMAC_SECRET=your-org-hmac-secret

# OAuth for Connect (optional, additional security layer)
# See DOCUSIGN_OAUTH_CONNECT.md for full setup guide
DOCUSIGN_CONNECT_OAUTH_ENABLED=false  # Set to 'true' to enable
DOCUSIGN_CONNECT_OAUTH_ISSUER=https://login.microsoftonline.com/{tenant-id}/v2.0  # Your OAuth server
DOCUSIGN_CONNECT_OAUTH_AUDIENCE=https://usesilverkey.com  # Your API audience
```

#### 4. Account Configuration (Optional)

```bash
# API Account ID = GUID from DocuSign Apps and Keys / Settings (not the numeric "Account ID" shown in the UI)
# Example shape only — use your real GUID:
DOCUSIGN_ACCOUNT_ID=d020d926-48cc-4081-9179-46cb3c0a24f3

# Base URL
# Default: https://demo.docusign.net
# Production: https://na3.docusign.net (or your region)
DOCUSIGN_BASE_URL=https://demo.docusign.net
```

### Where to Find These Values

#### 1. Integration Key & Client Secret

1. Go to [DocuSign Developer Account](https://admindemo.docusign.com) (or production)
2. Navigate to **Settings** → **Apps and Keys**
3. Find your app or click **"Add App and Integration Key"**
4. **Integration Key**: Copy the Integration Key
   - This is used for both `DOCUSIGN_INTEGRATION_KEY` and `DOCUSIGN_CLIENT_ID`
5. **Client Secret**: Click **"Add Secret Key"**
   - Copy the secret immediately (won't be shown again)
   - This is `DOCUSIGN_CLIENT_SECRET`

#### 2. RSA Private Key (JWT)

In the same **Apps and Keys** section:

1. Scroll to **"Authentication"** section
2. Click **"Generate RSA"** or **"Add RSA Keypair"**
3. Copy the **private** key PEM into `DOCUSIGN_PRIVATE_KEY` or `DOCUSIGN_RSA_SECRET`
4. Optionally store the **public** PEM in `DOCUSIGN_RSA_PUBLIC` (JWT signing uses the private key only)

**Important**: After generating the RSA key, you must grant consent. See [Consent Required](#consent-required) section.

#### 3. Impersonated User ID

In **Settings** → **Apps and Keys**:

1. Scroll to **"Service Integration"** section
2. Your User ID (GUID) is shown under **"API Username"**
3. Copy the GUID (format: `d3fa0f3e-253a-44df-8b0e-ae74dad062d4`)

**Note**: The default value in `_constants_docusign.py` is pre-configured for the SilverKey Demo account. Only override if using a different account.

#### 4. HMAC Secret

1. Go to **Settings** → **Connect** → **DocuSign Connect**
2. Find **Connect Configuration ID 22035309** (or your configuration)
3. Click **"Edit"** or **"View Configuration"**
4. Scroll to **"Security"** section
5. Copy the **HMAC Secret**

**Note**: The webhook URL must also be configured here:
- Development: `http://localhost:5000/api/v1/webhooks/docusign/connect`
- Production: `https://usesilverkey.com/api/v1/webhooks/docusign/connect`

## Setup Steps

### 1. Create DocuSign Developer Account

1. Go to [https://developers.docusign.com](https://developers.docusign.com)
2. Click **"Get Started for Free"**
3. Create a demo account (free for development)

### 2. Create Integration

1. Log in to [Demo Admin](https://admindemo.docusign.com)
2. Go to **Settings** → **Apps and Keys**
3. Click **"Add App and Integration Key"**
4. Name: "SilverKey"
5. Copy the **Integration Key**

### 3. Generate RSA Keypair (JWT)

1. In the app configuration, scroll to **Authentication**
2. Click **"Generate RSA"**
3. Copy the private key PEM into `DOCUSIGN_PRIVATE_KEY` or `DOCUSIGN_RSA_SECRET` (and optionally the public PEM into `DOCUSIGN_RSA_PUBLIC`)

### 4. Generate Client Secret (OAuth)

1. In the same app configuration
2. Click **"Add Secret Key"**
3. Copy the secret immediately
4. Save to your environment variables

### 5. Grant Consent (Required for JWT)

JWT authentication requires one-time user consent:

1. Start your backend server
2. Run the JWT auth flow (it will fail with a consent error)
3. The error will include a consent URL
4. OR manually visit (replace `YOUR_INTEGRATION_KEY`; `redirect_uri` must exactly match a URI registered for the app and the same value as `DOCUSIGN_OAUTH_REDIRECT_URI`, e.g. dev `http://localhost:5000/api/v1/docusign/oauth/callback` — URL-encode it in the query string):
   ```
   https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=YOUR_INTEGRATION_KEY&redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fv1%2Fdocusign%2Foauth%2Fcallback
   ```
5. Click **"Allow Access"**
6. JWT auth will now work

### 6. Configure Webhook (Connect)

1. Go to **Settings** → **Connect** → **DocuSign Connect**
2. Click **"Add Configuration"** or edit existing
3. Configure:
   - **Name**: SilverKey Webhook
   - **URL**:
     - Dev: `http://localhost:5000/api/v1/webhooks/docusign/connect`
     - Prod: `https://usesilverkey.com/api/v1/webhooks/docusign/connect`
   - **Events to Include**: Select all envelope events
   - **Message Format**: JSON
   - **Security**: Enable HMAC and copy the secret
4. Save and note the **Connect Configuration ID**

### 7. Configure Environment Variables

Add all variables to your `.env` file:

```bash
# JWT (System)
DOCUSIGN_INTEGRATION_KEY=abc123xyz
DOCUSIGN_IMPERSONATED_USER_ID=d3fa0f3e-253a-44df-8b0e-ae74dad062d4
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"

# OAuth (Per-Agent)
DOCUSIGN_CLIENT_ID=abc123xyz
DOCUSIGN_CLIENT_SECRET=def456uvw

# Webhook
DOCUSIGN_USER_CONNECT_HMAC_SECRET=your-hmac-secret

# Optional (must be API Account GUID if set — not the numeric display account id)
DOCUSIGN_ACCOUNT_ID=d020d926-48cc-4081-9179-46cb3c0a24f3
DOCUSIGN_BASE_URL=https://demo.docusign.net
```

### 8. Test the Integration

```bash
# Start backend
cd Server
python run.py

# Test JWT auth (system operations)
curl http://localhost:5000/api/v1/docusign/templates

# Test OAuth flow (requires agent login)
# 1. Login as agent
# 2. Go to settings
# 3. Click "Connect DocuSign"
# 4. Authorize
# 5. Should redirect back with success
```

## Usage

### For System Operations (JWT)

```python
from app.services.docusign.core.auth_jwt import get_jwt_auth

# Get JWT auth instance
jwt_auth = get_jwt_auth()

# Get API client
api_client = jwt_auth.get_api_client()
account_id = jwt_auth.get_account_id()

# Use with DocuSign SDK
from docusign_esign import TemplatesApi

templates_api = TemplatesApi(api_client)
templates = templates_api.list_templates(account_id)
```

### For Agent Operations (OAuth)

```python
from app.services.docusign.core.auth_oauth import DocusignOAuthService

# Get agent's API client
api_client = DocusignOAuthService.get_api_client(agent_id)

if not api_client:
    # Agent not connected
    auth_url, state = DocusignOAuthService.build_auth_url(agent_id)
    # Redirect agent to auth_url
else:
    # Use api_client for operations
    from docusign_esign import EnvelopesApi

    envelopes_api = EnvelopesApi(api_client)
    # ... send envelope, get signing URL, etc.
```

### For Creating and Sending Agreements

```python
from app.services.docusign import AgreementLifecycleService

# Create agreement (uses JWT)
agreement = AgreementLifecycleService.create_agreement(
    agent_id='agent-123',
    buyer_id='buyer-456',
    title='Purchase Agreement',
    agreement_type='purchase',
    property_address='123 Main St'
)

# Add revision (upload document)
from app.services.docusign import RevisionService

revision = RevisionService.create_revision(
    agreement_id=agreement.id,
    file_content=pdf_bytes,
    filename='purchase_agreement.pdf',
    created_by='agent-123'
)

# Send for signature (uses OAuth - requires agent connection)
task_id = AgreementLifecycleService.send_for_signature(
    agreement_id=agreement.id,
    signing_method='embedded',
    actor_id='agent-123'
)

# Get signing URL for buyer
signing_url = AgreementLifecycleService.get_signing_url(
    agreement_id=agreement.id,
    participant_id='participant-789'
)
```

## API Endpoints

### OAuth Endpoints

- `GET /api/v1/docusign/oauth/start` - Start OAuth flow
- `GET /api/v1/docusign/oauth/callback` - OAuth callback handler

### Agreement Endpoints

- `POST /api/v1/docusign/agreements` - Create new agreement
- `GET /api/v1/docusign/agreements` - List agreements for current user
- `GET /api/v1/docusign/agreements/<id>` - Get agreement details
- `POST /api/v1/docusign/agreements/<id>/send` - Send for signature
- `POST /api/v1/docusign/agreements/<id>/void` - Void agreement
- `POST /api/v1/docusign/agreements/<id>/signing-url` - Get embedded signing URL

### Revision Endpoints

- `POST /api/v1/docusign/agreements/<id>/revisions` - Upload new revision

### Template Endpoints

- `GET /api/v1/docusign/templates` - List available templates
- `POST /api/v1/docusign/templates/sync` - Sync templates from DocuSign

### Webhook Endpoints

- `POST /api/v1/webhooks/docusign/connect` - Receive DocuSign events (HMAC verified)

## Database Models

### Agreement
- Main agreement entity
- Tracks status: `draft`, `sent`, `delivered`, `completed`, `declined`, `voided`
- Links to agent (creator) and buyer

### AgreementRevision
- Document versions for each agreement
- Stores PDF in S3
- Tracks DocuSign envelope ID

### AgreementParticipant
- Signers (agent, buyer, co-buyers, etc.)
- Tracks signing status per participant

### AgreementEvent
- Audit log of all agreement actions
- Created by humans and webhooks

### DocusignOAuthToken
- Stores OAuth tokens per agent
- Auto-refreshes expired tokens
- One token per agent

### DocusignConnectEvent
- Raw webhook events from DocuSign
- Deduplicated by envelope_id + event_type + timestamp
- HMAC verification status

### DocusignTemplate
- Synced from DocuSign
- Available templates for creating agreements

## Directory Structure

```
docusign/
├── README.md (this file)
├── __init__.py - Main exports
├── errors.py - Custom exceptions
│
├── core/ - Authentication & API client
│   ├── auth_jwt.py - JWT authentication (system user)
│   ├── auth_oauth.py - OAuth authentication (per-agent)
│   └── client.py - API client factory
│
├── agreements/ - Agreement lifecycle
│   ├── lifecycle.py - Create, send, void, get signing URLs
│   └── revisions.py - Document upload and versioning
│
├── envelopes/ - DocuSign envelope operations
│   ├── builder.py - Build envelopes from agreements
│   └── signing.py - Signing URL generation
│
├── templates/ - Template management
│   └── sync.py - Sync templates from DocuSign
│
├── webhooks/ - Webhook processing
│   ├── verification.py - HMAC verification
│   └── processor.py - Event processing
│
└── utils/ - Shared utilities
    ├── idempotency.py - Prevent duplicate operations
    ├── permissions.py - Permission checks
    └── recipients.py - Recipient helpers
```

## Security Considerations

### 1. Token Storage

OAuth tokens are stored in the database. In production environments:
- Consider field-level encryption for `access_token` and `refresh_token` columns
- Use SQLAlchemy hybrid properties or database-level encryption
- Ensure database backups are encrypted

### 2. HMAC Verification

All webhook requests MUST be verified:
- Use `verify_hmac()` from `webhooks/verification.py`
- Reject requests with invalid signatures
- Log security events for failed verifications

### 3. State Parameter Security

OAuth state parameter is HMAC-signed to prevent CSRF:
- Generated in `build_auth_url()`
- Verified in OAuth callback
- Contains user_id + random token + HMAC signature

### 4. Private Key Protection

RSA private key must be secured:
- Never commit to version control
- Use environment variables or secret management
- Rotate keys periodically

### 5. Rate Limiting

All DocuSign API endpoints are rate-limited:
- OAuth: 10 requests/minute
- Agreements: 20-50 requests/minute
- Templates: 5 sync requests/minute
- Webhooks: No rate limit (HMAC verified)

## Troubleshooting

### JWT Authentication Fails

**Error**: `consent_required`

**Solution**: Visit the consent URL and grant access (see [Setup Steps](#setup-steps))

### OAuth Callback Fails

**Error**: `Invalid state`

**Cause**: State mismatch between request and callback

**Solution**:
- Ensure cookies/session are working
- Check `SESSION_COOKIE_SAMESITE` is set to `"Lax"`
- Verify redirect URI matches exactly in DocuSign config

### Webhook Not Received

**Checklist**:
1. Is webhook URL publicly accessible? (use ngrok for local dev)
2. Is HMAC secret correct?
3. Is Connect Configuration active in DocuSign?
4. Check DocuSign Connect logs (Settings → Connect → Logs)

### Token Refresh Fails

**Error**: `refresh_token_invalid`

**Cause**: Refresh token expired or revoked

**Solution**: Agent must reconnect via OAuth flow

### "Account not found" or 401 on envelope calls

**Cause**: `DOCUSIGN_ACCOUNT_ID` is wrong, not set, or set to the **numeric display** account id instead of the **API Account ID (GUID)**.

**Solution**: In DocuSign Admin, copy the API Account ID (UUID). Remove `DOCUSIGN_ACCOUNT_ID` from env to let JWT user-info auto-detect the first account, or set the correct GUID explicitly.

## Production Deployment

### Pre-Production Checklist

- [ ] Switch from Demo account to Production account
- [ ] Update `DOCUSIGN_BASE_URL` to production URL (e.g., `https://na3.docusign.net`)
- [ ] Update all IDs (integration key, user ID, account ID) to production values
- [ ] Generate new RSA keypair for production
- [ ] Generate new client secret for production
- [ ] Configure production webhook URL in Connect Configuration
- [ ] Generate new HMAC secret for production webhooks
- [ ] Grant consent for production JWT
- [ ] Test OAuth flow in production
- [ ] Test webhook delivery in production
- [ ] Enable field-level encryption for tokens (recommended)
- [ ] Set up monitoring and alerting for webhook failures

### Environment Variables

Production `.env` should have:

```bash
FLASK_ENV=production

# DocuSign Production
DOCUSIGN_INTEGRATION_KEY=<production-integration-key>
DOCUSIGN_IMPERSONATED_USER_ID=<production-user-guid>
DOCUSIGN_PRIVATE_KEY="<production-private-key>"
DOCUSIGN_CLIENT_ID=<production-integration-key>
DOCUSIGN_CLIENT_SECRET=<production-client-secret>
DOCUSIGN_USER_CONNECT_HMAC_SECRET=<production-hmac-secret>
DOCUSIGN_ACCOUNT_ID=<production-api-account-guid>
DOCUSIGN_BASE_URL=https://na3.docusign.net  # or your region
```

## Additional Resources

- [DocuSign Developer Center](https://developers.docusign.com)
- [DocuSign eSignature REST API](https://developers.docusign.com/docs/esign-rest-api/)
- [DocuSign Connect (Webhooks)](https://developers.docusign.com/platform/webhooks/)
- [JWT Grant Authentication](https://developers.docusign.com/platform/auth/jwt/)
- [OAuth 2.0 Authorization Code Grant](https://developers.docusign.com/platform/auth/authcode/)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review DocuSign API logs in developer account
3. Check application logs for detailed error messages
4. Contact DocuSign support for API-specific issues
