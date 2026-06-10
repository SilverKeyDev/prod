"""Additional rate-limit tests for scale-readiness (Redis fallback, forwarded IP)."""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest

from app.utils.security.rate_limit_backend import allow_request, rate_limit_storage, storage_lock


@pytest.fixture(autouse=True)
def _clear_rate_limit_storage():
    with storage_lock:
        rate_limit_storage.clear()
    yield
    with storage_lock:
        rate_limit_storage.clear()


class TestRateLimitRedisFallback:
    @patch("app.utils.security.rate_limit_backend.get_shared_redis")
    def test_redis_pipeline_error_falls_back_to_memory(self, mock_get_redis):
        mock_client = MagicMock()
        mock_pipe = MagicMock()
        mock_client.pipeline.return_value = mock_pipe
        mock_pipe.execute.side_effect = RuntimeError("redis unavailable")
        mock_get_redis.return_value = mock_client

        assert allow_request("fallback:key", max_requests=2, window_seconds=60) is True
        assert allow_request("fallback:key", max_requests=2, window_seconds=60) is True
        assert allow_request("fallback:key", max_requests=2, window_seconds=60) is False

    @patch("app.utils.security.rate_limit_backend.get_shared_redis")
    def test_allow_request_uses_redis_when_configured(self, mock_get_redis):
        mock_client = MagicMock()
        mock_pipe = MagicMock()
        mock_client.pipeline.return_value = mock_pipe
        mock_pipe.execute.return_value = [0, True, 1, True]
        mock_get_redis.return_value = mock_client

        assert allow_request("redis:key", max_requests=5, window_seconds=60) is True
        mock_client.pipeline.assert_called_once()


class TestRateLimitUsesForwardedIp:
    def test_maps_script_rate_limit_uses_x_forwarded_for(self, client):
        with patch.dict(os.environ, {"GOOGLE_MAPS_API_KEY": "test-maps-key"}):
            for _ in range(60):
                response = client.get(
                    "/api/maps/script",
                    headers={"X-Forwarded-For": "203.0.113.99"},
                )
                assert response.status_code == 200

            blocked = client.get(
                "/api/maps/script",
                headers={"X-Forwarded-For": "203.0.113.99"},
            )
            assert blocked.status_code == 429

            # Different forwarded IP should not inherit the limit (in-memory backend in tests).
            allowed = client.get(
                "/api/maps/script",
                headers={"X-Forwarded-For": "203.0.113.100"},
            )
            assert allowed.status_code == 200
