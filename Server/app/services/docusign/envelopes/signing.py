"""
DocuSign signing URL generation

Generate embedded signing URLs for recipients.
"""

import os

from app.config import DOCUSIGN_SENDER_VIEW_PATH, DOCUSIGN_SIGNING_COMPLETE_PATH, Config
from app.models import Agreement, AgreementParticipant
from logger import LOG_CATEGORIES, get_logger

from ..core.client import DocusignClient
from ..errors import AgreementStateError

logger = get_logger()


def _docusign_return_url_base() -> str:
    """
    Origin used in DocuSign ``return_url`` (must match the browser origin hosting the iframe).

    Prefer ``DOCUSIGN_EMBEDDED_RETURN_URL_ORIGIN`` when it differs from the SPA origin
    (uncommon). Otherwise uses ``Config.FRONTEND_URL`` from ``FRONTEND_URL`` or ``FRONTEND_BASE_URL`` — in local dev set one of those to your HTTPS tunnel (ngrok)
    so Chrome Private Network Access does not block the post-sign redirect.
    """
    override = (os.getenv("DOCUSIGN_EMBEDDED_RETURN_URL_ORIGIN") or "").strip()
    if override:
        return override.rstrip("/")
    return Config.FRONTEND_URL.rstrip("/")


class SigningService:
    """Generate signing URLs for participants"""

    @staticmethod
    def get_signing_url(agreement: Agreement, participant: AgreementParticipant) -> str:
        """
        Get embedded signing URL for participant.

        Args:
            agreement: Agreement model
            participant: AgreementParticipant model

        Returns:
            Signing URL
        """
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Getting signing URL for participant",
            {
                "agreement_id": agreement.id,
                "participant_id": participant.id,
                "participant_email": participant.email,
                "agreement_status": agreement.status,
            },
        )

        if not agreement.docusign_envelope_id:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Cannot get signing URL - no envelope ID",
                {"agreement_id": agreement.id},
            )
            raise AgreementStateError("Agreement not sent to DocuSign")

        if agreement.status not in ("sent", "delivered", "signed"):
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Cannot get signing URL - invalid status",
                {"agreement_id": agreement.id, "status": agreement.status},
            )
            raise AgreementStateError(f"Cannot sign agreement with status: {agreement.status}")

        # Return URL must be publicly reachable HTTPS in dev (Chrome PNA) — see _docusign_return_url_base
        return_url = f"{_docusign_return_url_base()}{DOCUSIGN_SIGNING_COMPLETE_PATH.format(agreement_id=agreement.id)}"

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Building recipient data for signing",
            {
                "agreement_id": agreement.id,
                "participant_id": participant.id,
                "return_url": return_url,
            },
        )

        # Build recipient data
        recipient = {
            "recipientId": str(participant.id),
            "email": participant.email,
            "name": participant.name,
            "clientUserId": str(participant.id),  # For embedded signing
        }

        # Create client and get signing URL
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Calling DocuSign to create recipient view",
            {
                "agreement_id": agreement.id,
                "envelope_id": agreement.docusign_envelope_id,
                "participant_id": participant.id,
            },
        )

        client = DocusignClient(auth_type="jwt")
        signing_url = client.create_recipient_view(
            envelope_id=agreement.docusign_envelope_id, recipient=recipient, return_url=return_url
        )

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Signing URL generated successfully",
            {
                "agreement_id": agreement.id,
                "participant_id": participant.id,
                "envelope_id": agreement.docusign_envelope_id,
            },
        )

        return signing_url

    @staticmethod
    def get_sender_view_url(agreement: Agreement) -> str:
        """
        Get sender view URL for managing envelope.

        Args:
            agreement: Agreement model

        Returns:
            Sender view URL
        """
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Getting sender view URL",
            {"agreement_id": agreement.id, "envelope_id": agreement.docusign_envelope_id},
        )

        if not agreement.docusign_envelope_id:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Cannot get sender view URL - no envelope ID",
                {"agreement_id": agreement.id},
            )
            raise AgreementStateError("Agreement not sent to DocuSign")

        return_url = f"{_docusign_return_url_base()}{DOCUSIGN_SENDER_VIEW_PATH.format(agreement_id=agreement.id)}"

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Calling DocuSign to create sender view",
            {
                "agreement_id": agreement.id,
                "envelope_id": agreement.docusign_envelope_id,
                "return_url": return_url,
            },
        )

        # Create client and get sender view URL
        client = DocusignClient(auth_type="jwt")
        sender_url = client.get_sender_view(
            envelope_id=agreement.docusign_envelope_id, return_url=return_url
        )

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Sender view URL generated successfully",
            {"agreement_id": agreement.id, "envelope_id": agreement.docusign_envelope_id},
        )

        return sender_url
