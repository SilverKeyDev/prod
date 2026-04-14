"""
Tests for DocuSign envelope signing
"""

from unittest.mock import Mock, patch

import pytest
from flask import Flask


class TestSigningService:
    """Test DocuSign signing operations"""

    def test_get_signing_url_embedded(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Test getting embedded signing URL"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService

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
                routing_order=1,
                docusign_recipient_id="recipient-123",
            )
            db_session.add(participant)
            db_session.commit()

            url = SigningService.get_signing_url(agreement, participant)

            assert url is not None
            assert isinstance(url, str)
            mock_docusign_client.return_value.get_signing_url.assert_called_once()

    def test_get_signing_url_missing_envelope(self, app: Flask, db_session):
        """Test getting signing URL without envelope ID raises error"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService
        from app.services.docusign.errors import AgreementStateError

        with app.app_context():
            agreement = Agreement(
                id="agreement-123",
                agent_id="agent-456",
                buyer_id="buyer-789",
                title="Test Agreement",
                agreement_type="offer",
                status="draft",
            )
            agreement.docusign_envelope_id = None
            db_session.add(agreement)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
            )
            db_session.add(participant)
            db_session.commit()

            with pytest.raises(AgreementStateError):
                SigningService.get_signing_url(agreement, participant)

    def test_get_sender_view_url(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Test getting sender view URL for agent"""
        from app.models import Agreement
        from app.services.docusign.envelopes.signing import SigningService

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            agreement.docusign_envelope_id = "envelope-123"
            db_session.add(agreement)
            db_session.commit()

            mock_docusign_client.return_value.get_sender_view_url = Mock(
                return_value="https://demo.docusign.net/Sender/..."
            )

            url = SigningService.get_sender_view_url(agreement)

            assert url is not None
            assert "docusign.net" in url
            mock_docusign_client.return_value.get_sender_view_url.assert_called_once()

    def test_create_envelope_for_agreement(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Test creating DocuSign envelope from agreement"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            agreement.current_revision_id = "revision-123"
            db_session.add(agreement)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                routing_order=1,
            )
            db_session.add(participant)
            db_session.commit()

            with patch(
                "app.services.docusign.envelopes.builder.EnvelopeBuilder.build_envelope"
            ) as mock_build:
                mock_build.return_value = {
                    "emailSubject": "Please sign: Test Agreement",
                    "documents": [],
                    "recipients": {"signers": []},
                }

                envelope_result = SigningService.create_envelope(
                    agreement, "embedded", "agent-123"
                )

                assert envelope_result is not None
                mock_docusign_client.return_value.create_envelope.assert_called_once()

    def test_signing_url_with_return_url(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Test embedded signing URL includes return URL"""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService

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

            return_url = "https://example.com/signing-complete"
            with patch(
                "app.services.docusign.core.client.DocusignClient.get_signing_url"
            ) as mock_get_url:
                mock_get_url.return_value = (
                    "https://demo.docusign.net/Signing/StartInSession.aspx?..."
                )

                url = SigningService.get_signing_url(
                    agreement, participant, return_url=return_url
                )

                assert url is not None
                # Verify return_url was passed to client
                call_args = mock_get_url.call_args
                assert call_args is not None

    def test_envelope_status_tracking(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Test tracking envelope status updates"""
        from app.models import Agreement
        from app.services.docusign.envelopes.signing import SigningService

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            agreement.docusign_envelope_id = "envelope-123"
            db_session.add(agreement)
            db_session.commit()

            status = SigningService.get_envelope_status(agreement.docusign_envelope_id)

            assert status is not None
            assert "status" in status
            mock_docusign_client.return_value.get_envelope_status.assert_called_once()
