"""
DocuSign utilities
"""

from .idempotency import generate_envelope_key, generate_file_hash, generate_webhook_key
from .permissions import (
    can_access_agreement,
    can_access_oauth,
    can_add_participants,
    can_create_revision,
    can_discard_agreement_as_agent,
    can_get_signing_url,
    can_modify_agreement,
    can_send_agreement,
    can_void_agreement,
)
from .recipients import (
    build_carbon_copies,
    build_recipient_from_participant,
    build_recipients_from_participants,
    build_signers,
    validate_participants,
)

__all__ = [
    # Permissions
    "can_access_agreement",
    "can_modify_agreement",
    "can_send_agreement",
    "can_void_agreement",
    "can_discard_agreement_as_agent",
    "can_get_signing_url",
    "can_add_participants",
    "can_create_revision",
    "can_access_oauth",
    # Idempotency
    "generate_envelope_key",
    "generate_webhook_key",
    "generate_file_hash",
    # Recipients
    "build_recipient_from_participant",
    "build_signers",
    "build_carbon_copies",
    "build_recipients_from_participants",
    "validate_participants",
]
