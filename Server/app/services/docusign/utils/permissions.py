"""
DocuSign permission helpers

Authorization checks for DocuSign operations.
"""

from app.models import Agreement, AgreementParticipant, User
from app.services.auth.user_role_helpers import user_is_agent


def can_access_agreement(user: User, agreement: Agreement) -> bool:
    """
    Check if user can access (view) an agreement.

    Args:
        user: User attempting access
        agreement: Agreement to check

    Returns:
        True if user can access, False otherwise
    """
    if not user or not agreement:
        return False

    # Agent or buyer can access
    return user.id == agreement.agent_id or user.id == agreement.buyer_id


def can_modify_agreement(user: User, agreement: Agreement) -> bool:
    """
    Check if user can modify an agreement.

    Args:
        user: User attempting modification
        agreement: Agreement to check

    Returns:
        True if user can modify, False otherwise
    """
    if not user or not agreement:
        return False

    # Only agent (owner) can modify
    return user.id == agreement.agent_id


def can_send_agreement(user: User, agreement: Agreement) -> bool:
    """
    Check if user can send an agreement for signature.

    Args:
        user: User attempting to send
        agreement: Agreement to check

    Returns:
        True if user can send, False otherwise
    """
    if not user or not agreement:
        return False

    # Only agent (owner) can send
    # Must be in draft state
    return user.id == agreement.agent_id and agreement.status == "draft"


def can_manage_in_flight_docusign_envelope(user: User, agreement: Agreement) -> bool:
    """
    Agent may resend recipients or update reminder settings while the envelope is active.

    Allowed when an envelope exists and the agreement is not terminal.
    """
    if not user or not agreement:
        return False
    if user.id != agreement.agent_id:
        return False
    if not agreement.docusign_envelope_id:
        return False
    return agreement.status in ("sent", "delivered", "signed")


def can_void_agreement(user: User, agreement: Agreement) -> bool:
    """
    Check if user can void an agreement.

    Args:
        user: User attempting to void
        agreement: Agreement to check

    Returns:
        True if user can void, False otherwise
    """
    if not user or not agreement:
        return False

    # Only agent (owner) can void
    # Cannot void if already completed or voided
    return user.id == agreement.agent_id and agreement.status not in ["completed", "voided"]


def can_discard_agreement_as_agent(user: User, agreement: Agreement) -> bool:
    """Listing agent may discard from Saved (void or library strip) regardless of envelope stage."""
    if not user or not agreement:
        return False
    return user.id == agreement.agent_id


def can_get_signing_url(
    user: User, agreement: Agreement, participant: AgreementParticipant
) -> bool:
    """
    Check if user can get a signing URL for a participant.

    Args:
        user: User requesting signing URL
        agreement: Agreement
        participant: Participant for signing URL

    Returns:
        True if user can get signing URL, False otherwise
    """
    if not user or not agreement or not participant:
        return False

    # Must be the participant themselves
    if participant.user_id:
        return user.id == participant.user_id

    # If no user_id (external participant), check email
    return user.email == participant.email


def can_add_participants(user: User, agreement: Agreement) -> bool:
    """
    Check if user can add participants to an agreement.

    Args:
        user: User attempting to add participants
        agreement: Agreement to check

    Returns:
        True if user can add participants, False otherwise
    """
    if not user or not agreement:
        return False

    # Only agent (owner) can add participants
    # Can only add if still in draft
    return user.id == agreement.agent_id and agreement.status == "draft"


def can_create_revision(user: User, agreement: Agreement) -> bool:
    """
    Check if user can create a new revision for an agreement.

    Args:
        user: User attempting to create revision
        agreement: Agreement to check

    Returns:
        True if user can create revision, False otherwise
    """
    if not user or not agreement:
        return False

    # Only agent (owner) can create revisions
    return user.id == agreement.agent_id


def can_access_oauth(user: User | None) -> bool:
    """
    Check if user can access DocuSign OAuth features.

    Args:
        user: User to check

    Returns:
        True if user can access OAuth, False otherwise
    """
    # Only agents can connect OAuth
    return user_is_agent(user)
