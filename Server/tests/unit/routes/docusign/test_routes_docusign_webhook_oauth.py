"""DocuSign route tests: webhook and OAuth start."""

from unittest.mock import Mock, patch

from .docusign_route_test_helpers import mock_docusign_user, patch_docusign_get_current_user


class TestDocuSignRoutesWebhookOauth:
    """Webhook and OAuth endpoints."""

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
            data = response.get_json()
            assert data.get("success") is True

    def test_oauth_start_endpoint(self, client):
        """Test GET /api/v1/docusign/oauth/start"""
        with patch_docusign_get_current_user(mock_docusign_user("agent-456", has_agent_role=True)):
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
