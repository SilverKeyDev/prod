"""Unit tests for rate limit storage backends."""

from unittest.mock import MagicMock, patch

from app.utils.security.rate_limit_backend import (
    _allow_request_redis,
    allow_request,
    rate_limit_storage,
    storage_lock,
)


class TestRateLimitBackend:
    def setup_method(self):
        with storage_lock:
            rate_limit_storage.clear()

    def test_memory_backend_allows_under_limit(self):
        assert allow_request("test:key", max_requests=3, window_seconds=60) is True
        assert allow_request("test:key", max_requests=3, window_seconds=60) is True

    def test_memory_backend_blocks_over_limit(self):
        for _ in range(3):
            assert allow_request("test:key", max_requests=3, window_seconds=60) is True
        assert allow_request("test:key", max_requests=3, window_seconds=60) is False

    @patch("app.utils.security.rate_limit_backend.get_shared_redis")
    def test_redis_backend_uses_sorted_set(self, mock_get_redis):
        mock_client = MagicMock()
        mock_pipe = MagicMock()
        mock_client.pipeline.return_value = mock_pipe
        mock_pipe.execute.return_value = [0, True, 2, True]
        mock_get_redis.return_value = mock_client

        assert _allow_request_redis(mock_client, "rate_limit:1.2.3.4:endpoint", 5, 60) is True
        mock_pipe.zremrangebyscore.assert_called_once()
        mock_pipe.zadd.assert_called_once()
        mock_pipe.zcard.assert_called_once()
        mock_pipe.expire.assert_called_once()

    @patch("app.utils.security.rate_limit_backend.get_shared_redis")
    def test_redis_backend_blocks_when_over_limit(self, mock_get_redis):
        mock_client = MagicMock()
        mock_pipe = MagicMock()
        mock_client.pipeline.return_value = mock_pipe
        mock_pipe.execute.return_value = [0, True, 6, True]
        mock_get_redis.return_value = mock_client

        assert _allow_request_redis(mock_client, "rate_limit:1.2.3.4:endpoint", 5, 60) is False
