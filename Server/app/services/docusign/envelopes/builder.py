"""
DocuSign envelope builder

Construct envelope definitions from agreements.
"""

import base64
from typing import Any

from docusign_esign import (
    CustomFields,
    Document,
    EnvelopeDefinition,
    PrefillTabs,
    Recipients,
    TextCustomField,
)

from app.models import Agreement, AgreementParticipant
from app.schemas.generated import DocuSignEnvelopeNotificationInput
from app.services.documents.s3_service import s3_service
from logger import LOG_CATEGORIES, get_logger

from ..errors import AgreementStateError
from ..utils.recipients import build_recipients_from_participants, validate_participants
from .notification_settings import build_notification_for_envelope_create
from .tab_prefill import (
    build_prefill_tabs_model,
    parse_tab_prefill_by_participant,
    prefill_tabs_nonempty,
)

logger = get_logger()


class EnvelopeBuilder:
    """Build DocuSign envelope from Agreement"""

    def __init__(
        self,
        agreement: Agreement,
        signing_method: str = "embedded",
        envelope_options: dict[str, Any] | None = None,
    ):
        """
        Initialize envelope builder.

        Args:
            agreement: Agreement model
            signing_method: 'embedded' or 'email'
            envelope_options: Optional payload from SendAgreementRequest (notification, tab prefill).
        """
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Initializing envelope builder",
            {"agreement_id": agreement.id, "signing_method": signing_method},
        )

        self.agreement = agreement
        self.signing_method = signing_method
        self.envelope_options = envelope_options or {}
        override_raw = self.envelope_options.get("envelope_notification")
        override = (
            DocuSignEnvelopeNotificationInput.model_validate(override_raw) if override_raw else None
        )
        self._notification = build_notification_for_envelope_create(override)
        self._tab_prefill_by_pid = parse_tab_prefill_by_participant(
            self.envelope_options.get("tab_prefill")
        )
        self._prefill_tabs = build_prefill_tabs_model(
            self.envelope_options.get("envelope_prefill_tabs")
        )

        # Validate agreement state
        self._validate()

    @property
    def prefill_tabs(self) -> PrefillTabs | None:
        """Sender prefill tabs merged into create envelope body when non-empty."""
        return self._prefill_tabs if prefill_tabs_nonempty(self._prefill_tabs) else None

    def _validate(self):
        """Validate agreement can be sent"""
        # RelationshipProperty resolves to collection at runtime; Pyright does not treat it as Iterable
        participants_list = list(self.agreement.participants)  # pyright: ignore[reportArgumentType]
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Validating agreement for envelope building",
            {
                "agreement_id": self.agreement.id,
                "has_revision": bool(self.agreement.current_revision),
                "participant_count": len(participants_list),
            },
        )

        if not self.agreement.current_revision:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreement validation failed - no revision",
                {"agreement_id": self.agreement.id},
            )
            raise AgreementStateError("Agreement has no current revision")

        if not participants_list:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreement validation failed - no participants",
                {"agreement_id": self.agreement.id},
            )
            raise AgreementStateError("Agreement has no participants")

        # Validate participants
        is_valid, error = validate_participants(participants_list)
        if not is_valid:
            logger.warn(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreement validation failed - invalid participants",
                {"agreement_id": self.agreement.id, "error": error},
            )
            raise AgreementStateError(error)

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Agreement validation successful",
            {"agreement_id": self.agreement.id},
        )

    def build(self) -> EnvelopeDefinition:
        """Build envelope definition"""
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Building envelope definition",
            {
                "agreement_id": self.agreement.id,
                "signing_method": self.signing_method,
                "email_subject": self.agreement.title,
            },
        )

        # Build document
        document = self._build_document()

        # Build recipients
        recipients = self._build_recipients()

        # Build envelope
        envelope = EnvelopeDefinition(
            email_subject=self.agreement.title,
            documents=[document],
            recipients=recipients,
            custom_fields=self._build_custom_fields(),
            notification=self._notification,
            status="sent",  # Send immediately
        )

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Envelope definition built successfully",
            {"agreement_id": self.agreement.id, "signing_method": self.signing_method},
        )

        return envelope

    def _first_signer_recipient_id(self) -> str:
        """Recipient ID (participant UUID) for assignTabsToRecipientId / PDF field transform."""
        participants_list = list(self.agreement.participants)  # pyright: ignore[reportArgumentType]
        signers: list[AgreementParticipant] = [p for p in participants_list if p.role == "signer"]
        if not signers:
            raise AgreementStateError("Agreement has no signers")
        first = min(signers, key=lambda p: (p.routing_order or 1, str(p.id)))
        return str(first.id)

    def _build_custom_fields(self) -> CustomFields:
        """Envelope-level text custom fields for DocuSign search / reporting (not on the PDF)."""
        agreement = self.agreement
        return CustomFields(
            text_custom_fields=[
                TextCustomField(
                    name="agreement_id",
                    value=str(agreement.id),
                    show="true",
                    required="false",
                ),
                TextCustomField(
                    name="buyer_id",
                    value=str(agreement.buyer_id),
                    show="true",
                    required="false",
                ),
                TextCustomField(
                    name="agent_id",
                    value=str(agreement.agent_id),
                    show="true",
                    required="false",
                ),
            ]
        )

    def _build_document(self) -> Document:
        """Build document from current revision"""
        revision = self.agreement.current_revision
        if revision is None:
            raise AgreementStateError("Agreement has no current revision")

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Building document from revision",
            {
                "agreement_id": self.agreement.id,
                "revision_id": revision.id,
                "filename": revision.filename,
                "file_path": revision.file_path,
            },
        )

        # Fetch document from S3
        try:
            file_bytes = s3_service.get_pdf(revision.file_path)
            if not file_bytes:
                logger.error(
                    LOG_CATEGORIES["ERRORS"],
                    "Failed to fetch document from S3 - empty response",
                    {"agreement_id": self.agreement.id, "file_path": revision.file_path},
                )
                raise AgreementStateError("Failed to fetch document from S3")

            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Document fetched from S3",
                {
                    "agreement_id": self.agreement.id,
                    "size_bytes": len(file_bytes),
                    "size_kb": len(file_bytes) / 1024,
                },
            )
        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "Failed to fetch document from S3",
                {
                    "agreement_id": self.agreement.id,
                    "file_path": revision.file_path,
                    "error": str(e),
                },
            )
            raise AgreementStateError(f"Failed to fetch document: {str(e)}") from e

        # Encode to base64
        doc_base64 = base64.b64encode(file_bytes).decode("utf-8")

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Document encoded to base64",
            {"agreement_id": self.agreement.id, "base64_length": len(doc_base64)},
        )

        document = Document(
            document_base64=doc_base64,
            name=revision.filename,
            file_extension=revision.mime_type.split("/")[-1],
            document_id="1",
            transform_pdf_fields="true",
            assign_tabs_to_recipient_id=self._first_signer_recipient_id(),
        )

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Document built successfully",
            {"agreement_id": self.agreement.id, "filename": revision.filename},
        )

        return document

    def _build_recipients(self) -> Recipients:
        """Build recipients from participants"""
        # RelationshipProperty resolves to collection at runtime; Pyright does not treat it as Iterable
        participants_list = list(self.agreement.participants)  # pyright: ignore[reportArgumentType]
        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Building recipients from participants",
            {
                "agreement_id": self.agreement.id,
                "participant_count": len(participants_list),
                "signing_method": self.signing_method,
            },
        )

        recipients_dict = build_recipients_from_participants(
            participants_list, tab_prefill_by_pid=self._tab_prefill_by_pid or None
        )

        # Always set clientUserId so embedded signing works; DocuSign may still email signers.
        if "signers" in recipients_dict:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Setting clientUserId for signers",
                {
                    "agreement_id": self.agreement.id,
                    "signer_count": len(recipients_dict["signers"]),
                },
            )
            for signer in recipients_dict["signers"]:
                signer["clientUserId"] = signer["recipientId"]

        recipients = Recipients(**recipients_dict)

        logger.info(
            LOG_CATEGORIES["DOCUSIGN"],
            "Recipients built successfully",
            {
                "agreement_id": self.agreement.id,
                "signer_count": len(recipients_dict.get("signers", [])),
                "cc_count": len(recipients_dict.get("carbonCopies", [])),
            },
        )

        return recipients
