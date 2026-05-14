"""
Tests for DocuSign webhook processing (stored ``DocusignConnectEvent`` rows).
"""

import json
from datetime import datetime, timezone
from unittest.mock import patch

from flask import Flask


def _completed_payload() -> dict:
    return {
        "data": {
            "envelopeSummary": {
                "status": "completed",
                "completedDateTime": "2024-01-01T12:00:00Z",
            }
        }
    }


def _voided_payload() -> dict:
    return {
        "data": {
            "envelopeSummary": {
                "status": "voided",
                "voidedDateTime": "2024-01-01T12:00:00Z",
                "voidedReason": "Cancelled by sender",
            }
        }
    }


def _recipient_payload(recipient_id: str, status: str) -> dict:
    return {
        "data": {
            "envelopeSummary": {
                "status": "sent",
                "recipients": {
                    "signers": [
                        {
                            "recipientId": recipient_id,
                            "email": "signer@example.com",
                            "name": "Signer User",
                            "status": status,
                            "completedDateTime": "2024-01-01T12:00:00Z",
                        }
                    ]
                },
            }
        }
    }


class TestWebhookProcessor:
    """Exercise ``WebhookProcessor.process_envelope_event`` with real DB rows."""

    @staticmethod
    def _store_event(db_session, envelope_id: str, event_type: str, payload: dict) -> str:
        from app.models import DocusignConnectEvent

        event = DocusignConnectEvent(
            envelope_id=envelope_id,
            event_type=event_type,
            event_timestamp=datetime.now(timezone.utc),
            payload=json.dumps(payload),
        )
        db_session.session.add(event)
        db_session.session.commit()
        return event.id

    def test_process_envelope_completed_webhook(self, app: Flask, db_session, sample_agreement):
        from app.models import Agreement, DocusignConnectEvent
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with (
                patch("app.services.docusign.webhooks.processor_helpers.enqueue_fetch_documents"),
                patch(
                    "app.services.transactions.checklist_signature_completion.sync_checklist_for_completed_agreement"
                ),
                patch.object(WebhookProcessor, "_send_lifecycle_messages"),
            ):
                with patch(
                    "app.services.documents.document_library_items.sync_agreement_library_item"
                ):
                    agreement = Agreement(**sample_agreement)
                    agreement.docusign_envelope_id = "envelope-123"
                    agreement.status = "sent"
                    db_session.session.add(agreement)
                    db_session.session.commit()

                    event_id = self._store_event(
                        db_session, "envelope-123", "envelope-completed", _completed_payload()
                    )

                    WebhookProcessor.process_envelope_event(event_id)

                    updated = Agreement.query.get(agreement.id)
                    assert updated is not None
                    assert updated.status == "completed"
                    assert updated.completed_at is not None

                    ev = DocusignConnectEvent.query.get(event_id)
                    assert ev is not None
                    assert ev.processed is True

    def test_process_envelope_voided_webhook(self, app: Flask, db_session, sample_agreement):
        from app.models import Agreement, DocusignConnectEvent
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch.object(WebhookProcessor, "_send_lifecycle_messages"):
                with patch(
                    "app.services.documents.document_library_items.sync_agreement_library_item"
                ):
                    agreement = Agreement(**sample_agreement)
                    agreement.docusign_envelope_id = "envelope-123"
                    agreement.status = "sent"
                    db_session.session.add(agreement)
                    db_session.session.commit()

                    event_id = self._store_event(
                        db_session, "envelope-123", "envelope-voided", _voided_payload()
                    )

                    WebhookProcessor.process_envelope_event(event_id)

                    updated = Agreement.query.get(agreement.id)
                    assert updated is not None
                    assert updated.status == "voided"
                    assert updated.voided_at is not None

                    ev = DocusignConnectEvent.query.get(event_id)
                    assert ev is not None
                    assert ev.processed is True

    def test_process_recipient_completed_webhook(self, app: Flask, db_session, sample_agreement):
        from app.models import Agreement, AgreementParticipant, DocusignConnectEvent
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch.object(WebhookProcessor, "_send_lifecycle_messages"):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = "envelope-123"
                db_session.session.add(agreement)

                participant = AgreementParticipant(
                    agreement_id=agreement.id,
                    user_id="signer-123",
                    email="signer@example.com",
                    name="Signer User",
                    role="signer",
                    docusign_recipient_id="recipient-123",
                )
                db_session.session.add(participant)
                db_session.session.commit()

                rid = str(participant.id)
                event_id = self._store_event(
                    db_session,
                    "envelope-123",
                    "recipient-completed",
                    _recipient_payload(rid, "completed"),
                )

                WebhookProcessor.process_envelope_event(event_id)

                updated = AgreementParticipant.query.get(participant.id)
                assert updated is not None
                assert updated.recipient_status == "completed"

                ev = DocusignConnectEvent.query.get(event_id)
                assert ev is not None
                assert ev.processed is True

    def test_process_recipient_declined_webhook(self, app: Flask, db_session, sample_agreement):
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch.object(WebhookProcessor, "_send_lifecycle_messages"):
                with patch(
                    "app.services.documents.document_library_items.sync_agreement_library_item"
                ):
                    agreement = Agreement(**sample_agreement)
                    agreement.docusign_envelope_id = "envelope-123"
                    agreement.status = "sent"
                    db_session.session.add(agreement)

                    participant = AgreementParticipant(
                        agreement_id=agreement.id,
                        user_id="signer-123",
                        email="signer@example.com",
                        name="Signer User",
                        role="signer",
                        docusign_recipient_id="recipient-123",
                    )
                    db_session.session.add(participant)
                    db_session.session.commit()

                    rid = str(participant.id)
                    event_id = self._store_event(
                        db_session,
                        "envelope-123",
                        "recipient-declined",
                        _recipient_payload(rid, "declined"),
                    )

                    WebhookProcessor.process_envelope_event(event_id)

                    updated = AgreementParticipant.query.get(participant.id)
                    assert updated is not None
                    assert updated.recipient_status == "declined"

    def test_verify_hmac_accepts_matching_signature(self, app: Flask):
        import hashlib
        import hmac

        from app.services.docusign.webhooks import verification

        with app.app_context():
            payload = '{"event":"envelope-completed"}'
            secret = "unit-test-hmac-secret"
            expected = hmac.new(
                secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256
            ).hexdigest()

            with patch.object(verification.Config, "DOCUSIGN_USER_CONNECT_HMAC_SECRET", secret):
                assert verification.verify_hmac(payload, expected) is True

    def test_verify_hmac_rejects_mismatch(self, app: Flask):
        from app.services.docusign.webhooks import verification

        with app.app_context():
            with patch.object(verification.Config, "DOCUSIGN_USER_CONNECT_HMAC_SECRET", "secret"):
                assert verification.verify_hmac('{"a":1}', "deadbeef") is False

    def test_process_envelope_event_idempotent(self, app: Flask, db_session, sample_agreement):
        from app.models import Agreement, DocusignConnectEvent
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with (
                patch("app.services.docusign.webhooks.processor_helpers.enqueue_fetch_documents"),
                patch(
                    "app.services.transactions.checklist_signature_completion.sync_checklist_for_completed_agreement"
                ),
                patch.object(WebhookProcessor, "_send_lifecycle_messages"),
            ):
                with patch(
                    "app.services.documents.document_library_items.sync_agreement_library_item"
                ):
                    agreement = Agreement(**sample_agreement)
                    agreement.docusign_envelope_id = "envelope-123"
                    agreement.status = "sent"
                    db_session.session.add(agreement)
                    db_session.session.commit()

                    event_id = self._store_event(
                        db_session, "envelope-123", "envelope-completed", _completed_payload()
                    )

                    WebhookProcessor.process_envelope_event(event_id)
                    WebhookProcessor.process_envelope_event(event_id)

                    updated = Agreement.query.get(agreement.id)
                    assert updated is not None
                    assert updated.status == "completed"

                    ev = DocusignConnectEvent.query.get(event_id)
                    assert ev is not None
                    assert ev.processed is True

    def test_process_envelope_event_unknown_envelope(self, app: Flask, db_session):
        from app.models import DocusignConnectEvent
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            event_id = self._store_event(
                db_session, "unknown-envelope-456", "envelope-completed", _completed_payload()
            )

            WebhookProcessor.process_envelope_event(event_id)

            ev = DocusignConnectEvent.query.get(event_id)
            assert ev is not None
            assert ev.processing_error == "Agreement not found"
