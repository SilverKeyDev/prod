"""Auth behavior for messaging SSE stream."""

from unittest.mock import patch


class TestAgentChatsStreamAuth:
    def test_stream_returns_401_without_user(self, client):
        with patch("app.utils.common_patterns.get_current_user", return_value=None):
            response = client.get("/api/v1/agent/chats/stream")
        assert response.status_code == 401
