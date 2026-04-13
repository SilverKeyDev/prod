# DocuSign Configuration Constants
# Note: The webhook URL is generated via get_docusign_webhook_connect_url() in _urls.py
#
# Secrets (integration key, RSA private key, client secrets, Connect HMAC) stay in env /
# secrets manager — not in this file.

# DocuSign Account Configuration
# Note: Connect Configuration (webhook listener) is managed in DocuSign UI
# The webhook endpoint receives events at the URL defined in _urls.py

# JWT Authentication Configuration
# DocuSign User ID GUID (Apps & Keys / same user you grant consent for). Never an internal app user id.
DOCUSIGN_IMPERSONATED_USER_ID_DEFAULT = "d3fa0f3e-253a-44df-8b0e-ae74dad062d4"
# API Account ID (GUID from Apps & Keys → API Account ID; demo example in README)
DOCUSIGN_API_ACCOUNT_ID_DEFAULT = "d020d926-48cc-4081-9179-46cb3c0a24f3"
# Primary account id for REST paths (/v2.1/accounts/{accountId}); same GUID as API Account ID
DOCUSIGN_ACCOUNT_ID_DEFAULT = "d020d926-48cc-4081-9179-46cb3c0a24f3"
# REST base for demo (pairs with account-d.docusign.com OAuth). Prod uses regional *.docusign.net from Apps & Keys.
DOCUSIGN_REST_BASE_URL_DEMO = "https://demo.docusign.net"
DOCUSIGN_BASE_URL_DEFAULT = DOCUSIGN_REST_BASE_URL_DEMO

# OAuth URLs (for app OAuth flow - agents connecting their DocuSign accounts)
# Demo environment
DOCUSIGN_OAUTH_AUTHORIZATION_URL_DEMO = "https://account-d.docusign.com/oauth/auth"
DOCUSIGN_OAUTH_TOKEN_URL_DEMO = "https://account-d.docusign.com/oauth/token"
# Production environment
DOCUSIGN_OAUTH_AUTHORIZATION_URL_PROD = "https://account.docusign.com/oauth/auth"
DOCUSIGN_OAUTH_TOKEN_URL_PROD = "https://account.docusign.com/oauth/token"

# Frontend Return URL Paths
DOCUSIGN_SIGNING_COMPLETE_PATH = "/agreements/{agreement_id}/complete"
DOCUSIGN_SENDER_VIEW_PATH = "/agreements/{agreement_id}"

# Organization-Level Connect Configuration
# These IDs are used for org-level webhook configurations
DOCUSIGN_WEBHOOK_ORGANIZATION_RECIPIENT_ID = "26eb98b1-0a60-4c34-82f1-8fa0d2d920cf"
DOCUSIGN_WEBHOOK_ORGANIZATION_SENDER_ID = "fc4e753c-d51a-461d-85cb-b33fd0f4845e"

# Organization OAuth Client ID (for org-level operations); prefer env in production.
DOCUSIGN_ORG_CLIENT_ID = ""

# OAuth for Connect (Webhook Authentication)
# Note: This is for DocuSign to authenticate TO YOUR webhook endpoint using OAuth
# You need to set up YOUR OWN OAuth 2.0 authorization server (Azure AD, Okta, Auth0, etc.)
# Then configure DocuSign Connect to use YOUR OAuth server URLs below
#
# Examples:
# - Azure AD: https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
# - Okta: https://{your-okta-domain}.okta.com/oauth2/default/v1/token
# - Auth0: https://{your-auth0-domain}.auth0.com/oauth/token
# - Custom: https://usesilverkey.com/oauth/token
#
# Leave blank to use HMAC-only authentication (recommended for v1)
