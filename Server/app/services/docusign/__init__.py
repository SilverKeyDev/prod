"""
DocuSign services
"""

from .core import DocusignClient, DocusignJWTAuth, get_jwt_auth, DocusignOAuthService
from .agreements import AgreementLifecycleService, RevisionService
from .envelopes import EnvelopeBuilder, SigningService
from .webhooks import WebhookProcessor, verify_hmac, verify_webhook, verify_oauth_token
from .templates import TemplateSyncService
from .errors import (
    DocusignError,
    DocusignAuthError,
    DocusignAPIError,
    AgreementStateError,
    AgreementNotFoundError,
    ParticipantNotFoundError,
    RevisionNotFoundError,
    TemplateNotFoundError,
    WebhookVerificationError,
    IdempotencyError
)

__all__ = [
    # Core
    'DocusignClient',
    'DocusignJWTAuth',
    'get_jwt_auth',
    'DocusignOAuthService',
    # Agreements
    'AgreementLifecycleService',
    'RevisionService',
    # Envelopes
    'EnvelopeBuilder',
    'SigningService',
    # Webhooks
    'WebhookProcessor',
    'verify_hmac',
    'verify_webhook',
    'verify_oauth_token',
    # Templates
    'TemplateSyncService',
    # Errors
    'DocusignError',
    'DocusignAuthError',
    'DocusignAPIError',
    'AgreementStateError',
    'AgreementNotFoundError',
    'ParticipantNotFoundError',
    'RevisionNotFoundError',
    'TemplateNotFoundError',
    'WebhookVerificationError',
    'IdempotencyError',
]
