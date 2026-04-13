"""
DocuSign error classes

Custom exception hierarchy for DocuSign operations.
"""


class DocusignError(Exception):
    """Base DocuSign error"""

    pass


class DocusignAuthError(DocusignError):
    """Authentication/authorization error with DocuSign"""

    pass


class DocusignAPIError(DocusignError):
    """DocuSign API error with details"""

    def __init__(self, message, status_code=None, response_body=None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body

    def __str__(self):
        base = super().__str__()
        if self.status_code:
            return f"{base} (status: {self.status_code})"
        return base


class AgreementStateError(DocusignError):
    """Invalid agreement state for operation"""

    pass


class AgreementNotFoundError(DocusignError):
    """Agreement not found"""

    pass


class ParticipantNotFoundError(DocusignError):
    """Participant not found"""

    pass


class RevisionNotFoundError(DocusignError):
    """Revision not found"""

    pass


class InvalidRevisionFileError(DocusignError):
    """Uploaded revision bytes are not a readable PDF (or empty)."""

    pass


class TemplateNotFoundError(DocusignError):
    """Template not found"""

    pass


class WebhookVerificationError(DocusignError):
    """Webhook HMAC verification failed"""

    pass


class IdempotencyError(DocusignError):
    """Idempotency constraint violation"""

    pass
