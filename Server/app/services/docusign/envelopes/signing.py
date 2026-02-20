"""
DocuSign signing URL generation

Generate embedded signing URLs for recipients.
"""

from app.config import DOCUSIGN_SENDER_VIEW_PATH, DOCUSIGN_SIGNING_COMPLETE_PATH, Config
from app.models import Agreement, AgreementParticipant
from logger import LOG_CATEGORIES, get_logger

from ..core.client import DocusignClient
from ..errors import AgreementStateError

logger = get_logger()


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

        if agreement.status not in ["sent", "delivered"]:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Cannot get signing URL - invalid status",
                {"agreement_id": agreement.id, "status": agreement.status},
            )
            raise AgreementStateError(f"Cannot sign agreement with status: {agreement.status}")

        # Get return URL from config
        return_url = f"{Config.FRONTEND_URL}{DOCUSIGN_SIGNING_COMPLETE_PATH.format(agreement_id=agreement.id)}"

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

        # Get return URL
        return_url = (
            f"{Config.FRONTEND_URL}{DOCUSIGN_SENDER_VIEW_PATH.format(agreement_id=agreement.id)}"
        )

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
