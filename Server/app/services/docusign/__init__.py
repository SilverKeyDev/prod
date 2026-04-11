"""
DocuSign services
"""

from .agreements import AgreementLifecycleService, RevisionService
from .core import DocusignClient, DocusignJWTAuth, DocusignOAuthService, get_jwt_auth
from .envelopes import EnvelopeBuilder, SigningService
from .errors import (
    AgreementNotFoundError,
    AgreementStateError,
    DocusignAPIError,
    DocusignAuthError,
    DocusignError,
    IdempotencyError,
    ParticipantNotFoundError,
    RevisionNotFoundError,
    TemplateNotFoundError,
    WebhookVerificationError,
)
from .signature import (
    NoOpSignatureProvider,
    SignatureProvider,
    SignatureRecipient,
    SignatureRequest,
    signature_provider,
)
from .templates import TemplateSyncService
from .webhooks import WebhookProcessor, verify_hmac, verify_oauth_token, verify_webhook

__all__ = [
    # Core
    "DocusignClient",
    "DocusignJWTAuth",
    "get_jwt_auth",
    "DocusignOAuthService",
    # Agreements
    "AgreementLifecycleService",
    "RevisionService",
    # Envelopes
    "EnvelopeBuilder",
    "SigningService",
    # Signature
    "SignatureProvider",
    "SignatureRequest",
    "SignatureRecipient",
    "NoOpSignatureProvider",
    "signature_provider",
    # Webhooks
    "WebhookProcessor",
    "verify_hmac",
    "verify_webhook",
    "verify_oauth_token",
    # Templates
    "TemplateSyncService",
    # Errors
    "DocusignError",
    "DocusignAuthError",
    "DocusignAPIError",
    "AgreementStateError",
    "AgreementNotFoundError",
    "ParticipantNotFoundError",
    "RevisionNotFoundError",
    "TemplateNotFoundError",
    "WebhookVerificationError",
    "IdempotencyError",
]
