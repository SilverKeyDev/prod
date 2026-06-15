"""
Tests for DocuSign envelope signing
"""

import pytest
from flask import Flask


class TestSigningService:
    """Test DocuSign signing operations"""

    def test_get_signing_url_embedded(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Embedded signing URL uses create_recipient_view with return URL."""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService

        with app.app_context():
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
                routing_order=1,
                docusign_recipient_id="recipient-123",
            )
            db_session.session.add(participant)
            db_session.session.commit()

            url = SigningService.get_signing_url(agreement, participant)

            assert url is not None
            assert isinstance(url, str)
            mock_docusign_client.return_value.create_recipient_view.assert_called_once()

    def test_get_signing_url_missing_envelope(self, app: Flask, db_session):
        """Getting signing URL without envelope ID raises AgreementStateError."""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService
        from app.services.docusign.errors import AgreementStateError

        with app.app_context():
            agreement = Agreement(
                id="agreement-123",
                transaction_id="tx-docusign-fixture",
                agent_id="agent-456",
                buyer_id="buyer-789",
                title="Test Agreement",
                agreement_type="offer",
                status="draft",
            )
            agreement.docusign_envelope_id = None
            db_session.session.add(agreement)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
            )
            db_session.session.add(participant)
            db_session.session.commit()

            with pytest.raises(AgreementStateError):
                SigningService.get_signing_url(agreement, participant)

    def test_get_sender_view_url(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """Sender view URL delegates to DocuSign client get_sender_view."""
        from app.models import Agreement
        from app.services.docusign.envelopes.signing import SigningService

        with app.app_context():
            agreement = Agreement(**sample_agreement)
            agreement.docusign_envelope_id = "envelope-123"
            agreement.status = "sent"
            db_session.session.add(agreement)
            db_session.session.commit()

            url = SigningService.get_sender_view_url(agreement)

            assert url is not None
            assert "docusign.net" in url
            mock_docusign_client.return_value.get_sender_view.assert_called_once()

    def test_docusign_client_create_envelope_mocked(self, app: Flask, mock_docusign_client):
        """Smoke: mocked client wraps create_envelope for unit tests."""
        from app.services.docusign.core.client import DocusignClient

        with app.app_context():
            client = DocusignClient(auth_type="jwt")
            result = client.create_envelope({"emailSubject": "Please sign"})

        assert result["envelope_id"] == "mock-envelope-123"
        mock_docusign_client.return_value.create_envelope.assert_called_once()

    def test_get_signing_url_builds_return_url_for_recipient_view(
        self, app: Flask, db_session, sample_agreement, mock_docusign_client
    ):
        """create_recipient_view receives a return_url derived from agreement id."""
        from app.models import Agreement, AgreementParticipant
        from app.services.docusign.envelopes.signing import SigningService

        with app.app_context():
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

            SigningService.get_signing_url(agreement, participant)

            call = mock_docusign_client.return_value.create_recipient_view.call_args
            assert call is not None
            _args, kwargs = call
            return_url = kwargs.get("return_url") if kwargs else None
            if return_url is None and len(_args) >= 3:
                return_url = _args[2]
            assert return_url is not None
            assert str(agreement.id) in return_url

    def test_get_envelope_delegates_to_mock(self, app: Flask, mock_docusign_client):
        """Smoke: get_envelope uses the shared mocked DocuSign client."""
        from app.services.docusign.core.client import DocusignClient

        with app.app_context():
            client = DocusignClient(auth_type="jwt")
            env = client.get_envelope("env-xyz")

        assert env["status"] == "sent"
        mock_docusign_client.return_value.get_envelope.assert_called_once()
