"""
Tests for DocuSign API routes
"""

from unittest.mock import Mock, patch

from app.models import Agreement, AgreementParticipant, AgreementRevision, User

from .docusign_route_test_helpers import (
    mock_docusign_user,
    patch_docusign_get_current_user,
    seed_agent_buyer,
)


class TestDocuSignRoutes:
    """Test DocuSign API endpoints (url_prefix /api/v1/docusign)."""

    def test_list_templates_endpoint(self, client, mock_docusign_client):
        """Test GET /api/v1/docusign/templates"""
        with patch_docusign_get_current_user(mock_docusign_user("agent-456", is_agent=True)):
            response = client.get(
                "/api/v1/docusign/templates",
                headers={"Authorization": "Bearer mock_access_token"},
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data.get("success") is True
            assert "templates" in data

    def test_create_agreement_endpoint(self, client, db_session):
        """Test POST /api/v1/docusign/agreements"""
        seed_agent_buyer(db_session)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", is_agent=True)):
            with patch(
                "app.services.documents.document_library_items.attach_library_item_to_agreement"
            ):
                response = client.post(
                    "/api/v1/docusign/agreements",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={
                        "buyer_id": "buyer-789",
                        "title": "Test Agreement",
                        "agreement_type": "offer",
                        "property_address": "123 Main St",
                    },
                )

                assert response.status_code == 201
                data = response.get_json()
                assert data.get("success") is True
                assert data.get("agreement", {}).get("id")

    def test_get_agreement_endpoint(self, client, db_session, sample_agreement):
        """Test GET /api/v1/docusign/agreements/:id"""
        seed_agent_buyer(db_session)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", is_agent=True)):
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)
            db_session.session.commit()

            response = client.get(
                f"/api/v1/docusign/agreements/{agreement.id}",
                headers={"Authorization": "Bearer mock_access_token"},
            )

            assert response.status_code == 200
            data = response.get_json()
            assert data.get("success") is True
            assert data.get("agreement", {}).get("id") == agreement.id

    def test_add_participant_endpoint(self, client, db_session, sample_agreement):
        """Test POST /api/v1/docusign/agreements/:id/participants"""
        seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer",
            email="signer@example.com",
            name="Signer User",
            is_agent=False,
        )
        db_session.session.add(signer)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", is_agent=True)):
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)
            db_session.session.commit()

            response = client.post(
                f"/api/v1/docusign/agreements/{agreement.id}/participants",
                headers={"Authorization": "Bearer mock_access_token"},
                json={"user_id": "signer-123", "role": "signer", "routing_order": 1},
            )

            assert response.status_code == 201
            data = response.get_json()
            assert data.get("success") is True
            assert data.get("participant", {}).get("id")

    def test_send_for_signature_endpoint(
        self, client, db_session, sample_agreement, mock_celery_task
    ):
        """Test POST /api/v1/docusign/agreements/:id/send"""
        seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer-send",
            email="signer@example.com",
            name="Signer User",
            is_agent=False,
        )
        db_session.session.add(signer)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", is_agent=True)):
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)
            db_session.session.flush()

            revision = AgreementRevision(
                agreement_id=agreement.id,
                version_number=1,
                file_path="s3://bucket/key.pdf",
                filename="agreement.pdf",
                file_hash="0" * 64,
                created_by="agent-456",
            )
            db_session.session.add(revision)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                routing_order=1,
            )
            db_session.session.add(participant)
            db_session.session.commit()

            with patch(
                "app.celery.tasks.docusign.send_envelope_task.delay",
                return_value=Mock(id="task-123"),
            ):
                response = client.post(
                    f"/api/v1/docusign/agreements/{agreement.id}/send",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={"signing_method": "embedded"},
                )

            assert response.status_code == 202
            data = response.get_json()
            assert data.get("success") is True
            assert data.get("task_id") == "task-123"

    def test_send_for_signature_includes_envelope_options(
        self, client, db_session, sample_agreement
    ):
        """Optional send body fields are forwarded as the Celery task envelope_options dict."""
        seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer-opts",
            email="signer@example.com",
            name="Signer User",
            is_agent=False,
        )
        db_session.session.add(signer)

        with patch_docusign_get_current_user(mock_docusign_user("agent-456", is_agent=True)):
            agreement = Agreement(**sample_agreement)
            db_session.session.add(agreement)
            db_session.session.flush()

            revision = AgreementRevision(
                agreement_id=agreement.id,
                version_number=1,
                file_path="s3://bucket/key.pdf",
                filename="agreement.pdf",
                file_hash="0" * 64,
                created_by="agent-456",
            )
            db_session.session.add(revision)

            participant = AgreementParticipant(
                agreement_id=agreement.id,
                user_id="signer-123",
                email="signer@example.com",
                name="Signer User",
                role="signer",
                routing_order=1,
            )
            db_session.session.add(participant)
            db_session.session.commit()

            envelope_notification = {
                "reminders": {
                    "reminder_enabled": True,
                    "reminder_delay": 2,
                    "reminder_frequency": 3,
                }
            }

            with (
                patch(
                    "app.services.docusign.agreements.signature_flow.DocusignClient",
                ) as mock_client_cls,
                patch(
                    "app.celery.tasks.docusign.send_envelope_task.delay",
                    return_value=Mock(id="task-opts"),
                ) as mock_delay,
            ):
                mock_client_cls.return_value = Mock()
                response = client.post(
                    f"/api/v1/docusign/agreements/{agreement.id}/send",
                    headers={"Authorization": "Bearer mock_access_token"},
                    json={
                        "signing_method": "embedded",
                        "envelope_notification": envelope_notification,
                    },
                )

            assert response.status_code == 202
            mock_delay.assert_called_once()
            call_args = mock_delay.call_args[0]
            assert call_args[0] == agreement.id
            assert call_args[1] == "embedded"
            assert call_args[2] == "agent-456"
            opts = call_args[3]
            assert opts["envelope_notification"] == envelope_notification
