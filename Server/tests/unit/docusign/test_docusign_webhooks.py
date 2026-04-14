"""
Tests for DocuSign webhook processing
"""

from datetime import datetime
from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestWebhookProcessor:
    """Test DocuSign webhook processing"""

    def test_process_envelope_completed_webhook(
        self, app: Flask, db_session, sample_agreement
    ):
        """Test processing envelope completed webhook"""
        from app.models import Agreement
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch(
                "app.services.documents.document_library_items.sync_agreement_library_item"
            ):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = "envelope-123"
                agreement.status = "sent"
                db_session.add(agreement)
                db_session.commit()

                webhook_data = {
                    "event": "envelope-completed",
                    "data": {
                        "envelopeId": "envelope-123",
                        "status": "completed",
                        "completedDateTime": "2024-01-01T12:00:00Z",
                    },
                }

                result = WebhookProcessor.process_webhook(webhook_data)

                assert result["success"] is True
                updated = Agreement.query.get(agreement.id)
                assert updated.status == "completed"
                assert updated.signed_at is not None

    def test_process_envelope_voided_webhook(
        self, app: Flask, db_session, sample_agreement
    ):
        """Test processing envelope voided webhook"""
        from app.models import Agreement
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch(
                "app.services.documents.document_library_items.sync_agreement_library_item"
            ):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = "envelope-123"
                agreement.status = "sent"
                db_session.add(agreement)
                db_session.commit()

                webhook_data = {
                    "event": "envelope-voided",
                    "data": {
                        "envelopeId": "envelope-123",
                        "status": "voided",
                        "voidedDateTime": "2024-01-01T12:00:00Z",
                        "voidedReason": "Cancelled by sender",
                    },
                }

                result = WebhookProcessor.process_webhook(webhook_data)

                assert result["success"] is True
                updated = Agreement.query.get(agreement.id)
                assert updated.status == "voided"
                assert updated.voided_at is not None

    def test_process_recipient_completed_webhook(
        self, app: Flask, db_session, sample_agreement
    ):
        """Test processing recipient completed webhook"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            agreement.docusign_envelope_id = "envelope-123"
            db_session.add(agreement)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                docusign_recipient_id="recipient-123",
            )
            db_session.add(participant)
            db_session.commit()

            webhook_data = {
                "event": "recipient-completed",
                "data": {
                    "envelopeId": "envelope-123",
                    "recipientId": "recipient-123",
                    "status": "completed",
                    "completedDateTime": "2024-01-01T12:00:00Z",
                },
            }

            result = WebhookProcessor.process_webhook(webhook_data)

            assert result["success"] is True
            updated_participant = AgreementParticipant.query.get(participant.id)
            assert updated_participant.status == "completed"
            assert updated_participant.signed_at is not None

    def test_process_recipient_declined_webhook(
        self, app: Flask, db_session, sample_agreement
    ):
        """Test processing recipient declined webhook"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch(
                "app.services.documents.document_library_items.sync_agreement_library_item"
            ):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = "envelope-123"
                agreement.status = "sent"
                db_session.add(agreement)

                participant = AgreementParticipant(
                    agreement_id=agreement.id,
                    user_id="signer-123",
                    email="signer@example.com",
                    name="Signer User",
                    role="signer",
                    docusign_recipient_id="recipient-123",
                )
                db_session.add(participant)
                db_session.commit()

                webhook_data = {
                    "event": "recipient-declined",
                    "data": {
                        "envelopeId": "envelope-123",
                        "recipientId": "recipient-123",
                        "status": "declined",
                        "declinedDateTime": "2024-01-01T12:00:00Z",
                        "declinedReason": "Not interested",
                    },
                }

                result = WebhookProcessor.process_webhook(webhook_data)

                assert result["success"] is True
                updated_participant = AgreementParticipant.query.get(participant.id)
                assert updated_participant.status == "declined"

    def test_webhook_verification(self, app: Flask):
        """Test webhook HMAC verification"""
        from app.services.docusign.webhooks.verification import verify_webhook_hmac

        with app.app_context():
            webhook_body = '{"event":"envelope-completed"}'
            hmac_signature = "valid_signature_123"

            with patch(
                "app.services.docusign.webhooks.verification.compute_hmac"
            ) as mock_compute:
                mock_compute.return_value = hmac_signature

                result = verify_webhook_hmac(webhook_body, hmac_signature)
                assert result is True

    def test_webhook_verification_invalid_signature(self, app: Flask):
        """Test webhook with invalid HMAC signature"""
        from app.services.docusign.webhooks.verification import verify_webhook_hmac

        with app.app_context():
            webhook_body = '{"event":"envelope-completed"}'
            hmac_signature = "invalid_signature"

            with patch(
                "app.services.docusign.webhooks.verification.compute_hmac"
            ) as mock_compute:
                mock_compute.return_value = "different_signature"

                result = verify_webhook_hmac(webhook_body, hmac_signature)
                assert result is False

    def test_process_webhook_idempotency(
        self, app: Flask, db_session, sample_agreement
    ):
        """Test webhook processing is idempotent"""
        from app.models import Agreement
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            with patch(
                "app.services.documents.document_library_items.sync_agreement_library_item"
            ):
                agreement = Agreement(**sample_agreement)
                agreement.docusign_envelope_id = "envelope-123"
                agreement.status = "sent"
                db_session.add(agreement)
                db_session.commit()

                webhook_data = {
                    "event": "envelope-completed",
                    "data": {
                        "envelopeId": "envelope-123",
                        "status": "completed",
                        "completedDateTime": "2024-01-01T12:00:00Z",
                    },
                    "generatedDateTime": "2024-01-01T12:00:00Z",
                }

                # Process same webhook twice
                result1 = WebhookProcessor.process_webhook(webhook_data)
                result2 = WebhookProcessor.process_webhook(webhook_data)

                assert result1["success"] is True
                assert result2["success"] is True
                # Verify status is still completed (not changed)
                updated = Agreement.query.get(agreement.id)
                assert updated.status == "completed"

    def test_process_webhook_unknown_envelope(self, app: Flask, db_session):
        """Test webhook for unknown envelope is handled gracefully"""
        from app.services.docusign.webhooks.processor import WebhookProcessor

        with app.app_context():
            webhook_data = {
                "event": "envelope-completed",
                "data": {
                    "envelopeId": "unknown-envelope-456",
                    "status": "completed",
                },
            }

            result = WebhookProcessor.process_webhook(webhook_data)

            # Should not crash, but return error or skip
            assert "success" in result or "error" in result
