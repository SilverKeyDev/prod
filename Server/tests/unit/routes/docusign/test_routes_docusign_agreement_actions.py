"""DocuSign route tests: resend, notification, void, discard, signing URL."""

from unittest.mock import patch

from app.models import Agreement, AgreementParticipant, User

from .docusign_route_test_helpers import (
    mock_docusign_user,
    patch_docusign_get_current_user,
    seed_agent_buyer,
)


class TestDocuSignRoutesAgreementActions:
    """Agreement action endpoints under /api/v1/docusign/agreements."""

    def test_resend_recipient_endpoint(self, client, db_session, sample_agreement):
        """POST /agreements/:id/resend delegates to recipient delivery (DB email)."""
        seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer-rs",
            email="signer@example.com",
            name="Signer User",
        )
        db_session.session.add(signer)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", has_agent_role=True)):
            agreement = Agreement(**sample_agreement)
            agreement.status = "sent"
            agreement.docusign_envelope_id = "env-abc"
            db_session.session.add(agreement)
            db_session.session.flush()

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                routing_order=1,
                recipient_status="sent",
            )
            db_session.session.add(participant)
            db_session.session.commit()

            with patch(
                "app.routes.documents.docusign.handlers.agreement_actions.resend_agreement_recipient",
                return_value={"result": "ok"},
            ) as mock_resend:
                response = client.post(
                    f"/api/v1/docusign/agreements/{agreement.id}/resend",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={"participant_id": participant.id, "note": "Please sign"},
                )

            assert response.status_code == 200
            data = response.get_json()
            assert data.get("success") is True
            mock_resend.assert_called_once_with(
                agreement.id,
                participant.id,
                "Please sign",
            )

    def test_update_envelope_notification_endpoint(self, client, db_session, sample_agreement):
        """PUT /agreements/:id/notification updates DocuSign reminder settings."""
        seed_agent_buyer(db_session)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", has_agent_role=True)):
            agreement = Agreement(**sample_agreement)
            agreement.status = "delivered"
            agreement.docusign_envelope_id = "env-def"
            db_session.session.add(agreement)
            db_session.session.commit()

            ds_notif = {"useAccountDefaults": False, "reminders": {"reminderEnabled": True}}
            with patch(
                "app.routes.documents.docusign.handlers.agreement_actions.update_agreement_envelope_notification",
                return_value=ds_notif,
            ) as mock_upd:
                response = client.put(
                    f"/api/v1/docusign/agreements/{agreement.id}/notification",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={"reminders": {"reminder_enabled": True}},
                )

            assert response.status_code == 200
            data = response.get_json()
            assert data.get("success") is True
            assert data.get("notification") == ds_notif
            mock_upd.assert_called_once()

    def test_void_agreement_endpoint(self, client, db_session, sample_agreement):
        """Test POST /api/v1/docusign/agreements/:id/void"""
        seed_agent_buyer(db_session)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", has_agent_role=True)):
            with patch("app.services.documents.document_library_items.sync_agreement_library_item"):
                agreement = Agreement(**sample_agreement)
                agreement.status = "draft"
                db_session.session.add(agreement)
                db_session.session.commit()

                with patch(
                    "app.routes.documents.docusign.handlers.agreement_actions.AgreementLifecycleService.void_agreement",
                ) as mock_void:
                    response = client.post(
                        f"/api/v1/docusign/agreements/{agreement.id}/void",
                        headers={"Authorization": "Bearer mock_access_token"},
                        json={"reason": "Testing void"},
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data.get("success") is True
                    mock_void.assert_called_once()

    def test_discard_agreement_endpoint(self, client, db_session, sample_agreement):
        """Test POST /api/v1/docusign/agreements/:id/discard"""
        seed_agent_buyer(db_session)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", has_agent_role=True)):
            with patch("app.services.documents.document_library_items.sync_agreement_library_item"):
                agreement = Agreement(**sample_agreement)
                agreement.status = "draft"
                db_session.session.add(agreement)
                db_session.session.commit()

                with patch(
                    "app.routes.documents.docusign.handlers.agreement_actions.AgreementLifecycleService.discard_agreement_as_agent",
                ) as mock_discard:
                    response = client.post(
                        f"/api/v1/docusign/agreements/{agreement.id}/discard",
                        headers={"Authorization": "Bearer mock_access_token"},
                        json={"reason": "Testing discard"},
                    )

                    assert response.status_code == 200
                    data = response.get_json()
                    assert data.get("success") is True
                    mock_discard.assert_called_once()

    def test_get_signing_url_endpoint(self, client, db_session, sample_agreement):
        """Test POST /api/v1/docusign/agreements/:id/signing-url"""
        seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer-su",
            email="signer@example.com",
            name="Signer User",
        )
        db_session.session.add(signer)

        with patch_docusign_get_current_user(mock_docusign_user("signer-123")):
            with patch(
                "app.routes.documents.docusign.handlers.agreement_routes.signing_urls.AgreementLifecycleService.get_signing_url",
                return_value="https://demo.docusign.net/Signing/StartInSession.aspx?...",
            ):
                agreement = Agreement(**sample_agreement)
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

                response = client.post(
                    f"/api/v1/docusign/agreements/{agreement.id}/signing-url",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={"participant_id": participant.id},
                )

                assert response.status_code == 200
                data = response.get_json()
                assert data.get("success") is True
                assert "signing_url" in data
