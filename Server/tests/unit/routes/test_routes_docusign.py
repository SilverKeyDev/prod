"""
Tests for DocuSign API routes
"""

from contextlib import ExitStack, contextmanager
from unittest.mock import Mock, patch

from app.models import Agreement, AgreementParticipant, AgreementRevision, User

# Handlers use `from app.services.auth import get_current_user`; patch each import site.
_DOCUSIGN_GET_CURRENT_USER_TARGETS = (
    "app.routes.documents.docusign.handlers.templates.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_routes.crud.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_routes.participants.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_routes.signing_urls.get_current_user",
    "app.routes.documents.docusign.handlers.agreement_actions.get_current_user",
    "app.routes.documents.docusign.handlers.oauth.get_current_user",
)


@contextmanager
def _patch_docusign_get_current_user(user: Mock):
    with ExitStack() as stack:
        for target in _DOCUSIGN_GET_CURRENT_USER_TARGETS:
            stack.enter_context(patch(target, return_value=user))
        yield


def _mock_user(user_id: str, *, is_agent: bool = False, email: str | None = None) -> Mock:
    u = Mock()
    u.id = user_id
    u.is_agent = is_agent
    u.email = email or f"{user_id}@example.com"
    return u


def _seed_agent_buyer(db_session) -> tuple[User, User]:
    agent = User(
        id="agent-456",
        cognito_id="cognito-agent-ds",
        email="agent-ds@example.com",
        name="DocuSign Agent",
        is_agent=True,
    )
    buyer = User(
        id="buyer-789",
        cognito_id="cognito-buyer-ds",
        email="buyer-ds@example.com",
        name="DocuSign Buyer",
        is_agent=False,
    )
    db_session.session.add(agent)
    db_session.session.add(buyer)
    db_session.session.commit()
    return agent, buyer


class TestDocuSignRoutes:
    """Test DocuSign API endpoints (url_prefix /api/v1/docusign)."""

    def test_list_templates_endpoint(self, client, mock_docusign_client):
        """Test GET /api/v1/docusign/templates"""
        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
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
        _seed_agent_buyer(db_session)

        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
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
        _seed_agent_buyer(db_session)

        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
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
        _seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer",
            email="signer@example.com",
            name="Signer User",
            is_agent=False,
        )
        db_session.session.add(signer)

        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
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
        _seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer-send",
            email="signer@example.com",
            name="Signer User",
            is_agent=False,
        )
        db_session.session.add(signer)

        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
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

    def test_void_agreement_endpoint(self, client, db_session, sample_agreement):
        """Test POST /api/v1/docusign/agreements/:id/void"""
        _seed_agent_buyer(db_session)

        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
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

    def test_get_signing_url_endpoint(self, client, db_session, sample_agreement):
        """Test POST /api/v1/docusign/agreements/:id/signing-url"""
        _seed_agent_buyer(db_session)

        signer = User(
            id="signer-123",
            cognito_id="cognito-signer-su",
            email="signer@example.com",
            name="Signer User",
            is_agent=False,
        )
        db_session.session.add(signer)

        with _patch_docusign_get_current_user(_mock_user("signer-123", is_agent=False)):
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

    def test_webhook_endpoint(self, client):
        """Test POST /api/v1/webhooks/docusign/connect"""
        with (
            patch(
                "app.routes.documents.docusign.handlers.webhooks.verify_webhook",
                return_value=True,
            ),
            patch(
                "app.celery.tasks.docusign.process_webhook_task.delay",
                return_value=Mock(id="wh-task"),
            ),
        ):
            response = client.post(
                "/api/v1/webhooks/docusign/connect",
                json={
                    "event": "envelope-completed",
                    "envelopeId": "env-123",
                },
                headers={"X-DocuSign-Signature-1": "signature_123"},
            )

            assert response.status_code == 200

    def test_oauth_start_endpoint(self, client):
        """Test GET /api/v1/docusign/oauth/start"""
        with _patch_docusign_get_current_user(_mock_user("agent-456", is_agent=True)):
            with patch(
                "app.routes.documents.docusign.handlers.oauth.DocusignOAuthService.build_auth_url",
                return_value=("https://account-d.docusign.com/oauth/auth?...", "state-abc"),
            ):
                response = client.get(
                    "/api/v1/docusign/oauth/start",
                    headers={"Authorization": "Bearer mock_access_token"},
                )

            assert response.status_code == 200
            data = response.get_json()
            assert data.get("success") is True
            assert "auth_url" in data
