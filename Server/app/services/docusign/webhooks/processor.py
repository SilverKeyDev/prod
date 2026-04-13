"""
DocuSign webhook processor

Process DocuSign Connect webhook events and update agreement state.
"""

import json
from datetime import datetime, timezone
from typing import Any

from app import db
from app.models import Agreement, AgreementEvent, DocusignConnectEvent
from logger import LOG_CATEGORIES, get_logger

from .processor_helpers import (
    build_event_description,
    enqueue_fetch_documents,
    extract_recipients_for_webhook,
    map_event_type,
)
from .processor_participants import update_participants

logger = get_logger()


class WebhookProcessor:
    """Process DocuSign Connect webhook events"""

    @staticmethod
    def process_envelope_event(event_id: str):
        """
        Process a stored webhook event.

        Args:
            event_id: DocusignConnectEvent ID
        """
        try:
            # Load event
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Loading webhook event for processing",
                {"event_id": event_id},
            )

            event = DocusignConnectEvent.query.get(event_id)
            if not event:
                logger.error(
                    LOG_CATEGORIES["ERRORS"], "Webhook event not found", {"event_id": event_id}
                )
                return

            if event.processed:
                logger.debug(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Webhook event already processed",
                    {"event_id": event_id, "envelope_id": event.envelope_id},
                )
                return

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Processing webhook event",
                {
                    "event_id": event_id,
                    "envelope_id": event.envelope_id,
                    "event_type": event.event_type,
                    "event_timestamp": event.event_timestamp,
                },
            )

            # Parse payload
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Parsing webhook payload",
                {"event_id": event_id, "payload_size": len(event.payload)},
            )

            try:
                payload = json.loads(event.payload)
            except json.JSONDecodeError as e:
                logger.error(
                    LOG_CATEGORIES["ERRORS"],
                    "Failed to parse webhook payload",
                    {"event_id": event_id, "error": str(e)},
                )
                event.processing_error = f"JSON parse error: {str(e)}"
                db.session.commit()
                return

            # Find agreement by envelope ID
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Looking up agreement by envelope ID",
                {"event_id": event_id, "envelope_id": event.envelope_id},
            )

            agreement = Agreement.query.filter_by(docusign_envelope_id=event.envelope_id).first()

            if not agreement:
                logger.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Agreement not found for envelope",
                    {"event_id": event_id, "envelope_id": event.envelope_id},
                )
                event.processing_error = "Agreement not found"
                db.session.commit()
                return

            # Process based on event type
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Processing event for agreement",
                {
                    "event_id": event_id,
                    "agreement_id": agreement.id,
                    "event_type": event.event_type,
                },
            )

            WebhookProcessor._process_event(agreement, payload, event.event_type)

            # Mark event as processed
            event.processed = True
            event.processed_at = datetime.now(timezone.utc)
            event.processing_error = None

            db.session.commit()

            logger.info(
                LOG_CATEGORIES["DOCUSIGN"],
                "Webhook event processed successfully",
                {
                    "event_id": event_id,
                    "agreement_id": agreement.id,
                    "envelope_id": event.envelope_id,
                    "event_type": event.event_type,
                },
            )

        except Exception as e:
            logger.error(
                LOG_CATEGORIES["ERRORS"],
                "Webhook processing failed",
                {"event_id": event_id, "error": str(e)},
            )

            # Update error
            try:
                event = DocusignConnectEvent.query.get(event_id)
                if event:
                    event.processing_error = str(e)
                    db.session.commit()
            except Exception as db_exc:
                logger.error(
                    LOG_CATEGORIES["ERRORS"],
                    "Failed to update event error",
                    {"event_id": event_id, "error": str(db_exc)},
                )

            raise

    @staticmethod
    def _send_lifecycle_messages(agreement: Agreement, event_type: str, old_status: str):
        """
        Send SilverKey in-app messages for key signing milestones.

        Uses auto_commit=False so all chat rows are flushed inside the
        caller's transaction and committed together with event.processed.
        """
        from ..notifications import send_agreement_message

        if event_type in ("recipient-signed", "recipient-completed"):
            participants = list(agreement.participants)  # pyright: ignore[reportArgumentType]
            client_participant = next(
                (p for p in participants if p.user_id == agreement.buyer_id), None
            )
            agent_participant = next(
                (p for p in participants if p.user_id == agreement.agent_id), None
            )

            client_signed = client_participant and client_participant.recipient_status in (
                "signed",
                "completed",
            )
            agent_signed = agent_participant and agent_participant.recipient_status in (
                "signed",
                "completed",
            )

            if client_signed and not agent_signed:
                send_agreement_message(agreement, "client_signed", auto_commit=False)
            elif agent_signed:
                # Send agent_signed even when envelope is already completed;
                # the "completed" message below handles the final status separately.
                send_agreement_message(agreement, "agent_signed", auto_commit=False)

        if agreement.status == "completed" and old_status != "completed":
            send_agreement_message(agreement, "completed", auto_commit=False)

    @staticmethod
    def _process_event(agreement: Agreement, payload: dict[str, Any], event_type: str):
        """Process specific event type"""

        logger.debug(
            LOG_CATEGORIES["DOCUSIGN"],
            "Processing envelope status update",
            {
                "agreement_id": agreement.id,
                "event_type": event_type,
                "current_status": agreement.status,
            },
        )

        # Extract envelope and recipient data
        envelope_data = payload.get("envelopeStatus") or payload.get("data", {}).get(
            "envelopeSummary", {}
        )

        # Update agreement status
        old_status = agreement.status
        new_docusign_status = envelope_data.get("status")

        if new_docusign_status:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Updating agreement status",
                {
                    "agreement_id": agreement.id,
                    "old_status": old_status,
                    "new_docusign_status": new_docusign_status,
                },
            )

            agreement.docusign_status = new_docusign_status

            # Map DocuSign status to our status (delivered = opened email → keep as sent)
            status_mapping = {
                "sent": "sent",
                "delivered": "sent",
                "signed": "signed",
                "completed": "completed",
                "declined": "declined",
                "voided": "voided",
            }

            if new_docusign_status in status_mapping:
                agreement.status = status_mapping[new_docusign_status]

                if old_status != agreement.status:
                    logger.info(
                        LOG_CATEGORIES["DOCUSIGN"],
                        "Agreement status changed",
                        {
                            "agreement_id": agreement.id,
                            "old_status": old_status,
                            "new_status": agreement.status,
                            "docusign_status": new_docusign_status,
                        },
                    )

        # Update timestamps
        if envelope_data.get("sentDateTime") and not agreement.sent_at:
            try:
                agreement.sent_at = datetime.fromisoformat(
                    envelope_data["sentDateTime"].replace("Z", "+00:00")
                )
            except (ValueError, TypeError) as e:
                logger.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Failed to parse envelope sentDateTime",
                    {
                        "agreement_id": agreement.id,
                        "sentDateTime": envelope_data.get("sentDateTime"),
                        "error": str(e),
                    },
                )

        if envelope_data.get("completedDateTime") and not agreement.completed_at:
            try:
                agreement.completed_at = datetime.fromisoformat(
                    envelope_data["completedDateTime"].replace("Z", "+00:00")
                )
            except (ValueError, TypeError) as e:
                logger.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Failed to parse envelope completedDateTime",
                    {
                        "agreement_id": agreement.id,
                        "completedDateTime": envelope_data.get("completedDateTime"),
                        "error": str(e),
                    },
                )

        if envelope_data.get("voidedDateTime") and not agreement.voided_at:
            try:
                agreement.voided_at = datetime.fromisoformat(
                    envelope_data["voidedDateTime"].replace("Z", "+00:00")
                )
            except (ValueError, TypeError) as e:
                logger.warn(
                    LOG_CATEGORIES["DOCUSIGN"],
                    "Failed to parse envelope voidedDateTime",
                    {
                        "agreement_id": agreement.id,
                        "voidedDateTime": envelope_data.get("voidedDateTime"),
                        "error": str(e),
                    },
                )

        # Process recipient status changes (normalize Connect JSON shape)
        recipients = extract_recipients_for_webhook(envelope_data, payload)
        if (
            not recipients.get("signers")
            and not recipients.get("carbonCopies")
            and "recipient" in event_type
        ):
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Connect payload had no signer/CC blocks for a recipient event",
                {
                    "agreement_id": agreement.id,
                    "event_type": event_type,
                },
            )
        update_participants(agreement, recipients)

        # Create timeline event
        event_description = build_event_description(
            event_type, old_status, agreement.status, envelope_data
        )

        timeline_event = AgreementEvent(
            agreement_id=agreement.id,
            event_type=map_event_type(event_type),
            description=event_description,
            actor_id=None,  # System event
            metadata=json.dumps(
                {"docusign_event": event_type, "docusign_status": new_docusign_status}
            ),
        )

        db.session.add(timeline_event)

        # If completed, enqueue document fetch task
        if agreement.status == "completed" and not agreement.signed_document_path:
            logger.debug(
                LOG_CATEGORIES["DOCUSIGN"],
                "Agreement completed - enqueueing document fetch",
                {"agreement_id": agreement.id},
            )
            enqueue_fetch_documents(agreement.id)

        # Send in-app messaging notifications for key lifecycle transitions
        WebhookProcessor._send_lifecycle_messages(agreement, event_type, old_status)
