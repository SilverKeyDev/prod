"""
DocuSign recipient resend and envelope notification updates (post-send).
"""

from __future__ import annotations

from app.models import AgreementParticipant
from app.schemas.generated import DocusignUpdateEnvelopeNotificationRequest
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, get_logger

from ..agreements.agreement_crud import get_agreement
from ..core.client import DocusignClient
from ..errors import AgreementStateError
from .notification_settings import build_envelope_notification_request_for_update

logger = get_logger()


def resend_agreement_recipient(agreement_id: str, participant_id: str, note: str | None) -> dict:
    """
    Trigger DocuSign to resend the envelope email to one pending signer.

    Uses server-stored name/email; optional note is capped at DocuSign limits.
    """
    agreement = get_agreement(agreement_id)
    if not agreement.docusign_envelope_id:
        raise AgreementStateError("Agreement has no DocuSign envelope")

    participant = get_model(AgreementParticipant, participant_id)
    if not participant or participant.agreement_id != agreement.id:
        raise AgreementStateError("Participant not found on this agreement")
    if participant.role != "signer":
        raise AgreementStateError("Only signer recipients can be resent")
    if participant.recipient_status in ("signed", "completed", "declined", "autoresponded"):
        raise AgreementStateError("Recipient has already finished or declined signing")

    note_clean = (note or "").strip()
    if len(note_clean) > 1000:
        raise AgreementStateError("note exceeds maximum length")

    from docusign_esign import Recipients, Signer

    signer = Signer(
        recipient_id=str(participant.id),
        name=participant.name,
        email=participant.email,
        note=note_clean or None,
    )
    client = DocusignClient(auth_type="jwt")
    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Resending DocuSign envelope to participant",
        {"agreement_id": agreement_id, "participant_id": participant_id},
    )
    return client.update_recipients_resend(
        agreement.docusign_envelope_id,
        Recipients(signers=[signer]),
    )


def update_agreement_envelope_notification(
    agreement_id: str,
    body: DocusignUpdateEnvelopeNotificationRequest,
) -> dict:
    """Update reminder/expiration settings on an in-flight envelope."""
    agreement = get_agreement(agreement_id)
    if not agreement.docusign_envelope_id:
        raise AgreementStateError("Agreement has no DocuSign envelope")

    req = build_envelope_notification_request_for_update(body)
    client = DocusignClient(auth_type="jwt")
    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Updating DocuSign envelope notification settings",
        {"agreement_id": agreement_id},
    )
    return client.update_notification_settings(agreement.docusign_envelope_id, req)
