"""
Agreement signing URL operations: get signing URL and sender view URL.
"""

from app.models import AgreementParticipant
from app.utils.db.orm_lookup import get_model
from logger import LOG_CATEGORIES, get_logger

from ..envelopes.signing import SigningService
from .agreement_crud import get_agreement

logger = get_logger()


def get_signing_url(agreement_id: str, participant_id: str) -> str:
    """
    Get embedded signing URL for participant.

    Args:
        agreement_id: Agreement ID
        participant_id: Participant ID

    Returns:
        Signing URL
    """
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Getting signing URL",
        {"agreement_id": agreement_id, "participant_id": participant_id},
    )

    agreement = get_agreement(agreement_id)

    participant = get_model(AgreementParticipant, participant_id)
    if not participant or participant.agreement_id != agreement_id:
        logger.warn(
            LOG_CATEGORIES["DOCUSIGN"],
            "Participant not found for signing URL",
            {"agreement_id": agreement_id, "participant_id": participant_id},
        )
        from ..errors import ParticipantNotFoundError

        raise ParticipantNotFoundError(f"Participant {participant_id} not found")

    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Generating signing URL via SigningService",
        {
            "agreement_id": agreement_id,
            "participant_id": participant_id,
            "participant_email": participant.email,
        },
    )

    signing_url = SigningService.get_signing_url(agreement, participant)

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Signing URL generated successfully",
        {"agreement_id": agreement_id, "participant_id": participant_id},
    )

    return signing_url


def get_sender_view_url(agreement_id: str) -> str:
    """
    Get sender view URL for agreement owner (agent).

    Args:
        agreement_id: Agreement ID

    Returns:
        Sender view URL
    """
    logger.debug(
        LOG_CATEGORIES["DOCUSIGN"],
        "Getting sender view URL",
        {"agreement_id": agreement_id},
    )

    agreement = get_agreement(agreement_id)
    sender_url = SigningService.get_sender_view_url(agreement)

    logger.info(
        LOG_CATEGORIES["DOCUSIGN"],
        "Sender view URL generated successfully",
        {"agreement_id": agreement_id},
    )

    return sender_url
