"""DocuSign route HTTP error envelope tests (shard 6)."""

from unittest.mock import patch

from .docusign_route_test_helpers import mock_docusign_user, patch_docusign_get_current_user


def _assert_error_envelope(data: dict, *, status_code: int, response) -> None:
    assert response.status_code == status_code
    assert data["success"] is False
    assert "error" in data
    assert "message" in data
    assert "error_id" in data


class TestDocuSignRouteHttpErrors:
    def test_list_templates_non_agent_returns_forbidden_envelope(self, client):
        with patch_docusign_get_current_user(mock_docusign_user("buyer-1")):
            response = client.get(
                "/api/v1/docusign/templates",
                headers={"Authorization": "Bearer mock_access_token"},
            )

        data = response.get_json()
        _assert_error_envelope(data, status_code=403, response=response)
        assert data["error"] == "FORBIDDEN"

    def test_oauth_start_non_agent_returns_forbidden_envelope(self, client):
        with patch_docusign_get_current_user(mock_docusign_user("buyer-1")):
            response = client.get(
                "/api/v1/docusign/oauth/start",
                headers={"Authorization": "Bearer mock_access_token"},
            )

        data = response.get_json()
        _assert_error_envelope(data, status_code=403, response=response)
        assert data["error"] == "FORBIDDEN"

    def test_webhook_verification_failure_returns_unauthorized_envelope(self, client):
        with patch(
            "app.routes.documents.docusign.handlers.webhooks.verify_webhook",
            return_value=False,
        ):
            response = client.post(
                "/api/v1/webhooks/docusign/connect",
                json={"event": "envelope-completed", "envelopeId": "env-123"},
                headers={"X-DocuSign-Signature-1": "bad-signature"},
            )

        data = response.get_json()
        _assert_error_envelope(data, status_code=401, response=response)
        assert data["error"] == "UNAUTHORIZED"

    def test_webhook_invalid_payload_returns_validation_envelope(self, client):
        with patch(
            "app.routes.documents.docusign.handlers.webhooks.verify_webhook",
            return_value=True,
        ):
            response = client.post(
                "/api/v1/webhooks/docusign/connect",
                json={"event": "envelope-completed"},
                headers={"X-DocuSign-Signature-1": "signature_123"},
            )

        data = response.get_json()
        _assert_error_envelope(data, status_code=400, response=response)
        assert data["error"] == "validation_error"

    def test_oauth_callback_missing_params_returns_invalid_request(self, client):
        response = client.get("/api/v1/docusign/oauth/callback")

        data = response.get_json()
        _assert_error_envelope(data, status_code=400, response=response)
        assert data["error"] == "INVALID_REQUEST"
